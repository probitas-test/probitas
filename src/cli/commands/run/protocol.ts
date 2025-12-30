/**
 * Worker communication protocol for scenario execution
 *
 * @module
 */

import type { RunResult, ScenarioResult, StepResult } from "@probitas/runner";
import type { ScenarioMetadata, StepMetadata } from "@probitas/core";
import type { LogLevel } from "@logtape/logtape";
import {
  type ErrorObject,
  fromErrorObject,
  isErrorObject,
  toErrorObject,
} from "@core/errorutil/error-object";

/**
 * Message sent from main thread to worker
 */
export type WorkerInput =
  | WorkerRunInput
  | WorkerAbortInput;

/**
 * Run scenarios in worker
 */
export interface WorkerRunInput {
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
  /** Log level for worker logging */
  readonly logLevel: LogLevel;
}

/**
 * Abort running scenarios
 */
export interface WorkerAbortInput {
  readonly type: "abort";
}

/**
 * Message sent from worker to main thread
 */
export type WorkerOutput =
  | WorkerResultOutput
  | WorkerErrorOutput
  | WorkerReadyOutput
  | WorkerRunStartOutput
  | WorkerRunEndOutput
  | WorkerScenarioStartOutput
  | WorkerScenarioEndOutput
  | WorkerStepStartOutput
  | WorkerStepEndOutput;

/**
 * Worker is ready to receive tasks
 */
export interface WorkerReadyOutput {
  readonly type: "ready";
}

/**
 * Run started
 */
export interface WorkerRunStartOutput {
  readonly type: "run_start";
  /** Scenario metadata list (serializable) */
  readonly scenarios: readonly ScenarioMetadata[];
}

/**
 * Run completed
 */
export interface WorkerRunEndOutput {
  readonly type: "run_end";
  /** Scenario metadata list (serializable) */
  readonly scenarios: readonly ScenarioMetadata[];
  /** Run result */
  readonly result: RunResult;
}

/**
 * All scenarios execution completed successfully
 */
export interface WorkerResultOutput {
  readonly type: "result";
  /** Run result with all scenario results */
  readonly result: RunResult;
}

/**
 * Scenario execution failed with error
 */
export interface WorkerErrorOutput {
  readonly type: "error";
  /** Serialized error information */
  readonly error: ErrorObject;
}

/**
 * Scenario execution started
 */
export interface WorkerScenarioStartOutput {
  readonly type: "scenario_start";
  /** Scenario metadata (serializable) */
  readonly scenario: ScenarioMetadata;
}

/**
 * Scenario execution completed
 */
export interface WorkerScenarioEndOutput {
  readonly type: "scenario_end";
  /** Scenario metadata (serializable) */
  readonly scenario: ScenarioMetadata;
  /** Scenario execution result */
  readonly result: ScenarioResult;
}

/**
 * Step execution started
 */
export interface WorkerStepStartOutput {
  readonly type: "step_start";
  /** Scenario metadata (serializable) */
  readonly scenario: ScenarioMetadata;
  /** Step metadata (serializable) */
  readonly step: StepMetadata;
}

/**
 * Step execution completed
 */
export interface WorkerStepEndOutput {
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
 * Serialize StepResult error for transmission
 */
export function serializeStepResult(result: StepResult): StepResult {
  if (result.status === "passed") {
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
 * Deserialize StepResult error from transmission
 */
export function deserializeStepResult(result: StepResult): StepResult {
  if (result.status === "passed") {
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
