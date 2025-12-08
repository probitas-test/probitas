import { chunk } from "@std/collections/chunk";
import type { ScenarioDefinition } from "@probitas/scenario";
import type {
  Reporter,
  RunOptions,
  RunResult,
  ScenarioResult,
} from "./types.ts";
import { ScenarioRunner } from "./scenario_runner.ts";

import { timeit } from "./utils/timeit.ts";

/**
 * Top-level test runner that orchestrates execution of multiple scenarios.
 *
 * The Runner manages:
 * - Parallel execution with concurrency control (`maxConcurrency`)
 * - Early stopping on failures (`maxFailures`)
 * - Test lifecycle events through the Reporter interface
 * - Aggregated results in RunResult
 *
 * @example
 * ```ts
 * const reporter = new ListReporter();
 * const runner = new Runner(reporter);
 *
 * const result = await runner.run(scenarios, {
 *   maxConcurrency: 4,
 *   maxFailures: 1,
 * });
 * ```
 */
export class Runner {
  /**
   * Create a new Runner with the given reporter.
   *
   * @param reporter - Reporter instance for lifecycle events
   */
  constructor(readonly reporter: Reporter) {}

  /**
   * Execute all scenarios and return aggregated results.
   *
   * Emits events through the Reporter:
   * 1. `onRunStart` - Before execution starts
   * 2. For each scenario (concurrently):
   *    - Delegates to ScenarioRunner for scenario-level execution
   *    - ScenarioRunner emits scenario and step level events
   * 3. `onRunEnd` - After all scenarios complete with RunResult
   *
   * @param scenarios - Scenarios to execute
   * @param options - Execution options (maxConcurrency, maxFailures, signal)
   * @returns Aggregated results with pass/fail/skip counts
   */
  async run(
    scenarios: readonly ScenarioDefinition[],
    options?: RunOptions,
  ): Promise<RunResult> {
    await this.reporter.onRunStart?.(scenarios);

    // Create abort controller for outer context
    const controller = new AbortController();
    const { signal } = controller;
    options?.signal?.addEventListener("abort", () => controller.abort());

    // Execute scenarios
    const maxConcurrency = options?.maxConcurrency ?? 0;
    const maxFailures = options?.maxFailures ?? 0;

    const scenarioResults: ScenarioResult[] = [];
    const result = await timeit(() =>
      this.#run(scenarios, scenarioResults, maxConcurrency, maxFailures, signal)
    );

    // Calculate summary
    const total = scenarios.length;
    const passed = scenarioResults.filter((r) => r.status === "passed").length;
    const failed = scenarioResults.filter((r) => r.status === "failed").length;
    const skipped = total - passed - failed;
    const runResult: RunResult = {
      total,
      passed,
      failed,
      skipped,
      duration: result.duration,
      scenarios: scenarioResults,
    };

    await this.reporter.onRunEnd?.(scenarios, runResult);

    return runResult;
  }

  async #run(
    scenarios: readonly ScenarioDefinition[],
    scenarioResults: ScenarioResult[],
    maxConcurrency: number,
    maxFailures: number,
    signal?: AbortSignal,
  ): Promise<void> {
    // Parallel execution with concurrency control
    // maxConcurrency=1 means sequential execution
    const concurrency = maxConcurrency || scenarios.length;
    const scenarioRunner = new ScenarioRunner(this.reporter);

    let failureCount = 0;
    for (const batch of chunk(scenarios, concurrency)) {
      signal?.throwIfAborted();
      await Promise.all(
        batch.map(async (scenario) => {
          signal?.throwIfAborted();
          const scenarioResult = await scenarioRunner.run(
            scenario,
            { signal },
          );
          scenarioResults.push(scenarioResult);
          if (scenarioResult.status === "failed") {
            failureCount++;
            if (maxFailures !== 0 && failureCount >= maxFailures) {
              throw scenarioResult.error;
            }
          }
        }),
      );
    }
  }
}
