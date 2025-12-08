/**
 * Type definitions for the Runner layer
 *
 * Core types for executing scenario definitions and managing test lifecycle.
 * Re-exports scenario definition types from the scenario module.
 *
 * @module
 */

import type { StepMetadata } from "@probitas/scenario";

/**
 * Result from executing a single step.
 *
 * Contains the step's execution status, timing, and either the return
 * value (on success) or error (on failure). Used by reporters to display
 * step-level results.
 *
 * @example Passed step result
 * ```ts
 * const result: StepResult = {
 *   metadata: { name: "Create user", options: { ... } },
 *   status: "passed",
 *   duration: 150,
 *   value: { userId: "123" }
 * };
 * ```
 *
 * @example Failed step result
 * ```ts
 * const result: StepResult = {
 *   metadata: { name: "Validate input", options: { ... } },
 *   status: "failed",
 *   duration: 50,
 *   error: new Error("Invalid email format")
 * };
 * ```
 */
export type StepResult = {
  readonly status: "passed";

  /** Step metadata (serializable, without function) */
  readonly metadata: StepMetadata;

  /** Execution time in milliseconds */
  readonly duration: number;

  /** Return value from step function (only if status is "passed") */
  readonly value: unknown;
} | {
  /** Execution outcome: "passed" or "failed" */
  readonly status: "failed";

  /** Step metadata (serializable, without function) */
  readonly metadata: StepMetadata;

  /** Execution time in milliseconds */
  readonly duration: number;

  /** Error that caused failure (only if status is "failed") */
  readonly error: unknown;
};
