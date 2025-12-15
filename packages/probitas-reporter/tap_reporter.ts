/**
 * TAP (Test Anything Protocol) Reporter
 *
 * Outputs test results in TAP version 14 format, suitable for CI/CD integration
 * and tool compatibility.
 *
 * @module
 */

import type { ScenarioMetadata, StepMetadata } from "@probitas/scenario";
import type { Reporter, RunResult, StepResult } from "@probitas/runner";
import { Writer, type WriterOptions } from "./writer.ts";
import { sanitizeStack } from "./utils/stack.ts";

export interface TAPReporterOptions extends WriterOptions {
}

export class TAPReporter implements Reporter {
  #writer: Writer;
  #testNumber = 0;
  #totalSteps = 0;
  #skippedScenarioSteps: Map<string, number> = new Map();

  constructor(options: TAPReporterOptions = {}) {
    this.#writer = new Writer(options);
  }

  #writeln(...terms: string[]): Promise<void> {
    const text = terms.join(" ");
    return this.#writer.write(`${text}\n`);
  }

  async onRunStart(
    scenarios: readonly ScenarioMetadata[],
  ): Promise<void> {
    // Store step counts per scenario for skip handling
    for (const scenario of scenarios) {
      const stepCount = scenario.steps.filter((e) => e.kind === "step").length;
      this.#skippedScenarioSteps.set(scenario.name, stepCount);
    }

    // Calculate total number of steps
    this.#totalSteps = scenarios.reduce(
      (sum, s) => sum + s.steps.filter((e) => e.kind === "step").length,
      0,
    );

    await this.#writeln("TAP version 14");
    await this.#writeln(`1..${this.#totalSteps}`);
  }

  /**
   * Called when step completes - output TAP result
   *
   * @param _step The step metadata
   * @param result The step execution result
   * @param scenario The scenario being executed
   */
  async onStepEnd(
    scenario: ScenarioMetadata,
    _step: StepMetadata,
    result: StepResult,
  ): Promise<void> {
    this.#testNumber++;
    const status = result.status !== "failed" ? "ok" : "not ok";
    const directive = result.status === "skipped" ? " # SKIP" : "";

    const testName = `${scenario.name} > ${result.metadata.name}`;

    await this.#writeln(
      `${status} ${this.#testNumber} - ${testName}${directive}`,
    );

    // Output YAML diagnostic for failed tests
    if (result.status === "failed") {
      await this.#writeln("  ---");

      const source = result.metadata.source
        ? `${result.metadata.source.file}:${result.metadata.source.line}`
        : "unknown";

      await this.#writeln(`  source: ${source}`);

      if (result.error) {
        const m = result.error instanceof Error
          ? result.error.message
          : String(result.error);
        await this.#writeln(`  message: ${m}`);

        if (result.error instanceof Error && result.error.stack) {
          const sanitizedStack = sanitizeStack(result.error.stack);
          await this.#writeln(`  stack: |\n`);
          for (const line of sanitizedStack.split("\n")) {
            await this.#writeln(`    ${line}\n`);
          }
        }
      }

      await this.#writeln("  ...");
    }
  }

  onRunEnd(
    _scenarios: readonly ScenarioMetadata[],
    _result: RunResult,
  ): void {
    this.#skippedScenarioSteps.clear();
  }
}
