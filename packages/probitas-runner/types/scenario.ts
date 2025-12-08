/**
 * Type definitions for the Runner layer
 *
 * Core types for executing scenario definitions and managing test lifecycle.
 * Re-exports scenario definition types from the scenario module.
 *
 * @module
 */

import type { ScenarioMetadata } from "@probitas/scenario";
import type { StepResult } from "./step.ts";

/**
 * Runtime context for scenario execution.
 *
 * Provides access to scenario metadata, accumulated results, shared storage,
 * and resources during scenario execution. This is the "live" counterpart
 * to the static {@linkcode ScenarioDefinition}.
 *
 * @typeParam Resources - Record of available resource types
 *
 * @example Accessing context in a step
 * ```ts
 * scenario("Context Example")
 *   .step("Use context", (ctx) => {
 *     console.log(`Running: ${ctx.name}`);
 *     console.log(`Tags: ${ctx.options.tags.join(", ")}`);
 *     console.log(`Previous results: ${ctx.results.length}`);
 *   })
 *   .build();
 * ```
 */
export interface ScenarioContext {
  /** Human-readable scenario name */
  readonly name: string;

  readonly tags: readonly string[];

  /** Array of all exec step results so far */
  readonly results: unknown[];

  /** Shared key-value storage for cross-step communication */
  readonly store: Map<string, unknown>;

  /** Named resources registered with `.resource()` */
  readonly resources: Record<string, unknown>;

  /** Abort signal (fires on timeout or manual cancellation) */
  readonly signal?: AbortSignal;
}

/**
 * Result from executing a complete scenario.
 *
 * Contains the overall scenario status, timing, all step results,
 * and any error or skip reason. Passed to reporters and included
 * in the final {@linkcode RunSummary}.
 *
 * @example Passed scenario
 * ```ts
 * const result: ScenarioResult = {
 *   metadata: { name: "Login Flow", options: { ... }, entries: [...] },
 *   status: "passed",
 *   duration: 1250,
 *   steps: [{ status: "passed", ... }, { status: "passed", ... }]
 * };
 * ```
 *
 * @example Skipped scenario
 * ```ts
 * const result: ScenarioResult = {
 *   metadata: { name: "Premium Feature", ... },
 *   status: "skipped",
 *   duration: 5,
 *   steps: [],
 *   skipReason: "Feature flag not enabled"
 * };
 * ```
 */
export type ScenarioResult = {
  readonly status: "passed";

  /** Scenario metadata (serializable, without functions) */
  readonly metadata: ScenarioMetadata;

  /** Total execution time in milliseconds (including setup/teardown) */
  readonly duration: number;

  /** Results from each executed step */
  readonly steps: readonly StepResult[];
} | {
  /** Overall execution outcome */
  readonly status: "failed" | "skipped";

  /** Scenario metadata (serializable, without functions) */
  readonly metadata: ScenarioMetadata;

  /** Total execution time in milliseconds (including setup/teardown) */
  readonly duration: number;

  /** Results from each executed step */
  readonly steps: readonly StepResult[];

  /** Error if failed during resource/setup/teardown (not step errors) */
  readonly error: unknown;
};
