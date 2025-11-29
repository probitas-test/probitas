/**
 * ScenarioRunner - Main test runner implementation
 *
 * Executes scenario definitions with support for parallelism,
 * failure strategies, and reporter integration.
 *
 * @module
 */

import type {
  Reporter,
  RunOptions,
  RunSummary,
  ScenarioDefinition,
  ScenarioMetadata,
  ScenarioResult,
  StepDefinition,
  StepMetadata,
  StepResult,
} from "./types.ts";
import { createScenarioContext, createStepContext } from "./context.ts";
import { executeStepWithRetry } from "./executor.ts";

/**
 * Main scenario runner
 *
 * Executes scenarios with full lifecycle management, filtering, and reporting.
 */
export class ScenarioRunner {
  /**
   * Run scenarios and return execution summary
   *
   * @param scenarios Scenarios to execute
   * @param options Execution options (reporter, concurrency, failure handling)
   * @returns Promise resolving to execution summary
   *
   * @example
   * ```ts
   * const runner = new ScenarioRunner();
   * const summary = await runner.run(scenarios, {
   *   reporter: new ConsoleReporter(),
   *   maxConcurrency: 5,
   *   maxFailures: 1,
   * });
   * ```
   */
  async run(
    scenarios: readonly ScenarioDefinition[],
    options?: RunOptions,
  ): Promise<RunSummary> {
    const startTime = performance.now();
    const reporter = options?.reporter;

    // Notify reporter of run start
    if (reporter?.onRunStart) {
      await reporter.onRunStart(scenarios);
    }

    // Create abort controller for outer context
    const outerController = new AbortController();
    if (options?.signal) {
      options.signal.addEventListener("abort", () => outerController.abort());
    }

    // Execute scenarios
    const maxConcurrency = options?.maxConcurrency ?? 0;
    const maxFailures = options?.maxFailures ?? 0;

    const scenarioResults = await this.#executeScenarios(
      scenarios,
      outerController.signal,
      maxConcurrency,
      maxFailures,
      reporter,
    );

    // Calculate summary
    const duration = performance.now() - startTime;
    const summary: RunSummary = {
      total: scenarioResults.length,
      passed: scenarioResults.filter((r) => r.status === "passed").length,
      failed: scenarioResults.filter((r) => r.status === "failed").length,
      duration,
      scenarios: scenarioResults,
    };

    // Notify reporter of run end
    if (reporter?.onRunEnd) {
      await reporter.onRunEnd(summary);
    }

