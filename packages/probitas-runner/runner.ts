import { chunk } from "@std/collections/chunk";
import type { ScenarioDefinition } from "@probitas/scenario";
import type {
  Reporter,
  RunOptions,
  RunSummary,
  ScenarioResult,
} from "./types.ts";
import { ScenarioRunner } from "./scenario_runner.ts";

import { timeit } from "./utils/timeit.ts";

export class Runner {
  constructor(readonly reporter: Reporter) {}

  async run(
    scenarios: readonly ScenarioDefinition[],
    options?: RunOptions,
  ): Promise<RunSummary> {
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
    const summary: RunSummary = {
      total,
      passed,
      failed,
      skipped,
      duration: result.duration,
      scenarios: scenarioResults,
    };

    await this.reporter.onRunEnd?.(summary);

    return summary;
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
