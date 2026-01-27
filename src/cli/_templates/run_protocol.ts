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
import type {
  ScenarioMetadata,
  StepMetadata,
  StepOptions,
} from "@probitas/core";
import type { LogLevel } from "@logtape/logtape";
import { isErrorObject } from "@core/errorutil/error-object";
import {
  createOutputValidator,
  deserializeError,
  type ErrorObject,
  serializeError,
} from "./utils.ts";

// Re-export for backward compatibility with consumers
export { deserializeError, type ErrorObject, serializeError } from "./utils.ts";

/**
 * Message sent from CLI to subprocess
 */
export type RunInput =
  | RunCommandInput
  | RunAbortInput;

/**
 * Failed scenario identifier for filtering
 */
export interface FailedScenarioFilter {
  /** Scenario name */
  readonly name: string;
  /** File path (relative or absolute) */
  readonly file: string;
}

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
  /** Default step options (timeout, retry) applied to all steps */
  readonly stepOptions?: StepOptions;
  /** Log level for subprocess logging */
  readonly logLevel: LogLevel;
  /** Filter to only run these failed scenarios (name + file pairs) */
  readonly failedFilter?: readonly FailedScenarioFilter[];
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
 * Serialize StepResult for transmission
 *
 * Handles error serialization (for failed/skipped) to ensure proper
 * cross-process Error transmission. Passed step values are transmitted
 * as-is since CBOR streaming handles all complex types.
 */
export function serializeStepResult(result: StepResult): StepResult {
  if (result.status === "passed") {
    // Value is transmitted directly - CBOR streaming handles all types
    return result;
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
 * Handles error deserialization (for failed/skipped) to restore
 * Error instances from serialized ErrorObject. Passed step values
 * are already deserialized by CBOR streaming.
 */
export function deserializeStepResult(result: StepResult): StepResult {
  if (result.status === "passed") {
    // Value is already deserialized by CBOR streaming
    return result;
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
 * Type guard to check if a value is a valid RunOutput
 */
export const isRunOutput = createOutputValidator<RunOutput>([
  "result",
  "error",
  "run_start",
  "run_end",
  "scenario_start",
  "scenario_end",
  "step_start",
  "step_end",
]);
