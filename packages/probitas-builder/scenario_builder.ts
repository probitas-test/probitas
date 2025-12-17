/**
 * ScenarioBuilder - Fluent API for building scenario definitions
 *
 * Provides type-safe, fluent API for constructing scenario definitions with
 * automatic type inference for step results.
 *
 * @module
 */

import type {
  ScenarioDefinition,
  ScenarioOptions,
  SetupCleanup,
  StepDefinition,
  StepFunction,
  StepOptions,
} from "@probitas/core";
import type { Origin } from "@probitas/core/origin";
import { captureStack } from "@probitas/core/stack";
import type { BuilderStepFunction } from "./types.ts";

export const DEFAULT_STEP_TIMEOUT = 30000;
export const DEFAULT_STEP_RETRY_MAX_ATTEMPTS = 1;
export const DEFAULT_STEP_RETRY_BACKOFF = "linear";

/**
 * Capture the origin (file path and line number) of the caller.
 *
 * Filters out internal frames from scenario_builder.ts and stack.ts
 * to find the first user code frame.
 *
 * @returns Origin object with path and line, or undefined if not found
 * @internal
 */
function captureOrigin(): Origin | undefined {
  return captureStack()
    .filter((frame) =>
      !frame.path.endsWith("/scenario_builder.ts") &&
      !frame.path.endsWith("/stack.ts")
    )
    .find((frame) => frame.user);
}

/**
 * Internal state class for ScenarioBuilder
 *
 * This class encapsulates all state management logic and provides
 * methods for adding entries and building the final scenario definition.
 *
 * @internal
 */
class ScenarioBuilderState<
  Resources extends Record<string, unknown> = Record<string, never>,
