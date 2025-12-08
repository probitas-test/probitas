import type { Source } from "./source.ts";

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
 * scenario("File Test")
 *   .setup(() => {
 *     const file = Deno.makeTempFileSync();
 *     return () => Deno.removeSync(file);  // Cleanup function
 *   })
 *   .build();
 * ```
 *
 * @example Disposable object
 * ```ts
 * scenario("Connection Test")
 *   .setup(async () => {
 *     const conn = await connect();
 *     return conn;  // If conn implements AsyncDisposable
 *   })
 *   .build();
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
 * scenario("Chained Steps")
 *   .step("First", () => ({ id: 123 }))
 *   .step("Second", (ctx) => {
 *     console.log(ctx.previous.id);  // 123 (typed as number)
 *   })
 *   .build();
 * ```
 *
 * @example Using shared store
 * ```ts
 * scenario("Store Example")
 *   .setup((ctx) => {
 *     ctx.store.set("startTime", Date.now());
 *   })
 *   .step("Check duration", (ctx) => {
 *     const start = ctx.store.get("startTime") as number;
 *     console.log(`Elapsed: ${Date.now() - start}ms`);
 *   })
 *   .build();
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
   * ctx.results[0]  // First step's result
   * ctx.results[1]  // Second step's result
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
   * .resource("db", () => createDbConnection())
   * .step((ctx) => ctx.resources.db.query(...))
   * ```
   */
  readonly resources: Record<string, unknown>;

  /**
   * Abort signal that fires on timeout or manual cancellation.
   *
   * Pass this to fetch() or other APIs that support AbortSignal
   * for proper timeout handling.
   */
  readonly signal: AbortSignal;
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
 * const step: StepFunction<{ name: string }> = (ctx) => {
 *   return { name: "Alice" };
 * };
 * ```
 *
 * @example Async step with API call
 * ```ts
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

  /** Source source where the step was defined (for error messages) */
  readonly source?: Source;
}

/**
 * Serializable step metadata (without the function).
 *
 * Used for JSON output, tooling, and inspection without executing code.
 */
export type StepMetadata = Omit<StepDefinition, "fn">;

/**
 * Function signature for setup hooks.
 *
 * Setup functions run before steps and can return a cleanup handler
 * that executes after the scenario completes (success or failure).
 *
 * @example Setup with cleanup function
 * ```ts
 * const setup: SetupFunction = (ctx) => {
 *   const server = startTestServer();
 *   ctx.store.set("serverUrl", server.url);
 *   return () => server.close();  // Cleanup after scenario
 * };
 * ```
 *
 * @example Async setup returning Disposable
 * ```ts
 * const setup: SetupFunction = async (ctx) => {
 *   const db = await Database.connect();
 *   await db.migrate();
 *   return db;  // db[Symbol.asyncDispose]() called on cleanup
 * };
 * ```
 *
 * @see {@linkcode SetupCleanup} for supported cleanup return types
 */
export type SetupFunction = (
  ctx: StepContext,
) => SetupCleanup | Promise<SetupCleanup>;

/**
 * Immutable definition of a setup hook.
 *
 * Setup definitions contain the setup function and its source source.
 * Unlike steps, setups don't have names or configurable options.
 */
export interface SetupDefinition {
  /** Setup function to execute (may return cleanup handler) */
  readonly fn: SetupFunction;

  /** Source source where the setup was defined */
  readonly source?: Source;
}

/**
 * Serializable setup metadata (without the function).
 *
 * Contains only the source source since setups have no name or options.
 */
export type SetupMetadata = Omit<SetupDefinition, "fn">;

/**
 * Function signature for resource fn functions.
 *
 * Resource factories create named dependencies that are:
 * - Initialized before any steps run
 * - Available to all steps via `ctx.resources[name]`
 * - Automatically disposed after the scenario (if Disposable)
 *
 * @typeParam T - Type of resource to create
 *
 * @example Database connection resource
 * ```ts
 * const dbFactory: ResourceFunction<Database> = async (ctx) => {
 *   const conn = await Database.connect(process.env.DATABASE_URL);
 *   return conn;  // Disposed automatically if implements AsyncDisposable
 * };
 * ```
 *
 * @example Resource depending on another resource
 * ```ts
 * // Second resource can access the first
 * const apiFactory: ResourceFunction<ApiClient, unknown, [], { config: Config }> =
 *   (ctx) => new ApiClient(ctx.resources.config.apiUrl);
 * ```
 */
export type ResourceFunction<T = unknown> = (
  ctx: StepContext,
) => T | Promise<T>;

/**
 * Immutable definition of a named resource.
 *
 * Resource definitions contain everything needed to create and identify
 * a resource: its name, fn function, and source source.
 *
 * @typeParam T - Type of the resource value
 */
export interface ResourceDefinition<T = unknown> {
  /** Unique resource name (used as key in `ctx.resources`) */
  readonly name: string;

  /** Factory function that creates the resource */
  readonly fn: ResourceFunction<T>;

  /** Source source where the resource was defined */
  readonly source?: Source;
}

/**
 * Serializable resource metadata (without the fn function).
 *
 * Contains the resource name and source source.
 */
export type ResourceMetadata = Omit<ResourceDefinition, "fn">;
