import type { Origin } from "../origin.ts";
import type { StepDefinition, StepMetadata, StepOptions } from "./step.ts";

/**
 * Configuration options for scenario execution.
 *
 * Defines metadata and default behavior for an entire scenario.
 *
 * @example
 * ```ts
 * const options: ScenarioOptions = {
 *   tags: ["api", "integration", "slow"],
 *   stepOptions: {
 *     timeout: 60000,
 *     retry: { maxAttempts: 2, backoff: "linear" }
 *   }
 * };
 * ```
 *
 * @see {@linkcode StepOptions} for step-level configuration
 */
export interface ScenarioOptions {
  /**
   * Tags for filtering and organizing scenarios.
   *
   * Tags can be used with the CLI to run specific subsets:
   * ```bash
   * probitas run -s "tag:api"           # Run scenarios tagged "api"
   * probitas run -s "tag:api,tag:fast"  # Run scenarios with both tags
   * probitas run -s "!tag:slow"         # Exclude slow scenarios
   * ```
   */
  readonly tags?: readonly string[];

  /**
   * Default options applied to all steps in this scenario.
   *
   * Individual steps can override these defaults by specifying
   * their own options in the `.step()` call.
   */
  readonly stepOptions?: StepOptions;
}

/**
 * Complete, immutable definition of a scenario.
 *
 * This is the core type produced by the builder and consumed by the runner.
 * It contains everything needed to execute a scenario: its name, options,
 * and ordered sequence of entries (steps, resources, setups).
 *
 * @remarks
 * Scenario definitions are:
 * - **Immutable**: The entries array is frozen after creation
 * - **Self-contained**: All options have defaults applied
 * - **Portable**: Can be serialized (minus functions) for tooling
 *
 * @example Typical scenario structure
 * ```ts
 * import type { ScenarioDefinition } from "@probitas/core";
 *
 * // Created by: scenario("Login Flow").step(...).build()
 * const definition: ScenarioDefinition = {
 *   name: "Login Flow",
 *   tags: ["auth", "smoke"],
 *   steps: [
 *     {
 *       kind: "resource",
 *       name: "api",
 *       fn: () => fetch,
 *       timeout: 30000,
 *       retry: { maxAttempts: 1, backoff: "linear" },
 *     },
 *     {
 *       kind: "step",
 *       name: "Login",
 *       fn: () => {},
 *       timeout: 30000,
 *       retry: { maxAttempts: 1, backoff: "linear" },
 *     },
 *     {
 *       kind: "step",
 *       name: "Verify",
 *       fn: () => {},
 *       timeout: 30000,
 *       retry: { maxAttempts: 1, backoff: "linear" },
 *     },
 *   ],
 *   origin: { path: "/tests/auth.probitas.ts", line: 5 },
 * };
 * console.log(definition);
 * ```
 */
export interface ScenarioDefinition {
  /** Human-readable scenario name (displayed in reports and CLI) */
  readonly name: string;

  /**
   * Tags for filtering and organizing scenarios.
   *
   * Tags can be used with the CLI to run specific subsets:
   * ```bash
   * probitas run -s "tag:api"           # Run scenarios tagged "api"
   * probitas run -s "tag:api,tag:fast"  # Run scenarios with both tags
   * probitas run -s "!tag:slow"         # Exclude slow scenarios
   * ```
   */
  readonly tags: readonly string[];

  /** Ordered sequence of entries (resources → setups → steps) */
  readonly steps: readonly StepDefinition[];

  /** Origin where the scenario was defined */
  readonly origin?: Origin;
}

/**
 * Serializable scenario metadata (without executable functions).
 *
 * Used by the JSON reporter and tooling to output scenario information
 * without including non-serializable function references.
 *
 * @example JSON reporter output
 * ```json
 * {
 *   "name": "Login Flow",
 *   "options": { "tags": ["auth"], "stepOptions": { ... } },
 *   "entries": [
 *     { "kind": "step", "value": { "name": "Login", "options": { ... } } }
 *   ],
 *   "origin": { "path": "/tests/auth.probitas.ts", "line": 5 }
 * }
 * ```
 */
export interface ScenarioMetadata {
  /** Scenario name */
  readonly name: string;

  /**
   * Tags for filtering and organizing scenarios.
   *
   * Tags can be used with the CLI to run specific subsets:
   * ```bash
   * probitas run -s "tag:api"           # Run scenarios tagged "api"
   * probitas run -s "tag:api,tag:fast"  # Run scenarios with both tags
   * probitas run -s "!tag:slow"         # Exclude slow scenarios
   * ```
   */
  readonly tags: readonly string[];

  /** Entry metadata (functions omitted for serialization) */
  readonly steps: readonly StepMetadata[];

  /** Origin where the scenario was defined */
  readonly origin?: Origin;
}
