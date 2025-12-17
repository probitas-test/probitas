/**
 * Type definitions for the Runner layer
 *
 * Core types for executing scenario definitions and managing test lifecycle.
 * Re-exports scenario definition types from the scenario module.
 *
 * @module
 */

import type { ScenarioResult } from "./scenario.ts";

/**
 * Summary of all scenario executions in a test run.
 *
 * Provides aggregate statistics and detailed results for the entire run.
 * Passed to {@linkcode Reporter.onRunEnd} after all scenarios complete.
 *
 * @example
 * ```ts
 * import type { RunResult } from "@probitas/runner";
 *
 * const summary: RunResult = {
 *   total: 10,
 *   passed: 8,
 *   failed: 1,
 *   skipped: 1,
 *   duration: 5432,
 *   scenarios: []
 * };
 *
 * console.log(`${summary.passed}/${summary.total} passed`);
 * // → "8/10 passed"
 * ```
 */
export interface RunResult {
  /** Total number of scenarios in the run */
  readonly total: number;

  /** Number of scenarios that passed */
  readonly passed: number;

  /** Number of scenarios that failed */
  readonly failed: number;

  /** Number of scenarios that were skipped */
  readonly skipped: number;

  /** Total execution time in milliseconds */
  readonly duration: number;

  /** Detailed result for each scenario */
  readonly scenarios: readonly ScenarioResult[];
}

/**
 * Filter configuration for selecting scenarios to run.
 *
 * Allows filtering scenarios by tags and/or name pattern.
 * Both conditions must match if both are specified (AND logic).
 *
 * @example Filter by tags
 * ```ts
 * const filter: RunFilter = {
 *   tags: ["api", "integration"]  // Must have BOTH tags
 * };
 * ```
 *
 * @example Filter by name pattern
 * ```ts
 * const filter: RunFilter = {
 *   pattern: /login/i  // Name must contain "login"
 * };
 * ```
 */
export interface RunFilter {
  /** Tags that scenarios must have (all must match) */
  readonly tags?: readonly string[];

  /** Pattern to match against scenario name */
  readonly pattern?: string | RegExp;
}

/**
 * Configuration options for the scenario runner.
 *
 * Controls execution behavior including concurrency, failure handling,
 * and reporting.
 *
 * @example Sequential execution with fail-fast
 * ```ts
 * import type { RunOptions } from "@probitas/runner";
 *
 * const options: RunOptions = {
 *   maxConcurrency: 1,  // Run one at a time
 *   maxFailures: 1      // Stop after first failure
 * };
 * console.log(options);
 * ```
 *
 * @example Parallel execution with limit
 * ```ts
 * import type { RunOptions } from "@probitas/runner";
 *
 * const options: RunOptions = {
 *   maxConcurrency: 4   // Run up to 4 scenarios at once
 * };
 * console.log(options);
 * ```
 */
export interface RunOptions {
  /**
   * Maximum number of scenarios to run in parallel.
   *
   * - `undefined` or `0`: Unlimited (all scenarios run in parallel)
   * - `1`: Sequential execution (one at a time)
   * - `n`: Run up to n scenarios concurrently
   */
  readonly maxConcurrency?: number;

  /**
   * Maximum number of failures before stopping the run.
   *
   * - `undefined`: Continue all scenarios regardless of failures
   * - `1`: Fail-fast (stop immediately on first failure)
   * - `n`: Stop after n failures
   */
  readonly maxFailures?: number;

  /**
   * Abort signal for external cancellation.
   *
   * When aborted, running scenarios complete but no new ones start.
   */
  readonly signal?: AbortSignal;
}
