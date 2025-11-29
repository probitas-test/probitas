/**
 * Core type definitions for Scenario
 *
 * This module defines the fundamental types for scenario definitions.
 * These types represent the immutable data structures that describe
 * what a scenario contains, independent of how it's built or executed.
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
 * Options for individual step execution
 */
export interface StepOptions {
  /** Timeout in milliseconds */
  readonly timeout: number;

  /** Retry configuration */
  readonly retry: {
    /** Maximum number of attempts (1 = no retry) */
    readonly maxAttempts: number;

    /** Backoff strategy between retries */
    readonly backoff: "linear" | "exponential";
  };
}

/**
 * Options for scenario execution
 */
export interface ScenarioOptions {
  /** Tags for filtering scenarios */
  readonly tags: readonly string[];

  /** Default options applied to all steps in scenario */
  readonly stepOptions: StepOptions;
}

/**
 * Cleanup returned by setup functions
 *
 * Supports multiple cleanup patterns:
 * - `void`: No cleanup needed
 * - Function: Cleanup function to be called
 * - `Disposable`: Object with `[Symbol.dispose]()` method
 * - `AsyncDisposable`: Object with `[Symbol.asyncDispose]()` method
 */
export type SetupCleanup =
  | void
  | (() => void | Promise<void>)
  | Disposable
  | AsyncDisposable;

/**
 * Context provided to steps, resources, and setup hooks
 *
 * @template Previous - Type of the previous step result
 * @template Results - Tuple type of accumulated results from all previous steps
 * @template Resources - Record type of available resources
 */
export interface StepContext<
  Previous = unknown,
  Results extends readonly unknown[] = readonly unknown[],
  Resources extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Step index (0-based) */
  readonly index: number;

  /** Result from previous step */
  readonly previous: Previous;

  /** All accumulated results as typed tuple */
  readonly results: Results;

  /** Shared storage between steps */
  readonly store: Map<string, unknown>;

  /** Abort signal (combines timeout + manual abort) */
  readonly signal: AbortSignal;

  /** Available resources */
  readonly resources: Resources;
}

/**
 * Function signature for a step
 *
 * @template T - Type of this step's return value
 * @template Previous - Type of the previous step result
 * @template Results - Tuple type of accumulated results
 * @template Resources - Available resources
 */
export type StepFunction<
  T = unknown,
  Previous = unknown,
  Results extends readonly unknown[] = readonly unknown[],
  Resources extends Record<string, unknown> = Record<string, unknown>,
> = (ctx: StepContext<Previous, Results, Resources>) => T | Promise<T>;

/**
 * Function signature for setup hooks
 *
 * Setup hooks can access accumulated results and resources.
 * They return a cleanup function/disposable that will be called after the scenario.
 *
 * @template Previous - Type of the previous step result
 * @template Results - Tuple type of accumulated results
 * @template Resources - Available resources
 */
export type SetupFunction<
  Previous = unknown,
  Results extends readonly unknown[] = readonly unknown[],
  Resources extends Record<string, unknown> = Record<string, unknown>,
> = (
  ctx: StepContext<Previous, Results, Resources>,
) => SetupCleanup | Promise<SetupCleanup>;

/**
 * Function signature for resource factories
 *
 * Resource factories create resources that will be available to subsequent
 * steps, setups, and other resource factories.
 *
 * @template T - Type of resource to create
 * @template Previous - Type of the previous step result
 * @template Results - Tuple type of accumulated results
 * @template Resources - Already registered resources available to this factory
 */
export type ResourceFactory<
  T = unknown,
  Previous = unknown,
  Results extends readonly unknown[] = readonly unknown[],
  Resources extends Record<string, unknown> = Record<string, unknown>,
> = (ctx: StepContext<Previous, Results, Resources>) => T | Promise<T>;

/**
 * Definition of a step (immutable)
 *
 * @template T - Type of this step's return value
 * @template Previous - Type of the previous step result
 * @template Results - Tuple type of accumulated results
 * @template Resources - Available resources
 */
export interface StepDefinition<
  T = unknown,
  Previous = unknown,
  Results extends readonly unknown[] = readonly unknown[],
  Resources extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Step name */
  readonly name: string;

  /** Step function to execute */
  readonly fn: StepFunction<T, Previous, Results, Resources>;

  /** Step options (final, with defaults applied) */
  readonly options: StepOptions;

  /** Source location for debugging */
  readonly location?: SourceLocation;
}

/**
 * Definition of a setup hook (immutable)
 *
 * @template Previous - Type of the previous step result
 * @template Results - Tuple type of accumulated results
 * @template Resources - Available resources
 */
export interface SetupDefinition<
  Previous = unknown,
  Results extends readonly unknown[] = readonly unknown[],
  Resources extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Setup function to execute */
  readonly fn: SetupFunction<Previous, Results, Resources>;

  /** Source location for debugging */
  readonly location?: SourceLocation;
}

/**
 * Definition of a resource (immutable)
 *
 * @template T - Type of the resource
 * @template Previous - Type of the previous step result
 * @template Results - Tuple type of accumulated results
 * @template Resources - Already registered resources available to this factory
 */
export interface ResourceDefinition<
  T = unknown,
  Previous = unknown,
  Results extends readonly unknown[] = readonly unknown[],
  Resources extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Resource name (used as key in resources object) */
  readonly name: string;

  /** Resource factory function */
  readonly factory: ResourceFactory<T, Previous, Results, Resources>;

  /** Source location for debugging */
  readonly location?: SourceLocation;
}

/**
 * Entry in a scenario - discriminated union of step, resource, or setup
 *
 * The `kind` field serves as the discriminant for type narrowing.
 * Uses default type parameters (all `unknown`) for storage.
 */
export type Entry =
  | { readonly kind: "step"; readonly value: StepDefinition }
  | { readonly kind: "resource"; readonly value: ResourceDefinition }
  | { readonly kind: "setup"; readonly value: SetupDefinition };

/**
 * Definition of a scenario (immutable)
 *
 * This is the core type that represents a complete scenario definition.
 * It contains all the information needed to execute the scenario.
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
 * Metadata for a step (serializable, without function)
 */
export type StepMetadata = Omit<StepDefinition, "fn">;

/**
 * Metadata for a setup (serializable, without function)
 */
export type SetupMetadata = Omit<SetupDefinition, "fn">;

/**
 * Metadata for a resource (serializable, without function)
 */
export type ResourceMetadata = Omit<ResourceDefinition, "factory">;

/**
 * Metadata entry - discriminated union for serializable entries
 */
export type EntryMetadata =
  | { readonly kind: "step"; readonly value: StepMetadata }
  | { readonly kind: "resource"; readonly value: ResourceMetadata }
  | { readonly kind: "setup"; readonly value: SetupMetadata };

/**
 * Metadata for a scenario (serializable, without functions)
 */
export interface ScenarioMetadata {
  /** Scenario name */
  readonly name: string;

  /** Scenario options */
  readonly options: ScenarioOptions;

  /** Entry metadata (without functions) */
  readonly entries: readonly EntryMetadata[];

  /** Source location for debugging */
  readonly location?: SourceLocation;
}
