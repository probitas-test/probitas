/**
 * List Reporter
 *
 * Outputs test results in a flat list format with detailed information
 * for each step. Shows:
 * - One line per step with status icon, scenario name, step name, source location, and duration
 * - Skip reasons for skipped steps
 * - Error details with stack traces for failed steps
 * - Summary statistics at the end
 *
 * @module
 *
 * @example
 * ```ts
 * import { ListReporter } from "./list_reporter.ts";
 * import { colorTheme } from "@probitas/core/theme";
 *
 * const reporter = new ListReporter({
 *   theme: colorTheme,  // Optional: customize colors
 * });
 * void reporter;
 * ```
 */

import type { ScenarioMetadata, StepMetadata } from "@probitas/core";
import type { Reporter, RunResult, StepResult } from "@probitas/runner";
import { Writer } from "./writer.ts";
import { defaultTheme } from "@probitas/core/theme";
import {
  type FormatContext,
  formatFailedTestsLines,
  formatStepEndLines,
  formatSummaryLines,
} from "./_format.ts";
import type { ReporterOptions } from "./types.ts";

/**
 * Options for ListReporter initialization.
 */
export type ListReporterOptions = ReporterOptions;

/**
 * Reporter that outputs test results in a flat list format.
 *
 * Features:
 * - Real-time per-step output as tests execute
 * - Status indicators (✓ passed, ✗ failed, ⊘ skipped)
 * - Origin location information
 * - Execution timing for each step
 * - Skip reasons for conditional skips
 * - Error messages and stack traces for failures
 * - Summary statistics
 * - Semantic coloring via Theme
 *
 * @example
 * ```ts
 * import { ListReporter } from "./list_reporter.ts";
 *
 * const reporter = new ListReporter();
 * void reporter;
 *
 * // Output:
 * // ✓ Login scenario > Step that passes  (test.ts:15) [10.000ms]
 * // ✓ Login scenario > Another step  (test.ts:20) [5.000ms]
 * // ✗ Payment scenario > Process payment  (test.ts:50) [25.000ms]
 * //   Error: Insufficient funds
 * //   at checkout (test.ts:52)
 * //
 * // Summary
 * //   ✓ 1 scenarios passed
 * //   ✗ 1 scenarios failed
 * ```
 */
export class ListReporter implements Reporter {
  #writer: Writer;
  #ctx: FormatContext;

  /**
   * Create a new ListReporter.
   *
   * @param options - Configuration (output stream, theme, cwd)
   */
  constructor(options: ListReporterOptions = {}) {
    this.#writer = new Writer(options);
    this.#ctx = {
      theme: options.theme ?? defaultTheme,
      cwd: options.cwd,
    };
  }

  #writeln(...terms: string[]): Promise<void> {
    const text = terms.join(" ");
    return this.#writer.write(`${text}\n`);
  }

  async onStepEnd(
    scenario: ScenarioMetadata,
    step: StepMetadata,
    result: StepResult,
  ): Promise<void> {
    const lines = formatStepEndLines(this.#ctx, scenario, step, result);
    // Write all lines at once (atomic)
    await this.#writeln(lines.join("\n"));
  }

  /**
   * Called when run ends - output summary
   *
   * @param scenarios The scenario definitions
   * @param result The execution summary
   */
  async onRunEnd(
    _scenarios: readonly ScenarioMetadata[],
    result: RunResult,
  ): Promise<void> {
    // Output Failed Tests first (if any failures exist)
    const failedLines = formatFailedTestsLines(this.#ctx, result);
    if (failedLines.length > 0) {
      // Write title and body separately for backward-compatible output
      await this.#writeln(failedLines[0]); // empty line
      await this.#writeln(failedLines[1]); // "Failed Tests" title
      // Write body lines atomically
      if (failedLines.length > 2) {
        await this.#writeln(failedLines.slice(2).join("\n"));
      }
    }

    // Output Summary section
    const summaryLines = formatSummaryLines(this.#ctx, result);
    for (const line of summaryLines) {
      await this.#writeln(line);
    }
  }
}
