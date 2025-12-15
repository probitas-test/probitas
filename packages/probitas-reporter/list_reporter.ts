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
  ScenarioMetadata,
  Source,
  StepMetadata,
} from "@probitas/scenario";
import type { Reporter, RunResult, StepResult } from "@probitas/runner";
import { Writer, type WriterOptions } from "./writer.ts";
import { defaultTheme, type Theme, type ThemeFunction } from "./theme.ts";
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
  /**
   * Base directory for making paths relative in output.
   * If not provided, absolute paths are displayed as-is.
   */
  cwd?: string;
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
  #cwd?: string;

  /**
   * Create a new ListReporter.
   *
   * @param options - Configuration (output stream, theme, cwd)
   */
  constructor(options: ListReporterOptions = {}) {
    this.#writer = new Writer(options);
    this.#theme = options.theme ?? defaultTheme;
    this.#cwd = options.cwd;
  }

  #writeln(...terms: string[]): Promise<void> {
    const text = terms.join(" ");
    return this.#writer.write(`${text}\n`);
  }

  #formatSource(source?: Source): string {
    return this.#theme.dim(formatSource(source, {
      prefix: "(",
      suffix: ")",
      cwd: this.#cwd,
    }));
  }

  #formatTime(duration: number): string {
    return `${this.#theme.info(`[${duration.toFixed(3)}ms]`)}`;
  }

  #getKindChar(kind: "resource" | "setup" | "step"): string {
    switch (kind) {
      case "resource":
        return "r";
      case "setup":
        return "s";
      case "step":
        return "T";
      default:
        return "T";
    }
  }

  #formatKindPrefix(kind: "resource" | "setup" | "step"): string {
    const kindChar = this.#getKindChar(kind);
    return `${this.#theme.dim(kindChar + "┆")}`;
  }

  #formatErrorLine(message: string, color: ThemeFunction): string {
    return `${this.#theme.dim(" ┆")}${color(" └ " + message)}`;
  }

  async onStepEnd(
    scenario: ScenarioMetadata,
    step: StepMetadata,
    result: StepResult,
  ): Promise<void> {
    const kind = step.kind as "resource" | "setup" | "step";
    const kindPrefix = this.#formatKindPrefix(kind);
    const icon = result.status === "passed"
      ? this.#theme.success("✓")
      : result.status === "skipped"
      ? this.#theme.skip("⊘")
      : this.#theme.failure("✗");
    const source = this.#formatSource(result.metadata.source);
    const time = this.#formatTime(result.duration);

    // Format scenario and step names based on kind
    const scenarioName = kind === "step"
      ? scenario.name
      : `${this.#theme.title(this.#theme.lightGray(scenario.name))}`;
    const stepName = kind === "step"
      ? result.metadata.name
      : `${this.#theme.title(this.#theme.lightGray(result.metadata.name))}`;

    // Build all output lines atomically
    const lines: string[] = [];
    lines.push(
      `${kindPrefix} ${icon} ${scenarioName} ${
        this.#theme.dim(">")
      } ${stepName} ${source} ${time}`,
    );

    // Add error or skip message on next line if needed
    if (result.status === "failed" && "error" in result && result.error) {
      const errorMessage = getErrorMessage(result.error)
        .split("\n")
        .at(0) ?? "No error message";
      lines.push(this.#formatErrorLine(errorMessage, this.#theme.failure));
    } else if (
      result.status === "skipped" && "error" in result && result.error
    ) {
      const skipMessage = getErrorMessage(result.error)
        .split("\n")
        .at(0) ?? "Skipped";
      lines.push(this.#formatErrorLine(skipMessage, this.#theme.skip));
    }

    // Write all lines at once (atomic)
    await this.#writeln(lines.join("\n"));
  }

  /**
   * Called when run ends - output summary
   *
   * @param summary The execution summary
   */
  async onRunEnd(
    scenarios: readonly ScenarioMetadata[],
    result: RunResult,
  ): Promise<void> {
    const {
      passed,
      skipped,
      failed,
      scenarios: resultScenarios,
      total,
      duration,
    } = result;
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

      const failedScenarios = resultScenarios.filter((s) =>
        s.status === "failed"
      );
      const failedTestsLines: string[] = [];

      for (const scenario of failedScenarios) {
        // Show failed steps
        const failedSteps = scenario.steps.filter((s) => s.status === "failed");
        for (const step of failedSteps) {
          // Find the step definition to get the kind
          const scenarioDefinition = scenarios.find((s) =>
            s.name === scenario.metadata.name
          );
          const stepDefinition = scenarioDefinition?.steps.find((s) =>
            s.name === step.metadata.name
          );
          const kind = stepDefinition?.kind ?? "step";
          const kindPrefix = this.#formatKindPrefix(
            kind as "resource" | "setup" | "step",
          );

          const source = this.#formatSource(step.metadata.source);
          const time = this.#formatTime(step.duration);
          const icon = this.#theme.failure("✗");

          failedTestsLines.push(
            `${kindPrefix} ${icon} ${scenario.metadata.name} ${
              this.#theme.dim(">")
            } ${step.metadata.name} ${source} ${time}`,
          );

          // Show error details for failed steps
          if (step.status === "failed" && "error" in step && step.error) {
            failedTestsLines.push(`${this.#theme.dim(" ┆")}`);
            const message = getErrorMessage(step.error);
            for (const line of message.split("\n")) {
              failedTestsLines.push(
                `${this.#theme.dim(" ┆")}${this.#theme.failure(`   ${line}`)}`,
              );
            }
            if (step.error instanceof Error && step.error.stack) {
              const stack = step.error.stack.split("\n")
                .slice(1) // Skip first line (already shown as message)
                .join("\n")
                .trim();
              if (stack) {
                failedTestsLines.push(`${this.#theme.dim(" ┆")}`);
                for (const line of stack.split("\n")) {
                  failedTestsLines.push(
                    `${this.#theme.dim(" ┆")}   ${this.#theme.dim(line)}`,
                  );
                }
              }
            }
            // Add empty line after each failed step in Failed Tests section
            failedTestsLines.push("");
          }
        }
      }

      // Write all failed tests at once (atomic)
      if (failedTestsLines.length > 0) {
        await this.#writeln(failedTestsLines.join("\n"));
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
