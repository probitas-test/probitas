/**
 * List Reporter
 *
 * Outputs test results in a flat list format with detailed information
 * for each step.
 *
 * @module
 */

import { BaseReporter } from "./base_reporter.ts";
import type { ScenarioDefinition, StepDefinition } from "@probitas/scenario";
import type { RunSummary, StepResult } from "@probitas/runner";
import type { ReporterOptions } from "./types.ts";

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
   * Called when step completes - output result line
   *
   * @param _step The step definition
   * @param result The step execution result
   * @param scenario The scenario being executed
   */
  async onStepEnd(
    _step: StepDefinition,
    result: StepResult,
    scenario: ScenarioDefinition,
  ): Promise<void> {
    const icon = this.theme.success("✓");
    const source = result.metadata.source
      ? ` ${
        this.theme.dim(
          `(${result.metadata.source.file}:${result.metadata.source.line})`,
        )
      }`
      : "";
    const time = ` ${this.theme.info(`[${result.duration.toFixed(3)}ms]`)}`;

    await this.write(
      `${icon} ${scenario.name} ${this.theme.dim(">")} ` +
        `${result.metadata.name}${source}${time}\n`,
    );
  }

  /**
   * Called when step fails - output error details
   *
   * @param step The step definition
   * @param error The error that occurred
   * @param duration Step execution duration in milliseconds
   * @param scenario The scenario being executed
   */
  async onStepError(
    step: StepDefinition,
    error: Error,
    duration: number,
    scenario: ScenarioDefinition,
  ): Promise<void> {
    const icon = this.theme.failure("✗");
    const source = step.source
      ? ` ${this.theme.dim(`(${step.source.file}:${step.source.line})`)}`
      : "";
    const time = ` ${this.theme.info(`[${duration.toFixed(3)}ms]`)}`;

    await this.write(
      `${icon} ${scenario.name} ${this.theme.dim(">")} ` +
        `${step.name}${source}${time}\n`,
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
   * @param scenario The scenario that was skipped
   * @param reason Optional skip reason
   * @param duration Scenario execution duration in milliseconds
   */
  async onScenarioSkip(
    scenario: ScenarioDefinition,
    reason: string | undefined,
    duration: number,
  ): Promise<void> {
    const icon = this.theme.skip("⊘");
    const source = scenario.source
      ? ` ${
        this.theme.dim(
          `(${scenario.source.file}:${scenario.source.line})`,
        )
      }`
      : "";
    const reasonText = reason ? ` ${reason}` : "";
    const time = ` ${this.theme.info(`[${duration.toFixed(3)}ms]`)}`;

    await this.write(
      `${icon} ${scenario.name}${source}${reasonText}${time}\n`,
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

    if (summary.skipped > 0) {
      await this.write(
        `  ${this.theme.skip("⊘")} ${summary.skipped} scenarios skipped\n`,
      );
    }

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
          const source = step.metadata.source
            ? ` ${
              this.theme.dim(
                `(${step.metadata.source.file}:${step.metadata.source.line})`,
              )
            }`
            : "";
          await this.write(
            `  ${this.theme.failure("✗")} ` +
              `${scenario.metadata.name} ${this.theme.dim(">")} ` +
              `${step.metadata.name}` +
              `${source}\n`,
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
}
