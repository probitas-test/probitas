/**
 * JSON Reporter
 *
 * Outputs test results in JSONLine format (one JSON object per line)
 * for easy parsing and integration with external tools.
 *
 * @module
 */

import type { ScenarioDefinition, StepDefinition } from "@probitas/scenario";
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
    scenarios: readonly ScenarioDefinition[],
  ): Promise<void> {
    await this.#put({
      type: "runStart",
      scenarios,
    });
  }

  async onRunEnd(
    scenarios: readonly ScenarioDefinition[],
    result: RunResult,
  ): Promise<void> {
    await this.#put({
      type: "runEnd",
      scenarios,
      result,
    });
  }

  async onScenarioStart(scenario: ScenarioDefinition): Promise<void> {
    await this.#put({
      type: "scenarioStart",
      scenario,
    });
  }

  async onScenarioEnd(
    scenario: ScenarioDefinition,
    result: ScenarioResult,
  ): Promise<void> {
    await this.#put({
      type: "scenarioEnd",
      scenario,
      result,
    });
  }

  async onStepStart(
    scenario: ScenarioDefinition,
    step: StepDefinition,
  ): Promise<void> {
    await this.#put({
      type: "stepStart",
      scenario,
      step,
    });
  }

  async onStepEnd(
    scenario: ScenarioDefinition,
    step: StepDefinition,
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
