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
 * Implementation of ScenarioRunner interface
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
      skipped: scenarioResults.filter((r) => r.status === "skipped").length,
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

    // Check skip condition
    const skipResult = await this.#evaluateSkip(scenario.options.skip);
    if (skipResult.shouldSkip) {
      if (reporter?.onScenarioSkip) {
        await reporter.onScenarioSkip(scenario, skipResult.reason);
      }

      return {
        metadata: this.#scenarioToMetadata(scenario, skipResult.shouldSkip),
        status: "skipped",
        duration: performance.now() - startTime,
        steps: [],
      };
    }

    // Notify reporter of scenario start
    if (reporter?.onScenarioStart) {
      await reporter.onScenarioStart(scenario);
    }

    // Create scenario context
    const scenarioCtx = createScenarioContext(scenario, signal);

    // Use a container to capture partial results if an error occurs
    const resultsContainer: { data: StepResult[] } = { data: [] };
    let scenarioError: Error | undefined;

    try {
      // Execute setup
      if (scenario.options.setup) {
        await scenario.options.setup(scenarioCtx);
      }

      // Execute steps
      resultsContainer.data = await this.#executeStepsWithErrorHandling(
        scenario.steps,
        scenarioCtx,
        resultsContainer,
        reporter,
      );
    } catch (error) {
      scenarioError = error instanceof Error ? error : new Error(String(error));
    } finally {
      // Always execute teardown
      if (scenario.options.teardown) {
        await scenario.options.teardown(scenarioCtx);
      }
    }

    const stepResults = resultsContainer.data;

    const duration = performance.now() - startTime;

    // Determine scenario status
    const hasFailedSteps = stepResults.some((r) => r.status === "failed");
    const status = hasFailedSteps || scenarioError ? "failed" : "passed";

    const result: ScenarioResult = {
      metadata: this.#scenarioToMetadata(scenario, false),
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
   * Execute steps with error handling that preserves partial results
   */
  async #executeStepsWithErrorHandling(
    steps: readonly StepDefinition[],
    scenarioCtx: ReturnType<typeof createScenarioContext>,
    resultsContainer: { data: StepResult[] },
    reporter?: Reporter,
  ): Promise<StepResult[]> {
    const results: StepResult[] = [];

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        // Create step context
        const stepCtx = createStepContext({
          index: i,
          previous: results.length > 0
            ? results[results.length - 1].value
            : undefined,
          results: scenarioCtx.results as unknown[],
          store: scenarioCtx.store,
          signal: scenarioCtx.signal,
        });

        const startTime = performance.now();

        // Notify reporter of step start
        if (reporter?.onStepStart) {
          await reporter.onStepStart(step);
        }

        let error: Error | undefined;
        let value: unknown;
        const retries = 0;

        try {
          value = await executeStepWithRetry(step, stepCtx);
          // Accumulate result
          (scenarioCtx.results as unknown[]).push(value);
        } catch (e) {
          error = e instanceof Error ? e : new Error(String(e));
        }

        const duration = performance.now() - startTime;

        const stepResult: StepResult = {
          metadata: this.#stepToMetadata(step),
          status: error ? "failed" : "passed",
          duration,
          retries,
          value: error ? undefined : value,
          error,
        };

        results.push(stepResult);
        resultsContainer.data = results; // Keep container updated

        // Notify reporter about result
        if (error) {
          if (reporter?.onStepError) {
            await reporter.onStepError(step, error);
          }

          // Mark remaining steps as skipped
          for (let j = i + 1; j < steps.length; j++) {
            const skippedStep = steps[j];
            const skippedResult: StepResult = {
              metadata: this.#stepToMetadata(skippedStep),
              status: "skipped",
              duration: 0,
              retries: 0,
            };
            results.push(skippedResult);
            resultsContainer.data = results;

            // Notify reporter of skipped step
            if (reporter?.onStepEnd) {
              await reporter.onStepEnd(skippedStep, skippedResult);
            }
          }

          // Throw the original error
          throw error;
        } else if (reporter?.onStepEnd) {
          await reporter.onStepEnd(step, stepResult);
        }
      }
    } catch (error) {
      // Results have been saved to container before throwing
      throw error;
    }

    return results;
  }

  /**
   * Evaluate skip condition
   */
  async #evaluateSkip(
    skipCondition: ScenarioDefinition["options"]["skip"],
  ): Promise<{ shouldSkip: boolean; reason: string }> {
    if (skipCondition === null) {
      return { shouldSkip: false, reason: "" };
    }

    if (typeof skipCondition === "boolean") {
      return {
        shouldSkip: skipCondition,
        reason: skipCondition ? "Scenario marked as skipped" : "",
      };
    }

    if (typeof skipCondition === "string") {
      return { shouldSkip: true, reason: skipCondition };
    }

    if (typeof skipCondition === "function") {
      const result = await skipCondition();
      if (typeof result === "boolean") {
        return {
          shouldSkip: result,
          reason: result ? "Scenario marked as skipped" : "",
        };
      } else {
        return { shouldSkip: true, reason: result };
      }
    }

    return { shouldSkip: false, reason: "" };
  }

  /**
   * Convert scenario to metadata (serializable form)
   */
  #scenarioToMetadata(
    scenario: ScenarioDefinition,
    isSkipped: boolean,
  ): ScenarioMetadata {
    return {
      name: scenario.name,
      options: {
        tags: scenario.options.tags,
        skip: isSkipped ? true : null,
        stepOptions: scenario.options.stepOptions,
      },
      steps: scenario.steps.map((step) => this.#stepToMetadata(step)),
      location: scenario.location,
    };
  }

  /**
   * Convert step to metadata (serializable form)
   */
  #stepToMetadata(
    step: ScenarioDefinition["steps"][number],
  ): StepMetadata {
    return {
      name: step.name,
      options: step.options,
      location: step.location,
    };
  }
}
