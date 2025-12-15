import type { ScenarioDefinition } from "@probitas/core";
import type { Reporter, ScenarioResult, StepResult } from "./types.ts";
import { Skip } from "./skip.ts";
import { StepRunner } from "./step_runner.ts";
import { toScenarioMetadata } from "./metadata.ts";
import { timeit } from "./utils/timeit.ts";
import { createScenarioContext } from "./context.ts";

export interface RunOptions {
  readonly signal?: AbortSignal;
}

export class ScenarioRunner {
  #reporter: Reporter;

  constructor(reporter: Reporter) {
    this.#reporter = reporter;
  }

  async run(
    scenario: ScenarioDefinition,
    { signal }: RunOptions = {},
  ): Promise<ScenarioResult> {
    const metadata = toScenarioMetadata(scenario);
    this.#reporter.onScenarioStart?.(metadata);
    const stepResults: StepResult[] = [];
    const result = await timeit(() => this.#run(scenario, stepResults, signal));
    const scenarioResult: ScenarioResult = result.status === "passed"
      ? {
        status: "passed",
        duration: result.duration,
        metadata,
        steps: stepResults,
      }
      : {
        status: result.error instanceof Skip ? "skipped" : "failed",
        duration: result.duration,
        metadata,
        steps: stepResults,
        error: result.error,
      };
    this.#reporter.onScenarioEnd?.(metadata, scenarioResult);
    return scenarioResult;
  }

  async #run(
    scenario: ScenarioDefinition,
    stepResults: StepResult[],
    signal?: AbortSignal,
  ): Promise<void> {
    await using stack = new AsyncDisposableStack();

    const scenarioCtx = createScenarioContext(scenario, signal);
    const scenarioMetadata = toScenarioMetadata(scenario);
    const stepRunner = new StepRunner(
      this.#reporter,
      scenarioMetadata,
      scenarioCtx,
    );

    for (const step of scenario.steps) {
      signal?.throwIfAborted();

      const stepResult = await stepRunner.run(step, stack);
      stepResults.push(stepResult);

      if (stepResult.status !== "passed") {
        throw stepResult.error;
      }
    }
  }
}
