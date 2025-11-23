/**
 * Dot Reporter
 *
 * Outputs simple dot progress representation.
 * One character per scenario: . for pass, F for fail, S for skip.
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
 * Dot Reporter - outputs simple dot format progress
 */
export class DotReporter extends BaseReporter {
  /**
   * Initialize Dot reporter
   *
   * @param options Configuration options
   */
  constructor(options: ReporterOptions = {}) {
    super(options);
  }

  /**
   * Called when scenario completes - output dot
   *
   * @param _scenario The scenario definition
   * @param result The scenario execution result
   */
  override async onScenarioEnd(
    _scenario: ScenarioDefinition,
    result: ScenarioResult,
  ): Promise<void> {
    if (result.status === "passed") {
      await this.write(this.theme.success("."));
    } else if (result.status === "failed") {
      await this.write(this.theme.failure("F"));
    } else if (result.status === "skipped") {
      await this.write(this.theme.skip("S"));
    }
  }

  /**
   * Called when test run completes - output summary
   *
   * @param summary The execution summary
   */
  override async onRunEnd(summary: RunSummary): Promise<void> {
    await this.write("\n\n");
    await this.write(
      `${summary.passed} scenarios passed, ${summary.failed} scenarios failed, ${summary.skipped} scenarios skipped (${summary.duration}ms)\n`,
    );

    // Show failed tests
    const failed = summary.scenarios.filter((s) => s.status === "failed");
    if (failed.length > 0) {
      await this.write("\n");
      await this.write(`${this.theme.title("Failed Tests")}\n`);
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

    // Show skipped tests
    const skipped = summary.scenarios.filter((s) => s.status === "skipped");
    if (skipped.length > 0) {
      await this.write("\n");
      await this.write(`${this.theme.title("Skipped Tests")}\n`);
      for (const scenario of skipped) {
        const location = scenario.metadata.location
          ? ` ${
            this.theme.dim(
              `(${scenario.metadata.location.file}:${scenario.metadata.location.line})`,
            )
          }`
          : "";
        const reason = scenario.metadata.options.skip === true
          ? "Scenario marked as skipped"
          : typeof scenario.metadata.options.skip === "string"
          ? scenario.metadata.options.skip
          : "Scenario marked as skipped";
        await this.write(
          `  ${this.theme.skip("⊝")} ${scenario.metadata.name}${location} ${
            this.theme.dim(`# ${reason}`)
          }\n`,
        );
      }
    }

    await super.onRunEnd(summary);
  }

  // No-op methods for unneeded events
  override async onRunStart(
    _scenarios: readonly ScenarioDefinition[],
  ): Promise<void> {
    // no-op
  }

  override async onScenarioStart(_scenario: ScenarioDefinition): Promise<void> {
    // no-op
  }

  override async onScenarioSkip(
    _scenario: ScenarioDefinition,
    _reason: string,
  ): Promise<void> {
    // no-op
  }

  override async onStepStart(_step: StepDefinition): Promise<void> {
    // no-op
  }

  override async onStepEnd(
    _step: StepDefinition,
    _result: StepResult,
  ): Promise<void> {
    // no-op
  }

  override async onStepError(
    _step: StepDefinition,
    _error: Error,
  ): Promise<void> {
    // no-op
  }
}
