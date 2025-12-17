import type { Origin } from "../origin.ts";

/**
 * Configuration options for individual step execution.
 *
 * Controls timeout and retry behavior for a step. These options can be set at:
 * 1. Step level (highest priority)
 * 2. Scenario level (applies to all steps in scenario)
 * 3. Default values (30s timeout, no retry)
 *
 * @example
 * ```ts
 * const options: StepOptions = {
 *   timeout: 60000,  // 60 seconds
 *   retry: {
 *     maxAttempts: 3,
 *     backoff: "exponential"  // Waits 1s, 2s, 4s between retries
 *   }
 * };
 * ```
 */
export interface StepOptions {
  /**
   * Maximum execution time in milliseconds.
   *
   * If the step takes longer, a {@linkcode TimeoutError} is thrown.
   * Default: 30000 (30 seconds)
   */
  readonly timeout?: number;

  /** Retry configuration for handling transient failures */
  readonly retry?: {
    /**
     * Maximum number of execution attempts.
     *
     * - `1` = No retry (fail immediately on error)
     * - `2` = One retry (2 total attempts)
     * - `n` = n-1 retries (n total attempts)
     *
     * Default: 1 (no retry)
     */
    readonly maxAttempts?: number;

    /**
     * Backoff strategy for delay between retry attempts.
     *
     * - `"linear"`: Fixed 1 second delay between attempts
     * - `"exponential"`: Doubles delay each attempt (1s, 2s, 4s, 8s...)
     *
     * Default: "linear"
     */
    readonly backoff?: "linear" | "exponential";
  };
}

/**
 * Cleanup handler returned by setup functions.
 *
 * Setup functions can return various cleanup mechanisms that are automatically
 * invoked after the scenario completes (regardless of success or failure).
 *
 * Supported cleanup patterns:
 * - `void` / `undefined`: No cleanup needed
 * - `() => void`: Synchronous cleanup function
 * - `() => Promise<void>`: Async cleanup function
 * - `Disposable`: Object with `[Symbol.dispose]()` method
 * - `AsyncDisposable`: Object with `[Symbol.asyncDispose]()` method
 *
 * @example Cleanup function
 * ```ts
 * import type { SetupCleanup } from "@probitas/core";
 *
 * // Setup functions can return a cleanup function
 * const setupWithCleanup = (): SetupCleanup => {
 *   const file = Deno.makeTempFileSync();
 *   return () => Deno.removeSync(file); // Cleanup function
 * };
 * console.log(setupWithCleanup);
 * ```
 *
 * @example Disposable object
 * ```ts
 * import type { SetupCleanup } from "@probitas/core";
 *
 * // Setup functions can return an AsyncDisposable
 * const setupWithDisposable = async (): Promise<SetupCleanup> => {
 *   const conn: AsyncDisposable = {
 *     async [Symbol.asyncDispose]() {
 *       // cleanup logic
 *     },
 *   };
 *   return conn;
 * };
 * console.log(setupWithDisposable);
 * ```
 */
export type SetupCleanup =
  | void
  | (() => void | Promise<void>)
  | Disposable
  | AsyncDisposable;

/**
 * Execution context provided to steps, resources, and setup hooks.
 *
 * The context provides access to:
 * - Previous step results with full type inference
 * - All accumulated results as a typed tuple
 * - Named resources registered with `.resource()`
 * - Shared storage for cross-step communication
 * - Abort signal for timeout and cancellation handling
 *
 * @example Accessing previous result
 * ```ts
 * import type { StepContext } from "@probitas/core";
 *
 * // Steps receive context with the previous step's result
 * const stepFn = (ctx: StepContext) => {
 *   // ctx.previous contains the result from the previous step
 *   const prev = ctx.previous as { id: number };
 *   console.log(prev.id); // Access typed result
 * };
 * console.log(stepFn);
 * ```
 *
 * @example Using shared store
 * ```ts
 * import type { StepContext } from "@probitas/core";
 *
 * // The store is shared across all steps in a scenario
 * const setupFn = (ctx: StepContext) => {
 *   ctx.store.set("startTime", Date.now());
 * };
 *
 * const stepFn = (ctx: StepContext) => {
 *   const start = ctx.store.get("startTime") as number;
 *   console.log(`Elapsed: ${Date.now() - start}ms`);
 * };
 * console.log(setupFn, stepFn);
 * ```
 */
