/**
 * Type definitions for the Runner layer
 *
 * Core types for executing scenario definitions and managing test lifecycle.
 * Re-exports scenario definition types from the scenario module.
 *
 * @module
 */

import type { StepMetadata } from "@probitas/core";

/**
 * Result from executing a single step.
 *
 * StepResult is a discriminated union type - the fields available depend on
 * the status:
 * - "passed": Contains `value` (return value from step function)
 * - "failed": Contains `error` (exception that was thrown)
 * - "skipped": Contains `error` (skip reason)
 *
 * This type design ensures type-safe field access. Reporters should check
 * `result.status` to safely access status-specific fields.
 *
 * @example Passed step result
 * ```ts
 * import type { StepResult } from "@probitas/runner";
 * import type { StepMetadata } from "@probitas/core";
 *
 * const metadata: StepMetadata = { kind: "step", name: "Create user", timeout: 30000, retry: { maxAttempts: 1, backoff: "linear" } };
 * const result: StepResult = {
 *   metadata,
 *   status: "passed",
 *   duration: 150,
 *   value: { userId: "123" }
 * };
 * console.log(result);
 * ```
 *
 * @example Failed step result
 * ```ts
 * import type { StepResult } from "@probitas/runner";
 * import type { StepMetadata } from "@probitas/core";
 *
 * const metadata: StepMetadata = { kind: "step", name: "Validate input", timeout: 30000, retry: { maxAttempts: 1, backoff: "linear" } };
 * const result: StepResult = {
 *   metadata,
 *   status: "failed",
 *   duration: 50,
 *   error: new Error("Invalid email format")
 * };
 * console.log(result);
 * ```
 *
 * @example Skipped step result
 * ```ts
 * import type { StepResult } from "@probitas/runner";
 * import type { StepMetadata } from "@probitas/core";
 *
 * const metadata: StepMetadata = { kind: "step", name: "Optional step", timeout: 30000, retry: { maxAttempts: 1, backoff: "linear" } };
 * const result: StepResult = {
 *   metadata,
 *   status: "skipped",
 *   duration: 0,
 *   error: "Prerequisite not met"
 * };
 * console.log(result);
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
  readonly status: "failed" | "skipped";

  /** Step metadata (serializable, without function) */
  readonly metadata: StepMetadata;

  /** Execution time in milliseconds */
  readonly duration: number;

  /** Error that caused failure (only if status is "failed") */
  readonly error: unknown;
};
