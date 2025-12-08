import type {
  ResourceDefinition,
  SetupCleanup,
  SetupDefinition,
  StepContext,
  StepDefinition,
} from "@probitas/scenario";

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
 * @typeParam P - Type of the previous step's return value
 * @typeParam A - Tuple type of all accumulated results from previous steps
 * @typeParam R - Record type mapping resource names to their types
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
export type BuilderStepContext<
  P = unknown,
  A extends readonly unknown[] = readonly unknown[],
  R extends Record<string, unknown> = Record<string, unknown>,
> = StepContext & {
  /**
   * Result from the previous step.
   *
   * Fully typed based on what the previous step returned.
   * For the first step, this is `unknown`.
   */
  readonly previous: P;

  /**
   * All accumulated results as a typed tuple.
   *
   * Allows accessing any previous result by index:
   * ```ts
   * ctx.results[0]  // First step's result
   * ctx.results[1]  // Second step's result
   * ```
   */
  readonly results: A;

  /**
   * Named resources registered with `.resource()`.
   *
   * Resources are typed based on their registration:
   * ```ts
   * .resource("db", () => createDbConnection())
   * .step((ctx) => ctx.resources.db.query(...))
   * ```
   */
  readonly resources: R;
};

/**
 * Function signature for step execution.
 *
 * A step function receives the execution context and returns a value
 * (sync or async) that becomes available to subsequent steps.
 *
 * @typeParam T - Type of this step's return value
 * @typeParam P - Type of the previous step's result (from `ctx.previous`)
 * @typeParam A - Tuple type of all accumulated results
 * @typeParam R - Record of available resources
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
export type BuilderStepFunction<
  T = unknown,
  P = unknown,
  A extends readonly unknown[] = readonly unknown[],
  R extends Record<string, unknown> = Record<string, unknown>,
> = (ctx: BuilderStepContext<P, A, R>) => T | Promise<T>;

/**
 * Immutable definition of a scenario step.
 *
 * Contains all information needed to execute a single step:
 * the step function, its options, and debugging metadata.
 *
 * @typeParam T - Type of this step's return value
 * @typeParam P - Type of the previous step's result
 * @typeParam A - Tuple type of accumulated results
 * @typeParam R - Record of available resources
 *
 * @remarks
 * Step definitions are created by the builder and consumed by the runner.
 * They are immutable and should not be modified after creation.
 */
export type BuilderStepDefinition<
  T = unknown,
  P = unknown,
  A extends readonly unknown[] = readonly unknown[],
  R extends Record<string, unknown> = Record<string, unknown>,
> = StepDefinition & {
  /** Step function to execute */
  readonly fn: BuilderStepFunction<T, P, A, R>;
};

/**
 * Function signature for setup hooks.
 *
 * Setup functions run before steps and can return a cleanup handler
 * that executes after the scenario completes (success or failure).
 *
 * @typeParam P - Type of the previous step's result
 * @typeParam A - Tuple type of accumulated results
 * @typeParam R - Record of available resources
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
export type BuilderSetupFunction<
  P = unknown,
  A extends readonly unknown[] = readonly unknown[],
  R extends Record<string, unknown> = Record<string, unknown>,
> = (
  ctx: BuilderStepContext<P, A, R>,
) => SetupCleanup | Promise<SetupCleanup>;

/**
 * Immutable definition of a setup hook.
 *
 * Setup definitions contain the setup function and its source source.
 * Unlike steps, setups don't have names or configurable options.
 *
 * @typeParam P - Type of the previous step's result
 * @typeParam A - Tuple type of accumulated results
 * @typeParam R - Record of available resources
 */
export type BuilderSetupDefinition<
  P = unknown,
  A extends readonly unknown[] = readonly unknown[],
  R extends Record<string, unknown> = Record<string, unknown>,
> = SetupDefinition & {
  /** Setup function to execute (may return cleanup handler) */
  readonly fn: BuilderSetupFunction<P, A, R>;
};

/**
 * Function signature for resource fn functions.
 *
 * Resource factories create named dependencies that are:
 * - Initialized before any steps run
 * - Available to all steps via `ctx.resources[name]`
 * - Automatically disposed after the scenario (if Disposable)
 *
 * @typeParam T - Type of resource to create
 * @typeParam P - Type of the previous step's result
 * @typeParam A - Tuple type of accumulated results
 * @typeParam R - Previously registered resources available to this fn
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
export type BuilderResourceFunction<
  T = unknown,
  P = unknown,
  A extends readonly unknown[] = readonly unknown[],
  R extends Record<string, unknown> = Record<string, unknown>,
> = (ctx: BuilderStepContext<P, A, R>) => T | Promise<T>;

/**
 * Immutable definition of a named resource.
 *
 * Resource definitions contain everything needed to create and identify
 * a resource: its name, fn function, and source source.
 *
 * @typeParam T - Type of the resource value
 * @typeParam P - Type of the previous step's result
 * @typeParam A - Tuple type of accumulated results
 * @typeParam R - Previously registered resources available to this fn
 */
export type BuilderResourceDefinition<
  T = unknown,
  P = unknown,
  A extends readonly unknown[] = readonly unknown[],
  R extends Record<string, unknown> = Record<string, unknown>,
> = ResourceDefinition & {
  /** Factory function that creates the resource */
  readonly fn: BuilderResourceFunction<T, P, A, R>;
};
