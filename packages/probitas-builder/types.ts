import type { StepContext, StepDefinition } from "@probitas/core";

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
 * import { scenario } from "@probitas/builder";
 *
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
 * import { scenario } from "@probitas/builder";
 *
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
   * - `ctx.results[0]` - First step's result
   * - `ctx.results[1]` - Second step's result
   */
  readonly results: A;

  /**
   * Named resources registered with `.resource()`.
   *
   * Resources are typed based on their registration:
   * ```ts
   * import { scenario } from "@probitas/builder";
   *
   * // Mock database connection for example
   * const createDbConnection = () => ({ query: (_sql: string) => [{ id: 1 }] });
   *
   * scenario("test")
   *   .resource("db", () => createDbConnection())
   *   .step((ctx) => ctx.resources.db.query("SELECT 1"))
   *   .build();
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
 * import type { BuilderStepFunction } from "@probitas/builder";
 *
 * const step: BuilderStepFunction<{ name: string }> = (_ctx) => {
 *   return { name: "Alice" };
 * };
 * ```
 *
 * @example Async step with API call
 * ```ts
 * import type { BuilderStepFunction } from "@probitas/builder";
 *
 * type User = { id: string; name: string };
 *
 * const step: BuilderStepFunction<User> = async (ctx) => {
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
