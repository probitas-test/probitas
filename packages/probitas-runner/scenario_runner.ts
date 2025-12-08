/**
 * ScenarioRunner - Main test runner implementation
 *
 * Executes scenario definitions with support for parallelism,
 * failure strategies, and reporter integration.
 *
 * @module
 */

import { getLogger } from "@probitas/logger";
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
import { Skip } from "./skip.ts";

const logger = getLogger("probitas", "runner");

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

    logger.info("Starting scenario run", {
      scenarioCount: scenarios.length,
      maxConcurrency: options?.maxConcurrency ?? 0,
      maxFailures: options?.maxFailures ?? 0,
    });

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

    logger.info("Scenario run completed", {
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      skipped: summary.skipped,
      duration: summary.duration,
    });

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

    logger.debug("Starting scenario", {
      name: scenario.name,
      file: scenario.source?.file,
    });

    // Notify reporter of scenario start
    if (reporter?.onScenarioStart) {
      await reporter.onScenarioStart(scenario);
    }

    // Use AsyncDisposableStack for resource and setup cleanup management
    await using stack = new AsyncDisposableStack();

    // Use a container to capture partial results if an error occurs
    const resultsContainer: { data: StepResult[] } = { data: [] };
    let scenarioError: Error | undefined;
    let skipReason: string | undefined;

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
      // Log resource initialization phase
      const resourceCount = scenario.entries.filter((e) =>
        e.kind === "resource"
      ).length;
      if (resourceCount > 0) {
        logger.debug("Initializing resources", {
          scenario: scenario.name,
          resourceCount,
        });
      }

      // Log setup functions phase
      const setupCount = scenario.entries.filter((e) => e.kind === "setup")
        .length;
      if (setupCount > 0) {
        logger.debug("Running setup functions", {
          scenario: scenario.name,
          setupCount,
        });
      }

      // Log steps execution phase
      const stepCount = scenario.entries.filter((e) => e.kind === "step")
        .length;
      if (stepCount > 0) {
        logger.debug("Executing steps", {
          scenario: scenario.name,
          stepCount,
        });
      }

      for (const entry of scenario.entries) {
        try {
          switch (entry.kind) {
            case "resource": {
              // Notify reporter of resource start
              if (reporter?.onResourceStart) {
                await reporter.onResourceStart(entry.value, scenario);
              }

              try {
                // Initialize resource
                const resourceCtx = createEntryContext();
                const resource = await entry.value.factory(resourceCtx);
                resources[entry.value.name] = resource;

                logger.debug("Resource initialized", {
                  resource: entry.value.name,
                  scenario: scenario.name,
                  resourceValue: resource,
                });

                // Register resource for disposal if it's Disposable
                if (
                  resource &&
                  typeof resource === "object" &&
                  (Symbol.asyncDispose in resource ||
                    Symbol.dispose in resource)
                ) {
                  stack.use(resource as AsyncDisposable | Disposable);
                }

                // Notify reporter of resource end
                if (reporter?.onResourceEnd) {
                  await reporter.onResourceEnd(entry.value, scenario);
                }
              } catch (e) {
                // Skip should propagate without error reporting
                if (e instanceof Skip) {
                  throw e;
                }
                const error = e instanceof Error ? e : new Error(String(e));
                logger.error("Resource initialization failed", {
                  name: entry.value.name,
                  scenario: scenario.name,
                  error: error.message,
                });
                if (reporter?.onResourceError) {
                  await reporter.onResourceError(entry.value, error, scenario);
                }
                throw error;
              }
              break;
            }

            case "setup": {
              // Notify reporter of setup start
              if (reporter?.onSetupStart) {
                await reporter.onSetupStart(entry.value, scenario);
              }

              try {
                // Execute setup function
                const setupCtx = createEntryContext();
                const result = await entry.value.fn(setupCtx);

                logger.debug("Setup function completed", {
                  scenario: scenario.name,
                });

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

                // Notify reporter of setup end
                if (reporter?.onSetupEnd) {
                  await reporter.onSetupEnd(entry.value, scenario);
                }
              } catch (e) {
                // Skip should propagate without error reporting
                if (e instanceof Skip) {
                  throw e;
                }
                const error = e instanceof Error ? e : new Error(String(e));
                logger.error("Setup function failed", {
                  scenario: scenario.name,
                  error: error.message,
                });
                if (reporter?.onSetupError) {
                  await reporter.onSetupError(entry.value, error, scenario);
                }
                throw error;
              }
              break;
            }

            case "step": {
              // Execute step
              const stepDef = entry.value;
              const stepResults = resultsContainer.data;

              const stepCtx = createEntryContext();

              logger.debug("Step context", {
                scenario: scenario.name,
                step: stepDef.name,
                index: stepResults.length,
                previousValue: stepCtx.previous,
                storeKeys: Object.keys(stepCtx.store),
                resourceKeys: Object.keys(stepCtx.resources),
              });

              const stepStartTime = performance.now();

              logger.debug("Executing step", {
                scenario: scenario.name,
                step: stepDef.name,
                index: stepResults.length,
              });

              // Notify reporter of step start
              if (reporter?.onStepStart) {
                await reporter.onStepStart(stepDef, scenario);
              }

              let error: Error | undefined;
              let value: unknown;

              try {
                value = await executeStepWithRetry(stepDef, stepCtx);
                // Accumulate result
                (scenarioCtx.results as unknown[]).push(value);

                logger.debug("Step return value", {
                  scenario: scenario.name,
                  step: stepDef.name,
                  returnValue: value,
                });
              } catch (e) {
                // Skip should not be treated as step error - propagate immediately
                if (e instanceof Skip) {
                  throw e;
                }
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

              logger.debug("Step completed", {
                scenario: scenario.name,
                step: stepDef.name,
                status: stepResult.status,
                duration: stepResult.duration,
              });

              // Notify reporter about result
              if (error) {
                logger.error("Step failed", {
                  scenario: scenario.name,
                  step: stepDef.name,
                  error: error.message,
                });
                if (reporter?.onStepError) {
                  await reporter.onStepError(
                    stepDef,
                    error,
                    stepDuration,
                    scenario,
                  );
                }
                // Stop executing remaining entries
                throw error;
              } else if (reporter?.onStepEnd) {
                await reporter.onStepEnd(stepDef, stepResult, scenario);
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
      if (error instanceof Skip) {
        skipReason = error.reason;
        logger.info("Scenario skipped", {
          name: scenario.name,
          reason: error.reason,
        });
      } else {
        scenarioError = error instanceof Error
          ? error
          : new Error(String(error));
      }
    }

    const stepResults = resultsContainer.data;
    const duration = performance.now() - startTime;

    // Determine scenario status
    const hasFailedSteps = stepResults.some((r) => r.status === "failed");
    const status = skipReason !== undefined
      ? "skipped"
      : hasFailedSteps || scenarioError
      ? "failed"
      : "passed";

    // Notify reporter of skip if skipped
    if (status === "skipped" && reporter?.onScenarioSkip) {
      await reporter.onScenarioSkip(scenario, skipReason, duration);
    }

    const result: ScenarioResult = {
      metadata: this.#scenarioToMetadata(scenario),
      status,
      duration,
      steps: stepResults,
      error: scenarioError,
      skipReason,
    };

    // Notify reporter of scenario end
    if (reporter?.onScenarioEnd) {
      await reporter.onScenarioEnd(scenario, result);
    }

    logger.debug("Scenario completed", {
      name: scenario.name,
      status: result.status,
      duration: result.duration,
    });

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
        tags: scenario.options?.tags,
        stepOptions: scenario.options?.stepOptions,
      },
      entries: scenario.entries,
      source: scenario.source,
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
      source: step.source,
    };
  }
}
