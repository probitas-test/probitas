/**
 * Dot Reporter
 *
 * Outputs simple dot progress representation.
 * One character per scenario: . for pass, F for fail.
 *
 * @module
 */

import type { ScenarioMetadata } from "@probitas/core";
import { formatOrigin } from "@probitas/core/origin";
import type { Reporter, RunResult, ScenarioResult } from "@probitas/runner";
import { Writer, type WriterOptions } from "./writer.ts";
import { defaultTheme, type Theme } from "@probitas/core/theme";

export interface DotReporterOptions extends WriterOptions {
  theme?: Theme;
}

export class DotReporter implements Reporter {
  #writer: Writer;
  #theme: Theme;

  constructor(options: DotReporterOptions = {}) {
    this.#writer = new Writer(options);
    this.#theme = options.theme ?? defaultTheme;
  }

  #write(...terms: string[]): Promise<void> {
    const text = terms.join(" ");
    return this.#writer.write(text);
  }

  #writeln(...terms: string[]): Promise<void> {
    const text = terms.join(" ");
    return this.#writer.write(`${text}\n`);
  }

  async onScenarioEnd(
    _scenario: ScenarioMetadata,
    result: ScenarioResult,
  ): Promise<void> {
    if (result.status === "passed") {
      await this.#write(this.#theme.success("."));
    } else if (result.status === "skipped") {
      await this.#write(this.#theme.skip("S"));
    } else if (result.status === "failed") {
      await this.#write(this.#theme.failure("F"));
    }
  }

  async onRunEnd(
    _scenarios: readonly ScenarioMetadata[],
    result: RunResult,
  ): Promise<void> {
    await this.#write("\n\n");
    const parts = [`${result.passed} passed`];
    if (result.skipped > 0) {
      parts.push(`${result.skipped} skipped`);
    }
    parts.push(`${result.failed} failed`);
    await this.#writeln(`${parts.join(", ")} (${result.duration}ms)`);

    // Show failed tests
    const failed = result.scenarios.filter((s) => s.status === "failed");
    if (failed.length > 0) {
      await this.#writeln("");
      await this.#writeln(`${this.#theme.title("Failed Tests")}\n`);
      for (const scenario of failed) {
        // Show failed steps
        const failedSteps = scenario.steps.filter((s) => s.status === "failed");
        for (const step of failedSteps) {
          const source = formatOrigin(step.metadata.origin, {
            prefix: "(",
            suffix: ")",
          });
          await this.#writeln(
            `  ${this.#theme.failure("✗")}`,
            scenario.metadata.name,
            this.#theme.dim(">"),
            `${step.metadata.name}${source}`,
          );
        }
      }
    }
  }
}
