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
  /**
   * Initialize List reporter
   *
   * @param options Configuration options
   */
  constructor(options: ReporterOptions = {}) {
    super(options);
  }

  /**
   * Called when scenario starts
   *
   * @param _scenario The scenario being executed
   */
  override onScenarioStart(_scenario: ScenarioDefinition): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Called when step completes - output result line
   *
   * @param _step The step definition
   * @param result The step execution result
   * @param scenario The scenario being executed
   */
  override async onStepEnd(
    _step: StepDefinition,
    result: StepResult,
    scenario: ScenarioDefinition,
  ): Promise<void> {
    const icon = this.theme.success("✓");
    const location = result.metadata.location
      ? ` ${
        this.theme.dim(
          `(${result.metadata.location.file}:${result.metadata.location.line})`,
        )
      }`
      : "";
    const time = ` ${this.theme.info(`[${result.duration.toFixed(3)}ms]`)}`;

    await this.write(
      `${icon} ${scenario.name} ${this.theme.dim(">")} ` +
        `${result.metadata.name}${location}${time}\n`,
    );
  }

  /**
   * Called when step fails - output error details
   *
   * @param step The step definition
   * @param error The error that occurred
   * @param scenario The scenario being executed
   */
  override async onStepError(
    step: StepDefinition,
    error: Error,
    scenario: ScenarioDefinition,
  ): Promise<void> {
    const icon = this.theme.failure("✗");
    const location = step.location
      ? ` ${this.theme.dim(`(${step.location.file}:${step.location.line})`)}`
      : "";

    await this.write(
      `${icon} ${scenario.name} ${this.theme.dim(">")} ` +
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

    await this.write(
      `  ${this.theme.dim(`  ${summary.total} scenarios total`)} ${
        this.theme.info(`[${summary.duration.toFixed(3)}ms]`)
      }\n`,
    );

    await super.onRunEnd(summary);
  }

  // No-op methods for unneeded events
  override async onStepStart(
    _step: StepDefinition,
    _scenario: ScenarioDefinition,
  ): Promise<void> {
    // no-op
  }

  override async onScenarioEnd(
    _scenario: ScenarioDefinition,
    _result: ScenarioResult,
  ): Promise<void> {
    // no-op
  }
}
