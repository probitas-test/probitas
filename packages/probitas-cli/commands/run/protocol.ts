/**
 * Worker communication protocol for scenario execution
 *
 * @module
 */

import type { ScenarioResult, StepResult } from "@probitas/runner";
import type { ScenarioMetadata, StepMetadata } from "@probitas/scenario";

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
  readonly error: SerializedError;
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
 * Serializable error representation
 */
export interface SerializedError {
  readonly name: string;
  readonly message: string;
  readonly stack?: string;
}

/**
 * Serialize an error for transmission
 */
export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    name: "Error",
    message: String(error),
  };
}

/**
 * Deserialize an error from transmission
 */
export function deserializeError(serialized: SerializedError): Error {
  const error = new Error(serialized.message);
  error.name = serialized.name;
  if (serialized.stack) {
    error.stack = serialized.stack;
  }
  return error;
}
