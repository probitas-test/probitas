import { omit } from "@std/collections/omit";
import type { ScenarioDefinition, ScenarioMetadata } from "@probitas/scenario";
import type { Reporter, ScenarioResult, StepResult } from "./types.ts";
import { Skip } from "./skip.ts";
import { StepRunner } from "./step_runner.ts";
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

  #createScenarioMetadata(scenario: ScenarioDefinition): ScenarioMetadata {
    const steps = scenario.steps.map((s) => omit(s, ["fn"]));
    return {
      ...omit(scenario, ["steps"]),
      steps,
    };
  }

  async run(
    scenario: ScenarioDefinition,
    { signal }: RunOptions = {},
  ): Promise<ScenarioResult> {
    this.#reporter.onScenarioStart?.(scenario);
    const stepResults: StepResult[] = [];
    const result = await timeit(() => this.#run(scenario, stepResults, signal));
    const scenarioResult: ScenarioResult = result.status === "passed"
      ? {
        status: "passed",
        duration: result.duration,
        metadata: this.#createScenarioMetadata(scenario),
        steps: stepResults,
      }
      : {
        status: result.error instanceof Skip ? "skipped" : "failed",
        duration: result.duration,
        metadata: this.#createScenarioMetadata(scenario),
        steps: stepResults,
        error: result.error,
      };
    this.#reporter.onScenarioEnd?.(scenario, scenarioResult);
    return scenarioResult;
  }

  async #run(
    scenario: ScenarioDefinition,
    stepResults: StepResult[],
    signal?: AbortSignal,
  ): Promise<void> {
    await using stack = new AsyncDisposableStack();

    const scenarioCtx = createScenarioContext(scenario, signal);
    const stepRunner = new StepRunner(
      this.#reporter,
      scenario,
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
