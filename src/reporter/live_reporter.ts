/**
 * Live Reporter
 *
 * Outputs test results with real-time progress bar and animated spinner.
 * Best for parallel execution scenarios.
 *
 * @module
 */

import { BaseReporter } from "./base_reporter.ts";
import type {
  ReporterOptions,
  RunSummary,
  ScenarioDefinition,
  ScenarioResult,
  StepDefinition,
  StepResult,
} from "./types.ts";

/**
 * Live Reporter - outputs with real-time progress bar and animation
 */
export class LiveReporter extends BaseReporter {
  #runningSteps = new Map<
    string,
    { scenario: string; step: StepDefinition }
  >();
  #completedSteps: Array<{ scenario: string; step: StepResult }> = [];
  #currentScenario?: string;
  #totalSteps = 0;
  #spinnerFrame = 0;

  /**
   * Initialize Live reporter
   *
   * @param options Configuration options
   */
  constructor(options: ReporterOptions = {}) {
    super(options);
  }

  /**
   * Called when test run starts
   *
   * @param scenarios All scenarios to be run
   */
  override async onRunStart(
    scenarios: readonly ScenarioDefinition[],
  ): Promise<void> {
    await super.onRunStart(scenarios);
    // Calculate total number of steps
    this.#totalSteps = scenarios.reduce(
      (sum, s) => sum + s.steps.length,
      0,
    );
  }

  /**
   * Called when scenario starts - track current scenario
   *
   * @param scenario The scenario being executed
   */
  override onScenarioStart(scenario: ScenarioDefinition): Promise<void> {
    this.#currentScenario = scenario.name;
    return Promise.resolve();
  }

  /**
   * Called when scenario is skipped
   *
   * @param scenario The scenario being skipped
   * @param _reason Reason for skipping
   */
  override async onScenarioSkip(
    scenario: ScenarioDefinition,
    _reason: string,
  ): Promise<void> {
    // Mark all steps as skipped
    for (const step of scenario.steps) {
      this.#completedSteps.push({
        scenario: scenario.name,
        step: {
          metadata: step,
          status: "skipped",
          duration: 0,
          retries: 0,
          error: undefined,
        },
      });
    }
    await this.#render();
  }

  /**
   * Called when step starts
   *
   * @param step The step being executed
   */
  override async onStepStart(step: StepDefinition): Promise<void> {
    const key = `${this.#currentScenario}:${step.name}`;
    this.#runningSteps.set(key, {
      scenario: this.#currentScenario!,
      step: step,
    });
    await this.#render();
  }

  /**
   * Called when step completes
   *
   * @param step The step definition
   * @param result The step execution result
   */
  override async onStepEnd(
    step: StepDefinition,
    result: StepResult,
  ): Promise<void> {
    const key = `${this.#currentScenario}:${step.name}`;
    this.#runningSteps.delete(key);
    this.#completedSteps.push({
      scenario: this.#currentScenario!,
      step: result,
    });
    await this.#render();
  }

  /**
   * Called when step fails
   *
   * @param step The step definition
   * @param _error The error that occurred
   */
  override onStepError(
    step: StepDefinition,
    _error: Error,
  ): Promise<void> {
    const key = `${this.#currentScenario}:${step.name}`;
    this.#runningSteps.delete(key);
    return Promise.resolve();
  }

  /**
   * Called when scenario completes - no-op for live reporter
   *
   * @param _scenario The scenario definition
   * @param _result The scenario execution result
   */
  override async onScenarioEnd(
    _scenario: ScenarioDefinition,
    _result: ScenarioResult,
  ): Promise<void> {
    // no-op
  }

  /**
   * Called when test run completes
   *
   * @param summary The execution summary
   */
  override async onRunEnd(summary: RunSummary): Promise<void> {
    await this.write("\n");
    await this.write(`${this.theme.title("Summary")}\n`);
    await this.write(
      `  ${this.theme.success("✓")} ${summary.passed} scenarios passed\n`,
    );

    if (summary.failed > 0) {
      await this.write(
        `  ${this.theme.failure("✗")} ${summary.failed} scenarios failed\n`,
      );
    }

    if (summary.skipped > 0) {
      await this.write(
        `  ${this.theme.skip("⊝")} ${summary.skipped} scenarios skipped\n`,
      );
    }

    await this.write(
      `  ${
        this.theme.dim(
          `${summary.total} scenarios total [${summary.duration}ms]`,
        )
      }\n`,
    );

    await super.onRunEnd(summary);
  }

  /**
   * Render the current state
   */
  async #render(): Promise<void> {
    // Clear screen
    await this.write("\x1b[2J\x1b[H");

    // Progress bar
    const completed = this.#completedSteps.length;
    const total = this.#totalSteps;
    const percent = total > 0 ? Math.floor((completed / total) * 100) : 0;
    const barWidth = 40;
    const filledWidth = Math.floor((completed / total) * barWidth);
    const emptyWidth = barWidth - filledWidth;
    const bar = this.theme.success("█".repeat(filledWidth)) +
      this.theme.dim("░".repeat(emptyWidth));

    await this.write(`${bar} ${percent}% (${completed}/${total})\n\n`);

    // Running steps
    if (this.#runningSteps.size > 0) {
      await this.write(
        `${this.theme.title("Running")} ${
          this.theme.dim(`(${this.#runningSteps.size})`)
        }\n`,
      );

      const spinner = this.#getSpinner();
      const runningSteps = Array.from(this.#runningSteps.entries())
        .sort((a, b) => a[0].localeCompare(b[0]));
      for (const [, { scenario, step }] of runningSteps) {
        const location = step.location
          ? ` ${
            this.theme.dim(`(${step.location.file}:${step.location.line})`)
          }`
          : "";
        await this.write(
          `  ${this.theme.info(spinner)} ${scenario} ${
            this.theme.dim(">")
          } ${step.name}${location}\n`,
        );
      }
      await this.write("\n");
    }

    // Completed steps
    for (const { scenario, step } of this.#completedSteps) {
      const icon = step.status === "passed"
        ? this.theme.success("✓")
        : step.status === "failed"
        ? this.theme.failure("✗")
        : this.theme.skip("⊝");

      const location = step.metadata.location
        ? ` ${
          this.theme.dim(
            `(${step.metadata.location.file}:${step.metadata.location.line})`,
          )
        }`
        : "";

      const time = this.theme.dim(` [${step.duration}ms]`);

      await this.write(
        `${icon} ${scenario} ${
          this.theme.dim(">")
        } ${step.metadata.name}${location}${time}\n`,
      );
    }
  }

  /**
   * Get current spinner frame
   */
  #getSpinner(): string {
    const frames = ["◐", "◓", "◑", "◒"];
    const frame = frames[this.#spinnerFrame % frames.length];
    this.#spinnerFrame++;
    return frame;
  }
}
