/**
 * Type definitions for the Runner layer
 *
 * Core types for executing scenario definitions and managing test lifecycle.
 * Re-exports scenario definition types from the scenario module.
 *
 * @module
 */

import type {
  ScenarioDefinition,
  ScenarioMetadata,
  ScenarioOptions,
  StepDefinition,
  StepMetadata,
} from "@lambdalisue/probitas-scenario";

/**
 * Context provided to scenario setup/teardown
 */
export interface ScenarioContext<
  Resources extends Record<string, unknown> = Record<string, never>,
> {
  /** Scenario name */
  readonly name: string;

  /** Scenario options */
  readonly options: ScenarioOptions;

  /** Accumulated step results */
  readonly results: unknown[];

  /** Shared storage between steps */
  readonly store: Map<string, unknown>;

  /** Abort signal for cancellation */
  readonly signal: AbortSignal;

  /** Available resources */
  readonly resources: Resources;
}

/**
 * Result from executing a single step
 */
export interface StepResult {
  /** Step metadata (serializable) */
  readonly metadata: StepMetadata;

  /** Execution status */
  readonly status: "passed" | "failed";

  /** Execution duration in milliseconds */
  readonly duration: number;

  /** Return value from step (if successful) */
  readonly value?: unknown;

  /** Error (if failed) */
  readonly error?: Error;
}

/**
 * Result from executing a scenario
 */
export interface ScenarioResult {
  /** Scenario metadata (serializable) */
  readonly metadata: ScenarioMetadata;

  /** Execution status */
  readonly status: "passed" | "failed";

  /** Execution duration in milliseconds */
  readonly duration: number;

  /** Results from each step */
  readonly steps: readonly StepResult[];

  /** Error (if failed during setup/teardown) */
  readonly error?: Error;
}

/**
 * Summary of all scenario executions
 */
export interface RunSummary {
  /** Total number of scenarios */
  readonly total: number;

  /** Number of passed scenarios */
  readonly passed: number;

  /** Number of failed scenarios */
  readonly failed: number;

  /** Total execution duration in milliseconds */
  readonly duration: number;

  /** Results for each scenario */
  readonly scenarios: readonly ScenarioResult[];
}

/**
 * Filter for selecting scenarios to run
 */
export interface RunFilter {
  /** Tags to match (AND) */
  readonly tags?: readonly string[];

  /** Pattern to match in scenario name */
  readonly pattern?: string | RegExp;
}

/**
 * Reporter interface for observing test execution
 */
export interface Reporter {
  /**
   * Called when test run starts
   */
  onRunStart(scenarios: readonly ScenarioDefinition[]): void | Promise<void>;

  /**
   * Called when scenario starts
   */
  onScenarioStart(scenario: ScenarioDefinition): void | Promise<void>;

  /**
   * Called when step starts
   */
  onStepStart(step: StepDefinition): void | Promise<void>;

  /**
   * Called when step completes successfully
   */
  onStepEnd(step: StepDefinition, result: StepResult): void | Promise<void>;

  /**
   * Called when step fails
   */
  onStepError(step: StepDefinition, error: Error): void | Promise<void>;

  /**
   * Called when scenario completes
   */
  onScenarioEnd(
    scenario: ScenarioDefinition,
    result: ScenarioResult,
  ): void | Promise<void>;

  /**
   * Called when test run completes
   */
  onRunEnd(summary: RunSummary): void | Promise<void>;
}

/**
 * Options for running scenarios
 */
export interface RunOptions {
  /** Reporter for observing execution */
  readonly reporter?: Reporter;

  /**
   * Maximum number of scenarios to run concurrently
   * - undefined or 0: unlimited (all scenarios in parallel)
   * - 1: sequential execution
   * - N: run up to N scenarios in parallel
   */
  readonly maxConcurrency?: number;

  /**
   * Maximum number of failures before stopping
   * - undefined or Infinity: continue all (never stop)
   * - 1: fail-fast (stop after first failure)
   * - N: stop after N failures
   */
  readonly maxFailures?: number;

  /** Abort signal for cancellation */
  readonly signal?: AbortSignal;
}

// Re-export all scenario definition types
export type {
  Entry,
  EntryMetadata,
  ResourceDefinition,
  ResourceFactory,
  ResourceMetadata,
  ScenarioDefinition,
  ScenarioMetadata,
  ScenarioOptions,
  SetupCleanup,
  SetupDefinition,
  SetupFunction,
  SetupMetadata,
  SourceLocation,
  StepContext,
  StepDefinition,
  StepFunction,
  StepMetadata,
  StepOptions,
} from "@lambdalisue/probitas-scenario";
