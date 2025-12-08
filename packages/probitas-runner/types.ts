/**
 * Type definitions for the Runner layer
 *
 * Core types for executing scenario definitions and managing test lifecycle.
 * Re-exports scenario definition types from the scenario module.
 *
 * @module
 */

import type {
  ResourceDefinition,
  ScenarioDefinition,
  ScenarioMetadata,
  SetupDefinition,
  StepDefinition,
  StepMetadata,
} from "@probitas/scenario";

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

  /** Array of all step results so far */
  readonly results: unknown[];

  /** Shared key-value storage for cross-step communication */
  readonly store: Map<string, unknown>;

  /** Abort signal (fires on timeout or manual cancellation) */
  readonly signal: AbortSignal;

  /** Named resources registered with `.resource()` */
  readonly resources: Record<string, unknown>;
}

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
export interface StepResult {
  /** Step metadata (serializable, without function) */
  readonly metadata: StepMetadata;

  /** Execution outcome: "passed" or "failed" */
  readonly status: "passed" | "failed";

  /** Execution time in milliseconds */
  readonly duration: number;

  /** Return value from step function (only if status is "passed") */
  readonly value?: unknown;

  /** Error that caused failure (only if status is "failed") */
  readonly error?: Error;
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
export interface ScenarioResult {
  /** Scenario metadata (serializable, without functions) */
  readonly metadata: ScenarioMetadata;

  /** Overall execution outcome */
  readonly status: "passed" | "failed" | "skipped";

  /** Total execution time in milliseconds (including setup/teardown) */
  readonly duration: number;

  /** Results from each executed step */
  readonly steps: readonly StepResult[];

  /** Error if failed during resource/setup/teardown (not step errors) */
  readonly error?: Error;

  /** Reason for skipping (only if status is "skipped") */
  readonly skipReason?: string;
}

/**
 * Summary of all scenario executions in a test run.
 *
 * Provides aggregate statistics and detailed results for the entire run.
 * Passed to {@linkcode Reporter.onRunEnd} after all scenarios complete.
 *
 * @example
 * ```ts
 * const summary: RunSummary = {
 *   total: 10,
 *   passed: 8,
 *   failed: 1,
 *   skipped: 1,
 *   duration: 5432,
 *   scenarios: [...]
 * };
 *
 * console.log(`${summary.passed}/${summary.total} passed`);
 * // → "8/10 passed"
 * ```
 */
export interface RunSummary {
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
 * Reporter interface for observing and reporting test execution.
 *
 * Implement this interface to create custom reporters. All methods are
 * optional - implement only the hooks you need. Methods can be sync or async.
 *
 * Built-in reporters:
 * - {@linkcode ListReporter} - Detailed hierarchical output
 * - {@linkcode DotReporter} - Compact dot notation
 * - {@linkcode TAPReporter} - TAP format for CI integration
 * - {@linkcode JSONReporter} - Machine-readable JSON
 *
 * @example Custom reporter
 * ```ts
 * class MyReporter implements Reporter {
 *   onRunStart(scenarios) {
 *     console.log(`Running ${scenarios.length} scenarios...`);
 *   }
 *
 *   onScenarioEnd(scenario, result) {
 *     const icon = result.status === "passed" ? "✓" : "✗";
 *     console.log(`${icon} ${scenario.name}`);
 *   }
 *
 *   onRunEnd(summary) {
 *     console.log(`\n${summary.passed}/${summary.total} passed`);
 *   }
 * }
 * ```
 */
export interface Reporter {
  /**
   * Called when the test run starts, before any scenarios execute.
   *
   * @param scenarios - All scenarios that will be executed
   */
  onRunStart?(scenarios: readonly ScenarioDefinition[]): void | Promise<void>;

  /**
   * Called when a scenario begins execution.
   *
   * @param scenario - The scenario definition about to run
   */
  onScenarioStart?(scenario: ScenarioDefinition): void | Promise<void>;

  /**
   * Called when resource initialization starts
   *
   * @param resource - The resource definition being initialized
   * @param scenario - The scenario containing the resource
   */
  onResourceStart?(
    resource: ResourceDefinition,
    scenario: ScenarioDefinition,
  ): void | Promise<void>;

