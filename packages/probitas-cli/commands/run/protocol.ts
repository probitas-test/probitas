/**
 * Worker communication protocol for scenario execution
 *
 * @module
 */

import type { ScenarioResult, StepResult } from "@probitas/runner";
import type { ScenarioMetadata, StepMetadata } from "@probitas/core";
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
  | WorkerTerminateInput;

/**
 * Run a scenario from a file
 */
export interface WorkerRunInput {
  readonly type: "run";
  /** Unique task ID for correlation */
  readonly taskId: string;
  /** Absolute path to scenario file */
  readonly filePath: string;
  /** Index of scenario within file (for files with multiple scenarios) */
  readonly scenarioIndex: number;
  /** Timeout in milliseconds (undefined = no timeout) */
  readonly timeout?: number;
}

/**
 * Terminate the worker
 */
export interface WorkerTerminateInput {
  readonly type: "terminate";
}

/**
 * Message sent from worker to main thread
 */
export type WorkerOutput =
  | WorkerResultOutput
  | WorkerErrorOutput
  | WorkerReadyOutput
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
 * Scenario execution completed successfully
 */
export interface WorkerResultOutput {
  readonly type: "result";
  /** Task ID for correlation */
  readonly taskId: string;
  /** Scenario execution result */
  readonly result: ScenarioResult;
}

/**
 * Scenario execution failed with error
 */
export interface WorkerErrorOutput {
  readonly type: "error";
  /** Task ID for correlation */
  readonly taskId: string;
  /** Serialized error information */
  readonly error: ErrorObject;
}

/**
 * Scenario execution started
 */
export interface WorkerScenarioStartOutput {
  readonly type: "scenario_start";
  /** Task ID for correlation */
  readonly taskId: string;
  /** Scenario metadata (serializable) */
  readonly scenario: ScenarioMetadata;
}

/**
 * Scenario execution completed
 */
export interface WorkerScenarioEndOutput {
  readonly type: "scenario_end";
  /** Task ID for correlation */
  readonly taskId: string;
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
  /** Task ID for correlation */
  readonly taskId: string;
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
  /** Task ID for correlation */
  readonly taskId: string;
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
  if (error instanceof Error) {
    return toErrorObject(error);
  }
  return {
    proto: "Error",
    name: "Error",
    message: String(error),
    attributes: {},
  };
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