export interface StepContext {
  /**
   * Current step index (0-based).
   *
   * Useful for conditional logic based on position in the scenario.
   */
  readonly index: number;

  /**
   * Result from the previous step.
   *
   * Fully typed based on what the previous step returned.
   * For the first step, this is `unknown`.
   */
  readonly previous: unknown;

  /**
   * All accumulated results as a typed tuple.
   *
   * Allows accessing any previous result by index:
   * ```ts
   * import type { StepContext } from "@probitas/core";
   *
   * const stepFn = (ctx: StepContext) => {
   *   ctx.results[0]; // First step's result
   *   ctx.results[1]; // Second step's result
   * };
   * console.log(stepFn);
   * ```
   */
  readonly results: readonly unknown[];

  /**
   * Shared key-value storage for cross-step communication.
   *
   * Use this for data that doesn't fit the step result pattern,
   * such as metadata or configuration set during setup.
   */
  readonly store: Map<string, unknown>;

  /**
   * Named resources registered with `.resource()`.
   *
   * Resources are typed based on their registration:
   * ```ts
   * import type { StepContext } from "@probitas/core";
   *
   * interface DbResource {
   *   query(sql: string): unknown;
   * }
   *
   * // Access resources registered with .resource()
   * const stepFn = (ctx: StepContext) => {
   *   const db = ctx.resources["db"] as DbResource;
   *   return db.query("SELECT 1");
   * };
   * console.log(stepFn);
   * ```
   */
  readonly resources: Record<string, unknown>;

  /**
   * Abort signal that fires on timeout or manual cancellation.
   *
   * Pass this to fetch() or other APIs that support AbortSignal
   * for proper timeout handling.
   */
  readonly signal?: AbortSignal;
}

/**
 * Function signature for step execution.
 *
 * A step function receives the execution context and returns a value
 * (sync or async) that becomes available to subsequent steps.
 *
 * @typeParam T - Type of this step's return value
 *
 * @example Sync step returning data
 * ```ts
 * import type { StepFunction } from "@probitas/core";
 *
 * const step: StepFunction<{ name: string }> = (_ctx) => {
 *   return { name: "Alice" };
 * };
 * ```
 *
 * @example Async step with API call
 * ```ts
 * import type { StepFunction } from "@probitas/core";
 *
 * interface User {
 *   id: number;
 *   name: string;
 * }
 *
 * const step: StepFunction<User> = async (ctx) => {
 *   const response = await fetch("/api/user", { signal: ctx.signal });
 *   return response.json();
 * };
 * ```
 */
export type StepFunction<T = unknown> = (ctx: StepContext) => T | Promise<T>;

/**
 * Immutable definition of a scenario step.
 *
 * Contains all information needed to execute a single step:
 * the step function, its options, and debugging metadata.
 *
 * @typeParam T - Type of this step's return value
 *
 * @remarks
 * Step definitions are created by the builder and consumed by the runner.
 * They are immutable and should not be modified after creation.
 */
export interface StepDefinition<T = unknown> {
  readonly kind: "step" | "resource" | "setup";

  /** Human-readable step name (displayed in reports) */
  readonly name: string;

  /** Step function to execute */
  readonly fn: StepFunction<T>;

  /**
   * Maximum execution time in milliseconds.
   *
   * If the step takes longer, a {@linkcode TimeoutError} is thrown.
   * Default: 30000 (30 seconds)
   */
  readonly timeout: number;

  /** Retry configuration for handling transient failures */
  readonly retry: {
    /**
     * Maximum number of execution attempts.
     *
     * - `1` = No retry (fail immediately on error)
     * - `2` = One retry (2 total attempts)
     * - `n` = n-1 retries (n total attempts)
     *
     * Default: 1 (no retry)
     */
    readonly maxAttempts: number;

    /**
     * Backoff strategy for delay between retry attempts.
     *
     * - `"linear"`: Fixed 1 second delay between attempts
     * - `"exponential"`: Doubles delay each attempt (1s, 2s, 4s, 8s...)
     *
     * Default: "linear"
     */
    readonly backoff: "linear" | "exponential";
  };

  /** Origin where the step was defined (for error messages) */
  readonly origin?: Origin;
}

/**
 * Serializable step metadata (without the function).
 *
 * Used for JSON output, tooling, and inspection without executing code.
 */
export type StepMetadata = Omit<StepDefinition, "fn">;