  /**
   * Called when resource initialization completes
   *
   * @param resource - The resource definition that completed
   * @param scenario - The scenario containing the resource
   */
  onResourceEnd?(
    resource: ResourceDefinition,
    scenario: ScenarioDefinition,
  ): void | Promise<void>;

  /**
   * Called when resource initialization fails
   *
   * @param resource - The resource definition that failed
   * @param error - The error that occurred
   * @param scenario - The scenario containing the resource
   */
  onResourceError?(
    resource: ResourceDefinition,
    error: Error,
    scenario: ScenarioDefinition,
  ): void | Promise<void>;

  /**
   * Called when setup starts
   *
   * @param setup - The setup definition being executed
   * @param scenario - The scenario containing the setup
   */
  onSetupStart?(
    setup: SetupDefinition,
    scenario: ScenarioDefinition,
  ): void | Promise<void>;

  /**
   * Called when setup completes
   *
   * @param setup - The setup definition that completed
   * @param scenario - The scenario containing the setup
   */
  onSetupEnd?(
    setup: SetupDefinition,
    scenario: ScenarioDefinition,
  ): void | Promise<void>;

  /**
   * Called when setup fails
   *
   * @param setup - The setup definition that failed
   * @param error - The error that occurred
   * @param scenario - The scenario containing the setup
   */
  onSetupError?(
    setup: SetupDefinition,
    error: Error,
    scenario: ScenarioDefinition,
  ): void | Promise<void>;

  /**
   * Called when step starts
   *
   * @param step - The step definition being executed
   * @param scenario - The scenario containing the step (for parallel-safe reporting)
   */
  onStepStart?(
    step: StepDefinition,
    scenario: ScenarioDefinition,
  ): void | Promise<void>;

  /**
   * Called when step completes successfully
   *
   * @param step - The step definition that completed
   * @param result - The step execution result
   * @param scenario - The scenario containing the step (for parallel-safe reporting)
   */
  onStepEnd?(
    step: StepDefinition,
    result: StepResult,
    scenario: ScenarioDefinition,
  ): void | Promise<void>;

  /**
   * Called when step fails
   *
   * @param step - The step definition that failed
   * @param error - The error that occurred
   * @param duration - Step execution duration in milliseconds
   * @param scenario - The scenario containing the step (for parallel-safe reporting)
   */
  onStepError?(
    step: StepDefinition,
    error: Error,
    duration: number,
    scenario: ScenarioDefinition,
  ): void | Promise<void>;

  /**
   * Called when scenario is skipped
   *
   * @param scenario - The scenario that was skipped
   * @param reason - Optional skip reason
   * @param duration - Scenario execution duration in milliseconds
   */
  onScenarioSkip?(
    scenario: ScenarioDefinition,
    reason: string | undefined,
    duration: number,
  ): void | Promise<void>;

  /**
   * Called when scenario completes
   */
  onScenarioEnd?(
    scenario: ScenarioDefinition,
    result: ScenarioResult,
  ): void | Promise<void>;

  /**
   * Called when test run completes
   */
  onRunEnd?(summary: RunSummary): void | Promise<void>;
}

/**
 * Configuration options for the scenario runner.
 *
 * Controls execution behavior including concurrency, failure handling,
 * and reporting.
 *
 * @example Sequential execution with fail-fast
 * ```ts
 * const options: RunOptions = {
 *   reporter: new ListReporter(),
 *   maxConcurrency: 1,  // Run one at a time
 *   maxFailures: 1      // Stop after first failure
 * };
 * ```
 *
 * @example Parallel execution with limit
 * ```ts
 * const options: RunOptions = {
 *   reporter: new DotReporter(),
 *   maxConcurrency: 4   // Run up to 4 scenarios at once
 * };
 * ```
 */
export interface RunOptions {
  /** Reporter instance for execution events */
  readonly reporter?: Reporter;

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

// Re-export all scenario definition types
export type {
  Entry,
  EntryMetadata,
  ResourceDefinition,
  ResourceFunction,
  ResourceMetadata,
  ScenarioDefinition,
  ScenarioMetadata,
  ScenarioOptions,
  SetupCleanup,
  SetupDefinition,
  SetupFunction,
  SetupMetadata,
  Source,
  StepContext,
  StepDefinition,
  StepFunction,
  StepMetadata,
  StepOptions,
} from "@probitas/scenario";
