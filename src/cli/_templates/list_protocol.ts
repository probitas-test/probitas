/**
 * Subprocess communication protocol for list command
 *
 * @module
 */

import type { ErrorObject } from "@core/errorutil/error-object";
import { createOutputValidator } from "./utils.ts";

/**
 * Input sent to subprocess via IPC
 */
export interface ListInput {
  /** File paths to load scenarios from */
  readonly filePaths: readonly string[];
  /** Selectors to filter scenarios (empty array = no filtering) */
  readonly selectors: readonly string[];
}

/**
 * Output from subprocess via IPC
 */
export type ListOutput =
  | ListResultOutput
  | ListErrorOutput;

/**
 * Successful list result
 */
export interface ListResultOutput {
  readonly type: "result";
  /** Scenario metadata list */
  readonly scenarios: readonly ScenarioMeta[];
}

/**
 * Error during list operation
 */
export interface ListErrorOutput {
  readonly type: "error";
  /** Serialized error information */
  readonly error: ErrorObject;
}

/**
 * Scenario metadata for list output
 */
export interface ScenarioMeta {
  readonly name: string;
  readonly tags: readonly string[];
  readonly steps: number;
  readonly file: string;
}

/**
 * Type guard to check if a value is a valid ListOutput
 */
export const isListOutput = createOutputValidator<ListOutput>([
  "result",
  "error",
]);
