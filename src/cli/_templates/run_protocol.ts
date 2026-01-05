/**
 * Subprocess communication protocol for scenario execution
 *
 * @module
 */

import type {
  Reporter,
  RunResult,
  ScenarioResult,
  StepResult,
} from "@probitas/runner";
import type { ScenarioMetadata, StepMetadata } from "@probitas/core";
import type { LogLevel } from "@logtape/logtape";
import {
  type ErrorObject,
  fromErrorObject,
  isErrorObject,
  toErrorObject,
} from "@core/errorutil/error-object";
import { deserialize, serialize } from "./serializer.ts";

/**
 * Message sent from CLI to subprocess
 */
export type RunInput =
  | RunCommandInput
  | RunAbortInput;

/**
 * Run scenarios command
 */
export interface RunCommandInput {
  readonly type: "run";
  /** File paths to load scenarios from */
  readonly filePaths: readonly string[];
  /** Selectors to filter scenarios (empty array = no filtering) */
  readonly selectors: readonly string[];
  /** Maximum number of scenarios to run concurrently (0 = no limit) */
  readonly maxConcurrency: number;
  /** Maximum number of failures before stopping (0 = no limit) */
  readonly maxFailures: number;
  /** Timeout in milliseconds (0 = no timeout) */
  readonly timeout: number;
  /** Log level for subprocess logging */
  readonly logLevel: LogLevel;
}

/**
 * Abort running scenarios
 */
export interface RunAbortInput {
  readonly type: "abort";
}

/**
 * Message sent from subprocess to CLI
 */
export type RunOutput =
  | RunResultOutput
  | RunErrorOutput
  | RunStartOutput
  | RunEndOutput
  | RunScenarioStartOutput
  | RunScenarioEndOutput
  | RunStepStartOutput
  | RunStepEndOutput;

/**
 * Run started
 */
export interface RunStartOutput {
  readonly type: "run_start";
  /** Scenario metadata list (serializable) */
  readonly scenarios: readonly ScenarioMetadata[];
}

/**
 * Run completed
 */
export interface RunEndOutput {
  readonly type: "run_end";
  /** Scenario metadata list (serializable) */
  readonly scenarios: readonly ScenarioMetadata[];
  /** Run result */
  readonly result: RunResult;
}

/**
 * All scenarios execution completed successfully
 */
export interface RunResultOutput {
  readonly type: "result";
  /** Run result with all scenario results */
  readonly result: RunResult;
}

/**
 * Scenario execution failed with error
 */
export interface RunErrorOutput {
  readonly type: "error";
  /** Serialized error information */
  readonly error: ErrorObject;
}

/**
 * Scenario execution started
 */
export interface RunScenarioStartOutput {
  readonly type: "scenario_start";
  /** Scenario metadata (serializable) */
  readonly scenario: ScenarioMetadata;
}

/**
 * Scenario execution completed
 */
export interface RunScenarioEndOutput {
  readonly type: "scenario_end";
  /** Scenario metadata (serializable) */
  readonly scenario: ScenarioMetadata;
  /** Scenario execution result */
  readonly result: ScenarioResult;
}

/**
 * Step execution started
 */
export interface RunStepStartOutput {
  readonly type: "step_start";
  /** Scenario metadata (serializable) */
  readonly scenario: ScenarioMetadata;
  /** Step metadata (serializable) */
  readonly step: StepMetadata;
}

/**
 * Step execution completed
 */
export interface RunStepEndOutput {
  readonly type: "step_end";
  /** Scenario metadata (serializable) */
  readonly scenario: ScenarioMetadata;
  /** Step metadata (serializable) */
  readonly step: StepMetadata;
  /** Step execution result */
  readonly result: StepResult;
}

/**
 * Serialize an error for transmission
 */
export function serializeError(error: unknown): ErrorObject {
  const err = error instanceof Error ? error : new Error(String(error));
  return toErrorObject(err);
}

/**
 * Deserialize an error from transmission
 */
export function deserializeError(serialized: ErrorObject): Error {
  return fromErrorObject(serialized);
}

