/**
 * List Reporter
 *
 * Outputs test results in a flat list format with detailed information
 * for each step.
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
 * List Reporter - outputs results in flat list format
 */
export class ListReporter extends BaseReporter {
  #currentScenario?: string;

  /**
   * Initialize List reporter
   *
   * @param options Configuration options
   */
  constructor(options: ReporterOptions = {}) {
    super(options);
  }

  /**
   * Called when scenario starts - track current scenario name
   *
   * @param scenario The scenario being executed
   */
  override onScenarioStart(scenario: ScenarioDefinition): Promise<void> {
    this.#currentScenario = scenario.name;
    return Promise.resolve();
  }

  /**
   * Called when step completes - output result line
   *
   * @param step The step definition
   * @param result The step execution result
   */
  override async onStepEnd(
    _step: StepDefinition,
    result: StepResult,
  ): Promise<void> {
    const icon = this.theme.success("✓");
    const location = result.metadata.location
      ? ` ${
        this.theme.dim(
          `(${result.metadata.location.file}:${result.metadata.location.line})`,
        )
      }`
      : "";
    const time = ` ${this.theme.dim(`[${result.duration.toFixed(3)}ms]`)}`;
    const retries = result.retries > 0
      ? this.theme.warning(` (${result.retries}回リトライ)`)
      : "";

    await this.write(
      `${icon} ${this.#currentScenario} ${this.theme.dim(">")} ` +
        `${result.metadata.name}${location}${time}${retries}\n`,
    );
  }

  /**
   * Called when step fails - output error details
   *
   * @param step The step definition
   * @param error The error that occurred
   */
  override async onStepError(
    step: StepDefinition,
    error: Error,
  ): Promise<void> {
    const icon = this.theme.failure("✗");
    const location = step.location
      ? ` ${this.theme.dim(`(${step.location.file}:${step.location.line})`)}`
      : "";

    await this.write(
      `${icon} ${this.#currentScenario} ${this.theme.dim(">")} ` +
        `${step.name}${location}\n`,
    );
    await this.write(`  ${this.theme.failure(error.message)}\n`);

    // Show first 3 lines of stack trace
    if (error.stack) {
      const sanitizedStack = this.sanitizeStack(error.stack);
      const stackLines = sanitizedStack.split("\n").slice(1, 4);
      for (const line of stackLines) {
        await this.write(`  ${this.theme.dim(line.trim())}\n`);
      }
    }
  }

  /**
   * Called when scenario is skipped
   *
   * @param scenario The scenario being skipped
   * @param reason Reason for skipping
   */
  override async onScenarioSkip(
    scenario: ScenarioDefinition,
    reason: string,
  ): Promise<void> {
    const location = scenario.location
      ? ` ${
        this.theme.dim(
          `(${scenario.location.file}:${scenario.location.line})`,
        )
      }`
      : "";
    await this.write(
      `${this.theme.skip("⊝")} ${scenario.name}${location} ` +
        `${this.theme.dim(`# ${reason}`)}\n`,
    );
  }

  /**
   * Called when run ends - output summary
   *
   * @param summary The execution summary
   */
  override async onRunEnd(summary: RunSummary): Promise<void> {
    await this.write(`\n${this.theme.title("Summary")}\n`);
    await this.write(
      `  ${this.theme.success("✓")} ${summary.passed} scenarios passed\n`,
    );

    if (summary.failed > 0) {
      await this.write(
        `  ${this.theme.failure("✗")} ${summary.failed} scenarios failed\n`,
      );
      await this.write("\n");
      await this.write(`${this.theme.title("Failed Tests")}\n`);

      const failed = summary.scenarios.filter((s) => s.status === "failed");
      for (const scenario of failed) {
        // Show failed steps
        const failedSteps = scenario.steps.filter((s) => s.status === "failed");
        for (const step of failedSteps) {
          const location = step.metadata.location
            ? ` ${
              this.theme.dim(
                `(${step.metadata.location.file}:${step.metadata.location.line})`,
              )
            }`
            : "";
          await this.write(
            `  ${this.theme.failure("✗")} ` +
              `${scenario.metadata.name} ${this.theme.dim(">")} ` +
              `${step.metadata.name}` +
              `${location}\n`,
          );
        }
      }
    }

    if (summary.skipped > 0) {
      await this.write(
        `  ${this.theme.skip("⊝")} ${summary.skipped} scenarios skipped\n`,
      );
    }

    await this.write(
      `  ${this.theme.dim(`  ${summary.total} scenarios total`)} ${
        this.theme.dim(`[${summary.duration.toFixed(3)}ms]`)
      }\n`,
    );

    await super.onRunEnd(summary);
  }

  // No-op methods for unneeded events
  override async onStepStart(_step: StepDefinition): Promise<void> {
    // no-op
  }

  override async onScenarioEnd(
    _scenario: ScenarioDefinition,
    _result: ScenarioResult,
  ): Promise<void> {
    // no-op
  }
}