> {
  #name: string;
  #scenarioOptions: ScenarioOptions;
  #steps: StepDefinition[] = [];

  constructor(name: string, options?: ScenarioOptions) {
    this.#name = name;
    this.#scenarioOptions = options || {};
  }

  /**
   * Create a deep clone of this state
   *
   * @returns New state instance with copied values
   */
  clone<
    NewResources extends Record<string, unknown> = Resources,
  >(): ScenarioBuilderState<NewResources> {
    // Deep clone scenarioOptions
    const clonedOptions: ScenarioOptions = structuredClone(
      this.#scenarioOptions,
    );
    const cloned = new ScenarioBuilderState<NewResources>(
      this.#name,
      clonedOptions,
    );
    cloned.#steps = [...this.#steps];
    return cloned;
  }

  #addStep<T = unknown>(
    kind: "step" | "resource" | "setup",
    name: string,
    fn: StepFunction<T>,
    options?: StepOptions,
  ): void {
    const origin = captureOrigin();
    const timeout = options?.timeout ??
      this.#scenarioOptions?.stepOptions?.timeout ??
      DEFAULT_STEP_TIMEOUT;
    const retryMaxAttempts = options?.retry?.maxAttempts ??
      this.#scenarioOptions?.stepOptions?.retry?.maxAttempts ??
      DEFAULT_STEP_RETRY_MAX_ATTEMPTS;
    const retryBackoff = options?.retry?.backoff ??
      this.#scenarioOptions?.stepOptions?.retry?.backoff ??
      DEFAULT_STEP_RETRY_BACKOFF;
    const step = {
      kind,
      name,
      fn,
      timeout,
      retry: {
        maxAttempts: retryMaxAttempts,
        backoff: retryBackoff,
      },
      origin,
    };
    this.#steps.push(step);
  }

  addResourceStep(
    name: string,
    fn: StepFunction,
    options?: StepOptions,
  ): void {
    this.#addStep("resource", name, fn, options);
  }

  addSetupStep(
    nameOrFn: string | StepFunction,
    fnOrOptions?: StepFunction | StepOptions,
    stepOptions?: StepOptions,
  ): void {
    let name: string;
    let fn: StepFunction;
    let options: StepOptions | undefined;
    if (typeof nameOrFn === "string") {
      name = nameOrFn;
      fn = fnOrOptions as StepFunction;
      options = stepOptions;
    } else {
      const count = this.#steps.filter((s) => s.kind === "setup").length;
      name = `Setup step ${count + 1}`;
      fn = nameOrFn;
      options = fnOrOptions as StepOptions | undefined;
    }
    this.#addStep("setup", name, fn, options);
  }

  addExecutionStep(
    nameOrFn: string | StepFunction,
    fnOrOptions?: StepFunction | StepOptions,
    stepOptions?: StepOptions,
  ): void {
    let name: string;
    let fn: StepFunction;
    let options: StepOptions | undefined;
    if (typeof nameOrFn === "string") {
      name = nameOrFn;
      fn = fnOrOptions as StepFunction;
      options = stepOptions;
    } else {
      const count = this.#steps.filter((s) => s.kind === "step").length;
      name = `Execution step ${count + 1}`;
      fn = nameOrFn;
      options = fnOrOptions as StepOptions | undefined;
    }
    this.#addStep("step", name, fn, options);
  }

  build(): ScenarioDefinition {
    const origin = captureOrigin();
    const definition: ScenarioDefinition = Object.freeze({
      name: this.#name,
      tags: [...(this.#scenarioOptions.tags ?? [])],
      steps: [...this.#steps],
      origin,
    });
    return definition;
  }
}

/**
 * Fluent scenario builder for defining test scenarios with type-safe step chaining.
 *
 * ScenarioBuilderInit provides a fluent API for constructing scenario definitions.
 * It tracks type information across the builder chain, ensuring type safety for:
 * - Step results passed via `ctx.previous`
 * - Accumulated results accessible via `ctx.results`
 * - Named resources available via `ctx.resources`
 *
 * The builder is immutable - each method returns a new builder instance with
 * updated type parameters, preserving the original builder.
 *
 * @typeParam P - Type of the previous step's return value, accessible via `ctx.previous`
 * @typeParam A - Tuple type of all accumulated step results, accessible via `ctx.results`
 * @typeParam R - Record of named resources, accessible via `ctx.resources`
 *
 * @example Basic step chaining with type inference
 * ```ts
 * import { scenario } from "@probitas/builder";
 *
 * scenario("User Flow")
 *   .step("Create user", () => {
 *     return { id: 1, name: "Alice" };  // Returns { id: number, name: string }
 *   })
 *   .step("Verify user", (ctx) => {
 *     // ctx.previous is typed as { id: number, name: string }
 *     console.log(ctx.previous.name);  // Type-safe access
 *   })
 *   .build();
 * ```
 *
 * @example Using resources for shared dependencies
 * ```ts
 * import { scenario } from "@probitas/builder";
 *
 * // Mock Database for example
 * const Database = {
 *   connect: () =>
 *     Promise.resolve({
 *       query: (_sql: string) => [{ id: 1, name: "Alice" }],
 *       async [Symbol.asyncDispose]() {},
 *     }),
 * };
 *
 * scenario("Database Test")
 *   .resource("db", async () => {
 *     const conn = await Database.connect();
 *     return conn;  // Auto-disposed if implements Disposable
 *   })
 *   .step("Query data", (ctx) => {
 *     // ctx.resources.db is typed as Database connection
 *     return ctx.resources.db.query("SELECT * FROM users");
 *   })
 *   .build();
 * ```
 *
 * @see {@linkcode scenario} - Factory function to create a builder
 * @see {@linkcode StepContext} - Context object passed to each step
 */
class ScenarioBuilderInit<
  P = unknown,
  A extends readonly unknown[] = readonly [],
  R extends Record<string, unknown> = Record<string, never>,
> {
  #state: ScenarioBuilderState<R>;

  /** @internal */
  constructor(state: ScenarioBuilderState<R>) {
    this.#state = state;
  }

  /**
   * Register a named resource for this scenario.
   *
   * Resources are lifecycle-managed dependencies that are:
   * - Initialized in declaration order before any steps run
   * - Available to all steps via `ctx.resources[name]`
   * - Automatically disposed in reverse order after the scenario completes
   *
   * @typeParam K - Resource name as a string literal type
   * @typeParam T - Resource value type
   * @param name - Unique identifier for the resource (used as key in `ctx.resources`)
   * @param fn - Async function that creates and returns the resource
   * @returns New builder with the resource added to the Resources type
   *
   * @remarks
   * - Factory receives the current context with access to previously registered resources
   * - If the resource implements `Disposable` or `AsyncDisposable`, cleanup is automatic
   * - Resources are disposed even if the scenario fails or is skipped
   *
   * @example Database connection resource
   * ```ts
   * import { scenario } from "@probitas/builder";
   *
   * // Mock pg driver for example
   * const pg = {
   *   connect: (_url: string) =>
   *     Promise.resolve({
   *       query: (_sql: string) => ({ rows: [] }),
   *       async [Symbol.asyncDispose]() {},
   *     }),
   * };
   * const DATABASE_URL = "postgres://localhost/test";
   *
   * scenario("DB Test")
   *   .resource("db", async () => {
   *     const conn = await pg.connect(DATABASE_URL);
   *     return conn;  // conn[Symbol.asyncDispose] called automatically
   *   })
   *   .step("Query", (ctx) => ctx.resources.db.query("SELECT 1"))
   *   .build();
   * ```
   *
   * @example Resource depending on another resource
   * ```ts
   * import { scenario } from "@probitas/builder";
   *
   * // Mock config and API client for example
   * const loadConfig = () => Promise.resolve({ apiUrl: "https://api.example.com" });
   * class ApiClient {
   *   constructor(public url: string) {}
   * }
   *
   * scenario("Service Test")
   *   .resource("config", async () => loadConfig())
   *   .resource("api", async (ctx) => {
   *     // Access previously registered resources
   *     return new ApiClient(ctx.resources.config.apiUrl);
   *   })
   *   .build();
   * ```
   */
  resource<K extends string, T>(
    name: K,
    fn: BuilderStepFunction<T, P, A, R>,
    options?: StepOptions,
  ): ScenarioBuilderInit<P, A, R & Record<K, T>> {
    const clonedState = this.#state.clone<R & Record<K, T>>();
    clonedState.addResourceStep(name, fn as StepFunction, options);
    return new ScenarioBuilderInit(clonedState);
  }

  /**
   * Add a named setup function for side effects that need cleanup.
   *
   * Setup functions run before any steps and can return a cleanup function
   * that executes after the scenario completes (regardless of success/failure).
   *
   * @param fn - Setup function that optionally returns a cleanup handler
   * @returns New builder for chaining
   *
   * @remarks
   * Unlike resources, setup functions:
   * - Don't have a name (not accessible via `ctx.resources`)
   * - Can perform arbitrary side effects (modify files, start servers, etc.)
   * - Support both sync and async cleanup
   * - Can return `Disposable`, `AsyncDisposable`, or a cleanup function
   *
   * @example Temporary file setup
   * ```ts
   * import { scenario } from "@probitas/builder";
   *
   * scenario("File Test")
   *   .setup((ctx) => {
   *     const tempFile = Deno.makeTempFileSync();
   *     ctx.store.set("tempFile", tempFile);
   *     return () => Deno.removeSync(tempFile);  // Cleanup function
   *   })
   *   .step("Write file", (ctx) => {
   *     Deno.writeTextFileSync(ctx.store.get("tempFile") as string, "test");
   *   })
   *   .build();
   * ```
   *
   * @example Environment variable setup
   * ```ts
   * import { scenario } from "@probitas/builder";
   *
   * scenario("Env Test")
   *   .setup(() => {
   *     const original = Deno.env.get("DEBUG");
   *     Deno.env.set("DEBUG", "true");
   *     return () => {
   *       if (original) Deno.env.set("DEBUG", original);
   *       else Deno.env.delete("DEBUG");
   *     };
   *   })
   *   .build();
   * ```
   */
  setup(
    name: string,
    fn: BuilderStepFunction<SetupCleanup, P, A, R>,
    options?: StepOptions,
  ): ScenarioBuilderInit<P, A, R>;

  /**
   * Add an unnamed setup function for side effects that need cleanup.
   *
   * Setup functions run before any steps and can return a cleanup function
   * that executes after the scenario completes (regardless of success/failure).
   *
   * @param fn - Setup function that optionally returns a cleanup handler
   * @returns New builder for chaining
   *
   * @remarks
   * Unlike resources, setup functions:
   * - Don't have a name (not accessible via `ctx.resources`)
   * - Can perform arbitrary side effects (modify files, start servers, etc.)
   * - Support both sync and async cleanup
   * - Can return `Disposable`, `AsyncDisposable`, or a cleanup function
   *
   * @example Temporary file setup
   * ```ts
   * import { scenario } from "@probitas/builder";
   *
   * scenario("File Test")
   *   .setup((ctx) => {
   *     const tempFile = Deno.makeTempFileSync();
   *     ctx.store.set("tempFile", tempFile);
   *     return () => Deno.removeSync(tempFile);  // Cleanup function
   *   })
   *   .step("Write file", (ctx) => {
   *     Deno.writeTextFileSync(ctx.store.get("tempFile") as string, "test");
   *   })
   *   .build();
   * ```
   *
   * @example Environment variable setup
   * ```ts
   * import { scenario } from "@probitas/builder";
   *
   * scenario("Env Test")
   *   .setup(() => {
   *     const original = Deno.env.get("DEBUG");
   *     Deno.env.set("DEBUG", "true");
   *     return () => {
   *       if (original) Deno.env.set("DEBUG", original);
   *       else Deno.env.delete("DEBUG");
   *     };
   *   })
   *   .build();
   * ```
   */
  setup(
    fn: BuilderStepFunction<SetupCleanup, P, A, R>,
    options?: StepOptions,
  ): ScenarioBuilderInit<P, A, R>;

  setup(
    nameOrFn: string | BuilderStepFunction<SetupCleanup, P, A, R>,
    fnOrOptions?:
      | BuilderStepFunction<SetupCleanup, P, A, R>
      | StepOptions,
    stepOptions?: StepOptions,
  ): ScenarioBuilderInit<P, A, R> {
    const clonedState = this.#state.clone();
    clonedState.addSetupStep(
      nameOrFn as (string | StepFunction),
      fnOrOptions as (StepFunction | StepOptions),
      stepOptions,
    );
    return new ScenarioBuilderInit(clonedState);
  }

  /**
   * Add a named step to the scenario.
   *
   * Steps are the core execution units of a scenario. Each step:
   * - Receives a context with access to previous results and resources
   * - Can return a value that becomes `ctx.previous` for the next step
   * - Can be configured with timeout and retry options
   *
   * @typeParam T - Return type of this step (becomes `ctx.previous` for next step)
   * @param name - Human-readable step name (shown in reports)
   * @param fn - Step function receiving context and returning result
   * @param options - Optional timeout and retry configuration
   * @returns New builder with updated type parameters
   *
   * @example Named step with result passing
   * ```ts
   * import { scenario } from "@probitas/builder";
   *
   * // Mock API client for example
   * const api = {
   *   post: (_url: string, _data: unknown) => Promise.resolve({ id: "123" }),
   *   get: (_url: string) => Promise.resolve({ name: "test" }),
   * };
   * const expect = (value: unknown) => ({
   *   toBe: (_expected: unknown) => console.log("Assertion:", value),
   * });
   *
   * scenario("API Flow")
   *   .step("Create resource", async () => {
   *     const res = await api.post("/items", { name: "test" });
   *     return { id: res.id };  // T = { id: string }
   *   })
   *   .step("Verify resource", async (ctx) => {
   *     // ctx.previous is { id: string }
   *     const item = await api.get(`/items/${ctx.previous.id}`);
   *     expect(item.name).toBe("test");
   *   })
   *   .build();
   * ```
   */
  step<T>(
    name: string,
    fn: BuilderStepFunction<T, P, A, R>,
    options?: StepOptions,
  ): ScenarioBuilderInit<T, readonly [...A, T], R>;

  /**
   * Add an unnamed step to the scenario (auto-named as "Step N").
   *
   * When no name is provided, steps are automatically named "Step 1", "Step 2", etc.
   * Use this for simple scenarios where step names aren't important.
   *
   * @typeParam T - Return type of this step
   * @param fn - Step function receiving context and returning result
   * @param options - Optional timeout and retry configuration
   * @returns New builder with updated type parameters
   *
   * @example Auto-named steps
   * ```ts
   * scenario("Quick Test")
   *   .step(() => "first")   // Named "Step 1"
   *   .step(() => "second")  // Named "Step 2"
   *   .build();
   * ```
   */
  step<T>(
    fn: BuilderStepFunction<T, P, A, R>,
    options?: StepOptions,
  ): ScenarioBuilderInit<T, readonly [...A, T], R>;

  step<T>(
    nameOrFn: string | BuilderStepFunction<T, P, A, R>,
    fnOrOptions?:
      | BuilderStepFunction<T, P, A, R>
      | StepOptions,
    stepOptions?: StepOptions,
  ): ScenarioBuilderInit<T, readonly [...A, T], R> {
    const clonedState = this.#state.clone();
    clonedState.addExecutionStep(
      nameOrFn as (string | StepFunction),
      fnOrOptions as (StepFunction | StepOptions),
      stepOptions,
    );
    return new ScenarioBuilderInit(clonedState);
  }

  /**
   * Build and return the immutable scenario definition.
   *
   * Finalizes the builder chain and produces a {@linkcode ScenarioDefinition}
   * that can be executed by the runner. The definition includes:
   * - All registered resources, setups, and steps in declaration order
   * - Merged options with defaults applied
   * - Origin information for error reporting
   *
   * @returns Immutable scenario definition ready for execution
   *
   * @remarks
   * - Can be called at any point (even with no steps)
   * - The returned definition is frozen and cannot be modified
   * - Typically exported as the default export of a `.probitas.ts` file
   *
   * @example Exporting a scenario
   * ```ts
   * // auth.probitas.ts
   * import { scenario } from "@probitas/builder";
   *
   * export default scenario("Authentication")
   *   .step("Login", async () => {
   *     return { token: "abc123" };
   *   })
   *   .step("Verify session", async (ctx) => {
   *     console.log(ctx.previous.token);
   *   })
   *   .build();
   * ```
   */
  build(): ScenarioDefinition {
    return this.#state.build();
  }
}

/**
 * Create a new scenario builder with a fluent API.
 *
 * This is the primary entry point for defining scenarios. It returns a builder
 * that provides a type-safe, chainable API for constructing test scenarios.
 *
 * @param name - Human-readable scenario name (shown in test reports)
 * @param options - Optional configuration for tags, timeouts, and retry behavior
 * @returns New {@linkcode ScenarioBuilderInit} instance ready for chaining
 *
 * @remarks
 * The builder pattern enables:
 * - **Type-safe chaining**: Return values flow through steps with full type inference
 * - **Resource management**: Automatic lifecycle handling with Disposable support
 * - **Flexible configuration**: Override defaults at scenario or step level
 *
 * @example Basic scenario with type-safe step chaining
 * ```ts
 * import { scenario } from "@probitas/builder";
 *
 * // Mock user service for example
 * const createUser = (_data: { email: string }) =>
 *   Promise.resolve({ id: "user-123" });
 * const verifyEmail = (_userId: string) => Promise.resolve();
 *
 * export default scenario("User Registration")
 *   .step("Create user", async () => {
 *     const user = await createUser({ email: "test@example.com" });
 *     return { userId: user.id };
 *   })
 *   .step("Verify email", async (ctx) => {
 *     // ctx.previous is typed as { userId: string }
 *     await verifyEmail(ctx.previous.userId);
 *   })
 *   .build();
 * ```
 *
 * @example Scenario with tags for filtering
 * ```ts
 * import { scenario } from "@probitas/builder";
 *
 * scenario("Payment Integration", {
 *   tags: ["integration", "payment", "slow"],
 *   stepOptions: { timeout: 60000 }  // 1 minute timeout for all steps
 * })
 *   .step("Process payment", async () => {
 *     return { success: true };
 *   })
 *   .build();
 *
 * // Run with: probitas run -s "tag:payment"
 * ```
 *
 * @example Scenario with resources and setup
 * ```ts
 * import { scenario } from "@probitas/builder";
 *
 * // Mock Database for example
 * const Database = {
 *   connect: () =>
 *     Promise.resolve({
 *       rollback: () => {},
 *       insert: (_data: { id: number }) => {},
 *       query: (_sql: string) => [{ id: 1 }],
 *     }),
 * };
 *
 * scenario("Database Test")
 *   .resource("db", async () => await Database.connect())
 *   .setup((ctx) => {
 *     // Run migrations
 *     return () => ctx.resources.db.rollback();
 *   })
 *   .step("Insert data", (ctx) => ctx.resources.db.insert({ id: 1 }))
 *   .step("Query data", (ctx) => ctx.resources.db.query("SELECT * FROM users"))
 *   .build();
 * ```
 *
 * @see {@linkcode ScenarioBuilderInit} for available builder methods
 * @see {@linkcode BuilderScenarioOptions} for configuration options
 */
export function scenario(
  name: string,
  options?: ScenarioOptions,
): ScenarioBuilderInit {
  const state = new ScenarioBuilderState(name, options);
  return new ScenarioBuilderInit(state);
}