/**
 * Serialize StepResult for transmission
 *
 * Handles both error serialization (for failed/skipped) and value serialization
 * (for passed steps) to ensure all non-JSON-serializable values are converted.
 */
export function serializeStepResult(result: StepResult): StepResult {
  if (result.status === "passed") {
    return {
      ...result,
      value: serialize(result.value),
    };
  }
  return {
    ...result,
    error: serializeError(result.error),
  };
}

/**
 * Serialize ScenarioResult errors for transmission
 */
export function serializeScenarioResult(
  result: ScenarioResult,
): ScenarioResult {
  const steps = result.steps.map(serializeStepResult);
  if (result.status === "passed") {
    return { ...result, steps };
  }
  return {
    ...result,
    steps,
    error: serializeError(result.error),
  };
}

/**
 * Deserialize StepResult from transmission
 *
 * Handles both error deserialization (for failed/skipped) and value deserialization
 * (for passed steps) to restore non-JSON-serializable values.
 */
export function deserializeStepResult(result: StepResult): StepResult {
  if (result.status === "passed") {
    return {
      ...result,
      value: deserialize(result.value),
    };
  }
  if (isErrorObject(result.error)) {
    return {
      ...result,
      error: deserializeError(result.error),
    };
  }
  return result;
}

/**
 * Deserialize ScenarioResult errors from transmission
 */
export function deserializeScenarioResult(
  result: ScenarioResult,
): ScenarioResult {
  const steps = result.steps.map(deserializeStepResult);
  if (result.status === "passed") {
    return { ...result, steps };
  }
  if (isErrorObject(result.error)) {
    return {
      ...result,
      steps,
      error: deserializeError(result.error),
    };
  }
  return { ...result, steps };
}

/**
 * Serialize RunResult errors for transmission
 */
export function serializeRunResult(result: RunResult): RunResult {
  return {
    ...result,
    scenarios: result.scenarios.map(serializeScenarioResult),
  };
}

/**
 * Deserialize RunResult errors from transmission
 */
export function deserializeRunResult(result: RunResult): RunResult {
  return {
    ...result,
    scenarios: result.scenarios.map(deserializeScenarioResult),
  };
}

/**
 * Create a Reporter that sends events via the provided output function
 *
 * This factory eliminates duplication between Worker and Subprocess reporters
 * by extracting the common serialization logic.
 *
 * The output function can be async - all reporter methods will await it.
 */
export function createReporter(
  output: (message: RunOutput) => void | Promise<void>,
): Reporter {
  return {
    async onRunStart(scenarios: readonly ScenarioMetadata[]): Promise<void> {
      await output({ type: "run_start", scenarios });
    },

    async onRunEnd(
      scenarios: readonly ScenarioMetadata[],
      result: RunResult,
    ): Promise<void> {
      await output({
        type: "run_end",
        scenarios,
        result: serializeRunResult(result),
      });
    },

    async onScenarioStart(scenario: ScenarioMetadata): Promise<void> {
      await output({ type: "scenario_start", scenario });
    },

    async onScenarioEnd(
      scenario: ScenarioMetadata,
      result: ScenarioResult,
    ): Promise<void> {
      await output({
        type: "scenario_end",
        scenario,
        result: serializeScenarioResult(result),
      });
    },

    async onStepStart(
      scenario: ScenarioMetadata,
      step: StepMetadata,
    ): Promise<void> {
      await output({ type: "step_start", scenario, step });
    },

    async onStepEnd(
      scenario: ScenarioMetadata,
      step: StepMetadata,
      result: StepResult,
    ): Promise<void> {
      await output({
        type: "step_end",
        scenario,
        step,
        result: serializeStepResult(result),
      });
    },
  };
}

/**
 * Valid RunOutput type values
 */
const RUN_OUTPUT_TYPES = new Set([
  "result",
  "error",
  "run_start",
  "run_end",
  "scenario_start",
  "scenario_end",
  "step_start",
  "step_end",
]);

/**
 * Type guard to check if a value is a valid RunOutput
 */
export function isRunOutput(value: unknown): value is RunOutput {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    typeof value.type === "string" &&
    RUN_OUTPUT_TYPES.has(value.type)
  );
}
