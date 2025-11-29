/**
 * Type definitions for the Runner layer
 *
 * Core types for executing scenario definitions and managing test lifecycle.
 *
 * @module
 */

/**
 * Source location in a file (for better error messages)
 */
export interface SourceLocation {
  /** File path */
  readonly file: string;

  /** Line number */
  readonly line: number;
}

/**
 * Options for scenario execution
 */
export interface ScenarioOptions {
  /** Tags for filtering scenarios */
  readonly tags: readonly string[];

  /** Skip condition (can be boolean, string reason, or function) */
  readonly skip:
    | boolean
    | string
    | (() => boolean | string | Promise<boolean | string>)
    | null;

  /** Default options applied to all steps in scenario */
  readonly stepOptions: StepOptions;
}

/**
 * Options for individual step execution
 */
export interface StepOptions {
  /** Timeout in milliseconds */
  readonly timeout: number;

  /** Retry configuration */
  readonly retry: {
    readonly maxAttempts: number;
    readonly backoff: "linear" | "exponential";
  };
}

/**
 * Function signature for a step
 */
export type AnyStepFunction = (
  // deno-lint-ignore no-explicit-any
  ctx: StepContext<any, readonly any[], any>,
  // deno-lint-ignore no-explicit-any
) => any;

/**
 * Definition of a scenario (immutable)
 */
export interface ScenarioDefinition {
  /** Scenario name */
  readonly name: string;

  /** Scenario options (final, with defaults applied) */
  readonly options: ScenarioOptions;

  /** Entries to execute (steps, resources, setups) in order */
  readonly entries: readonly Entry[];

  /** Source location for debugging */
  readonly location?: SourceLocation;
}

/**
 * Definition of a step (immutable)
 */
export interface StepDefinition {
  /** Step name */
  readonly name: string;

  /** Step function to execute */
  readonly fn: AnyStepFunction;

  /** Step options (final, with defaults applied) */
  readonly options: StepOptions;

  /** Source location for debugging */
  readonly location?: SourceLocation;
}

/**
 * Cleanup returned by setup functions
 */
export type SetupCleanup =
  | void
  | (() => void | Promise<void>)
  | Disposable
  | AsyncDisposable;

/**
 * Runtime signature for setup hooks
 */
export type RunnerSetupFunction = (
  ctx: StepContext<unknown, readonly unknown[], Record<string, unknown>>,
) => SetupCleanup | Promise<SetupCleanup>;

/**
 * Definition of a setup hook (immutable)
 */
export interface SetupDefinition {
  /** Setup function to execute */
  readonly fn: RunnerSetupFunction;

  /** Source location for debugging */
  readonly location?: SourceLocation;
}

/**
 * Entry in a scenario - can be a step, resource, or setup
 */
export type Entry =
  | { kind: "step"; value: StepDefinition }
  | { kind: "resource"; value: ResourceDefinition }
  | { kind: "setup"; value: SetupDefinition };

/**
 * Resource definition (simplified version for runtime)
 * Note: The builder layer exports the full typed version.
 * This is an internal type for the runner layer.
 */
interface ResourceDefinition {
  /** Resource name */
  readonly name: string;
  /** Resource factory function */
  readonly factory: RunnerResourceFactory;
}

/**
 * Runtime signature for resource factories
 */
export type RunnerResourceFactory = (
  ctx: StepContext<unknown, readonly unknown[], Record<string, unknown>>,
) => unknown | Promise<unknown>;

/**
 * Metadata for a step (serializable, without function)
 */
export type StepMetadata = Omit<StepDefinition, "fn">;

/**
 * Metadata for a scenario (serializable, without functions)
 */
export type ScenarioMetadata =
  & Omit<
    ScenarioDefinition,
    "entries" | "options"
  >
  & {
    readonly options:
      & Omit<
        ScenarioOptions,
        "skip"
      >
      & {
        readonly skip: boolean | null;
      };
    readonly entries: readonly Entry[];
  };

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
 * Context provided to each step
 */
export interface StepContext<
  P = unknown,
  A extends readonly unknown[] = readonly [],
  Resources extends Record<string, unknown> = Record<string, never>,
> {
  /** Step index (0-based) */
  readonly index: number;

  /** Result from previous step */
  readonly previous: P;

  /** All accumulated results as typed tuple */
  readonly results: A;

  /** Shared storage between steps */
  readonly store: Map<string, unknown>;

  /** Abort signal (combines timeout + manual abort) */
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
  readonly status: "passed" | "failed" | "skipped";

  /** Execution duration in milliseconds */
  readonly duration: number;

  /** Number of retries performed */
  readonly retries: number;

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
  readonly status: "passed" | "failed" | "skipped";

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

  /** Number of skipped scenarios */
  readonly skipped: number;

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
   * Called when scenario is skipped
   */
  onScenarioSkip(
    scenario: ScenarioDefinition,
    reason: string,
  ): void | Promise<void>;

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
 * Reporter constructor interface
 *
 * Defines the constructor signature for Reporter classes.
 */
export interface ReporterConstructor {
  /**
   * Create a new Reporter instance
   *
   * @param options Reporter configuration options
   */
  new (options?: unknown): Reporter;
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

/**
 * Main runner interface for executing scenarios
 */
export interface ScenarioRunner {
  /**
   * Run scenarios and return summary
   */
  run(
    scenarios: readonly ScenarioDefinition[],
    options?: RunOptions,
  ): Promise<RunSummary>;
}
