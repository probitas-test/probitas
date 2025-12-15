/**
 * JSON Reporter
 *
 * Outputs test results in JSONLine format (one JSON object per line)
 * for easy parsing and integration with external tools.
 *
 * @module
 */

import type { ScenarioMetadata, StepMetadata } from "@probitas/core";
import type {
  Reporter,
  RunResult,
  ScenarioResult,
  StepResult,
} from "@probitas/runner";
import { Writer, type WriterOptions } from "./writer.ts";

export interface JSONReporterOptions extends WriterOptions {}

export class JSONReporter implements Reporter {
  #writer: Writer;

  constructor(options: JSONReporterOptions = {}) {
    this.#writer = new Writer(options);
  }

  #put(obj: unknown): Promise<void> {
    return this.#writer.write(`${JSON.stringify(obj)}\n`);
  }

  async onRunStart(
    scenarios: readonly ScenarioMetadata[],
  ): Promise<void> {
    await this.#put({
      type: "runStart",
      scenarios,
    });
  }

  async onRunEnd(
    scenarios: readonly ScenarioMetadata[],
    result: RunResult,
  ): Promise<void> {
    await this.#put({
      type: "runEnd",
      scenarios,
      result,
    });
  }

  async onScenarioStart(scenario: ScenarioMetadata): Promise<void> {
    await this.#put({
      type: "scenarioStart",
      scenario,
    });
  }

  async onScenarioEnd(
    scenario: ScenarioMetadata,
    result: ScenarioResult,
  ): Promise<void> {
    await this.#put({
      type: "scenarioEnd",
      scenario,
      result,
    });
  }

  async onStepStart(
    scenario: ScenarioMetadata,
    step: StepMetadata,
  ): Promise<void> {
    await this.#put({
      type: "stepStart",
      scenario,
      step,
    });
  }

  async onStepEnd(
    scenario: ScenarioMetadata,
    step: StepMetadata,
    result: StepResult,
  ): Promise<void> {
    await this.#put({
      type: "stepEnd",
      scenario,
      step,
      result,
    });
  }
}
