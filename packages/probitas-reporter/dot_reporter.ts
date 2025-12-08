/**
 * Dot Reporter
 *
 * Outputs simple dot progress representation.
 * One character per scenario: . for pass, F for fail.
 *
 * @module
 */

import { BaseReporter } from "./base_reporter.ts";
import type { ScenarioDefinition } from "@probitas/scenario";
import type { RunSummary, ScenarioResult } from "@probitas/runner";
import type { ReporterOptions } from "./types.ts";

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
    } else if (result.status === "skipped") {
      await this.write(this.theme.skip("S"));
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
    const parts = [`${summary.passed} passed`];
    if (summary.skipped > 0) {
      parts.push(`${summary.skipped} skipped`);
    }
    parts.push(`${summary.failed} failed`);
    await this.write(`${parts.join(", ")} (${summary.duration}ms)\n`);

    // Show failed tests
    const failed = summary.scenarios.filter((s) => s.status === "failed");
    if (failed.length > 0) {
      await this.write("\n");
      await this.write(`${this.theme.title("Failed Tests")}\n`);
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

    await super.onRunEnd(summary);
  }
}