    return summary;
  }

  /**
   * Execute scenarios according to concurrency and failure limits
   */
  async #executeScenarios(
    scenarios: readonly ScenarioDefinition[],
    signal: AbortSignal,
    maxConcurrency: number,
    maxFailures: number,
    reporter?: Reporter,
  ): Promise<ScenarioResult[]> {
    const results: ScenarioResult[] = [];
    let failureCount = 0;

    // Parallel execution with concurrency control
    // maxConcurrency=1 means sequential execution
    const concurrency = maxConcurrency || scenarios.length;

    for (let i = 0; i < scenarios.length; i += concurrency) {
      if (signal.aborted) break;

      // Check failure limit (0 = continueAll, maxFailures > 0 = stop at limit)
      if (maxFailures > 0 && failureCount >= maxFailures) {
        break;
      }

      const batch = scenarios.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((scenario) =>
          this.#executeScenario(scenario, signal, reporter)
        ),
      );

      for (const result of batchResults) {
        results.push(result);
        if (result.status === "failed") {
          failureCount++;
        }
      }
    }

    return results;
  }

  /**
   * Execute a single scenario
   */
  async #executeScenario(
    scenario: ScenarioDefinition,
    signal: AbortSignal,
    reporter?: Reporter,
  ): Promise<ScenarioResult> {
    const startTime = performance.now();

    // Notify reporter of scenario start
    if (reporter?.onScenarioStart) {
      await reporter.onScenarioStart(scenario);
    }

    // Use AsyncDisposableStack for resource and setup cleanup management
    await using stack = new AsyncDisposableStack();

    // Use a container to capture partial results if an error occurs
    const resultsContainer: { data: StepResult[] } = { data: [] };
    let scenarioError: Error | undefined;

    try {
      // Initialize resources and create scenario context
      const resources: Record<string, unknown> = {};
      const scenarioCtx = createScenarioContext(
        scenario,
        signal,
        resources,
      );
      const createEntryContext = () => {
        const stepValues = scenarioCtx.results as unknown[];
        const previousValue = stepValues.length > 0
          ? stepValues[stepValues.length - 1]
          : undefined;

        return createStepContext({
          index: stepValues.length,
          previous: previousValue,
          results: stepValues as readonly unknown[],
          store: scenarioCtx.store,
          signal: scenarioCtx.signal,
          resources: scenarioCtx.resources,
        });
      };

      // Execute entries in order
      for (const entry of scenario.entries) {
        try {
          switch (entry.kind) {
            case "resource": {
              // Initialize resource
              const resourceCtx = createEntryContext();
              const resource = await entry.value.factory(resourceCtx);
              resources[entry.value.name] = resource;

              // Register resource for disposal if it's Disposable
              if (
                resource &&
                typeof resource === "object" &&
                (Symbol.asyncDispose in resource || Symbol.dispose in resource)
              ) {
                stack.use(resource as AsyncDisposable | Disposable);
              }
              break;
            }

            case "setup": {
              // Execute setup function
              const setupCtx = createEntryContext();
              const result = await entry.value.fn(setupCtx);

              // Register cleanup if function/Disposable/AsyncDisposable returned
              if (result) {
                if (typeof result === "function") {
                  stack.defer(result);
                } else if (
                  typeof result === "object" &&
                  (Symbol.asyncDispose in result || Symbol.dispose in result)
                ) {
                  stack.use(result as AsyncDisposable | Disposable);
                }
              }
              break;
            }

            case "step": {
              // Execute step
              const stepDef = entry.value;
              const stepResults = resultsContainer.data;

              const stepCtx = createEntryContext();

              const stepStartTime = performance.now();

              // Notify reporter of step start
              if (reporter?.onStepStart) {
                await reporter.onStepStart(stepDef);
              }

              let error: Error | undefined;
              let value: unknown;

              try {
                value = await executeStepWithRetry(stepDef, stepCtx);
                // Accumulate result
                (scenarioCtx.results as unknown[]).push(value);
              } catch (e) {
                error = e instanceof Error ? e : new Error(String(e));
              }

              const stepDuration = performance.now() - stepStartTime;

              const stepResult: StepResult = {
                metadata: this.#stepToMetadata(stepDef),
                status: error ? "failed" : "passed",
                duration: stepDuration,
                value: error ? undefined : value,
                error,
              };

              stepResults.push(stepResult);
              resultsContainer.data = stepResults;

              // Notify reporter about result
              if (error) {
                if (reporter?.onStepError) {
                  await reporter.onStepError(stepDef, error);
                }
                // Stop executing remaining entries
                throw error;
              } else if (reporter?.onStepEnd) {
                await reporter.onStepEnd(stepDef, stepResult);
              }
              break;
            }
          }
        } catch (error) {
          // Entry execution failed
          scenarioError = error instanceof Error
            ? error
            : new Error(String(error));
          throw error;
        }
      }
    } catch (error) {
      scenarioError = error instanceof Error ? error : new Error(String(error));
    }

    const stepResults = resultsContainer.data;
    const duration = performance.now() - startTime;

    // Determine scenario status
    const hasFailedSteps = stepResults.some((r) => r.status === "failed");
    const status = hasFailedSteps || scenarioError ? "failed" : "passed";

    const result: ScenarioResult = {
      metadata: this.#scenarioToMetadata(scenario),
      status,
      duration,
      steps: stepResults,
      error: scenarioError,
    };

    // Notify reporter of scenario end
    if (reporter?.onScenarioEnd) {
      await reporter.onScenarioEnd(scenario, result);
    }

    return result;
  }

  /**
   * Convert scenario to metadata (serializable form)
   */
  #scenarioToMetadata(
    scenario: ScenarioDefinition,
  ): ScenarioMetadata {
    return {
      name: scenario.name,
      options: {
        tags: scenario.options.tags,
        stepOptions: scenario.options.stepOptions,
      },
      entries: scenario.entries,
      location: scenario.location,
    };
  }

  /**
   * Convert step to metadata (serializable form)
   */
  #stepToMetadata(
    step: StepDefinition,
  ): StepMetadata {
    return {
      name: step.name,
      options: step.options,
      location: step.location,
    };
  }
}
