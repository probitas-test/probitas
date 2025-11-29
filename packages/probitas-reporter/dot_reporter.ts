/**
 * Dot Reporter
 *
 * Outputs simple dot progress representation.
 * One character per scenario: . for pass, F for fail.
 *
 * @module
 */

import { BaseReporter } from "./base_reporter.ts";
import type {
  ReporterOptions,
  RunSummary,
  ScenarioDefinition,
  ScenarioResult,
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
  async onScenarioEnd(
    _scenario: ScenarioDefinition,
    result: ScenarioResult,
  ): Promise<void> {
    if (result.status === "passed") {
      await this.write(this.theme.success("."));
    } else if (result.status === "failed") {
      await this.write(this.theme.failure("F"));
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
      `${summary.passed} scenarios passed, ${summary.failed} scenarios failed (${summary.duration}ms)\n`,
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

    await super.onRunEnd(summary);
  }
}
