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
 * const reporter = new ListReporter({
 *   theme: colorTheme,  // Optional: customize colors
 * });
 * const runner = new Runner(reporter);
 * await runner.run(scenarios);
 * ```
 */

import type {
  ScenarioDefinition,
  Source,
  StepDefinition,
} from "@probitas/scenario";
import type { Reporter, RunResult, StepResult } from "@probitas/runner";
import { Writer, type WriterOptions } from "./writer.ts";
import { defaultTheme, type Theme } from "./theme.ts";
import { formatSource } from "./utils/source.ts";

/**
 * Options for ListReporter initialization.
 */
export interface ListReporterOptions extends WriterOptions {
  /**
   * Custom theme for styling output.
   * If not provided, uses defaultTheme (or noColorTheme if Deno.noColor is set).
   */
  theme?: Theme;
}

/**
 * Reporter that outputs test results in a flat list format.
 *
 * Features:
 * - Real-time per-step output as tests execute
 * - Status indicators (✓ passed, ✗ failed, ⊘ skipped)
 * - Source location information
 * - Execution timing for each step
 * - Skip reasons for conditional skips
 * - Error messages and stack traces for failures
 * - Summary statistics
 * - Semantic coloring via Theme
 *
 * @example
 * ```ts
 * const reporter = new ListReporter();
 * const runner = new Runner(reporter);
 * const result = await runner.run(scenarios);
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
  #theme: Theme;

  /**
   * Create a new ListReporter.
   *
   * @param options - Configuration (output stream, theme)
   */
  constructor(options: ListReporterOptions = {}) {
    this.#writer = new Writer(options);
    this.#theme = options.theme ?? defaultTheme;
  }

  #writeln(...terms: string[]): Promise<void> {
    const text = terms.join(" ");
    return this.#writer.write(`${text}\n`);
  }

  #formatSource(source?: Source): string {
    return this.#theme.dim(formatSource(source, {
      prefix: "(",
      suffix: ")",
    }));
  }

  #formatTime(duration: number): string {
    return `${this.#theme.info(`[${duration.toFixed(3)}ms]`)}`;
  }

  async onStepEnd(
    scenario: ScenarioDefinition,
    _step: StepDefinition,
    result: StepResult,
  ): Promise<void> {
    const icon = result.status === "passed"
      ? this.#theme.success("✓")
      : result.status === "skipped"
      ? this.#theme.skip("⊘")
      : this.#theme.failure("✗");
    const source = this.#formatSource(result.metadata.source);
    const time = this.#formatTime(result.duration);
    const skipReason = result.status === "skipped"
      ? this.#theme.warning(getErrorMessage(result.error))
      : "";
    await this.#writeln(
      icon,
      scenario.name,
      this.#theme.dim(">"),
      result.metadata.name,
      source,
      time,
      skipReason,
    );
  }

  /**
   * Called when run ends - output summary
   *
   * @param summary The execution summary
   */
  async onRunEnd(
    _scenarios: readonly ScenarioDefinition[],
    result: RunResult,
  ): Promise<void> {
    const { passed, skipped, failed, scenarios, total, duration } = result;
    await this.#writeln(`\n${this.#theme.title("Summary")}`);
    await this.#writeln(
      `  ${this.#theme.success("✓")} ${passed} scenarios passed`,
    );

    if (skipped > 0) {
      await this.#writeln(
        `  ${this.#theme.skip("⊘")} ${skipped} scenarios skipped`,
      );
    }

    if (failed > 0) {
      await this.#writeln(
        `  ${this.#theme.failure("✗")} ${failed} scenarios failed`,
      );
      await this.#writeln("");
      await this.#writeln(`${this.#theme.title("Failed Tests")}`);

      const failedScenarios = scenarios.filter((s) => s.status === "failed");
      for (const scenario of failedScenarios) {
        // Show failed steps
        const failedSteps = scenario.steps.filter((s) => s.status === "failed");
        for (const step of failedSteps) {
          const source = this.#formatSource(step.metadata.source);
          const time = this.#formatTime(step.duration);
          await this.#writeln(
            `  ${this.#theme.failure("✗")}`,
            scenario.metadata.name,
            this.#theme.dim(">"),
            step.metadata.name,
            source,
            time,
          );
          // Show error details for failed steps
          if (step.status === "failed" && "error" in step && step.error) {
            await this.#writeln("");
            const message = getErrorMessage(step.error);
            await this.#writeln(`    ${this.#theme.failure(message)}`);
            if (step.error instanceof Error && step.error.stack) {
              const stack = step.error.stack.split("\n")
                .slice(1) // Skip first line (already shown as message)
                .join("\n")
                .trim();
              if (stack) {
                await this.#writeln("");
                for (const line of stack.split("\n")) {
                  await this.#writeln(`    ${this.#theme.dim(line)}`);
                }
              }
            }
            await this.#writeln("");
          }
        }
      }
    }

    await this.#writeln(
      `${total} scenarios total`,
      this.#theme.info(`[${duration.toFixed(3)}ms]`),
    );
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message) {
      return `${err.name}: ${err.message}`;
    }
    if (err.cause) {
      return `${err.name}: ${getErrorMessage(err.cause)}`;
    }
    return err.name;
  }
  return String(err);
}
