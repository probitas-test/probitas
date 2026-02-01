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

/**
 * Create a JSON replacer that safely handles non-JSON-native types.
 *
 * Tracks the ancestor chain via JSON.stringify's `this` context (the holder
 * object) to distinguish true circular references from shared references.
 * Also converts Error and BigInt which JSON.stringify cannot handle natively.
 */
function createReplacer() {
  const ancestors: unknown[] = [];
  const convertedErrors = new WeakSet<Error>();
  return function (this: unknown, _key: string, value: unknown): unknown {
    if (typeof value === "bigint") {
      return value.toString();
    }
    if (value instanceof Error) {
      if (convertedErrors.has(value)) return "[Circular]";
      convertedErrors.add(value);
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
        cause: value.cause,
      };
    }
    if (typeof value === "object" && value !== null) {
      while (ancestors.length > 0 && ancestors.at(-1) !== this) {
        ancestors.pop();
      }
      if (ancestors.includes(value)) return "[Circular]";
      ancestors.push(value);
    }
    return value;
  };
}

export class JSONReporter implements Reporter {
  #writer: Writer;

  constructor(options: JSONReporterOptions = {}) {
    this.#writer = new Writer(options);
  }

  #put(obj: unknown): Promise<void> {
    return this.#writer.write(`${JSON.stringify(obj, createReplacer())}\n`);
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
