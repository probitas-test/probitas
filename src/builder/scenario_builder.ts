/**
 * ScenarioBuilder - Fluent API for building scenario definitions
 *
 * Provides type-safe, fluent API for constructing scenario definitions with
 * automatic type inference for step results.
 *
 * @module
 */

import type {
  AnyStepFunction,
  Entry,
  RunnerResourceFactory,
  RunnerSetupFunction,
  ScenarioDefinition,
  ScenarioOptions,
  StepDefinition,
  StepOptions,
} from "../runner/types.ts";
import type {
  BuilderScenarioOptions,
  BuilderStepOptions,
  ResourceFactoryContext,
  SetupHook,
  StepFunction,
} from "./types.ts";
import { DEFAULT_SCENARIO_OPTIONS, DEFAULT_STEP_OPTIONS } from "./defaults.ts";
import { captureSourceLocation } from "./capture_source_location.ts";

/**
 * Merge partial step options with scenario defaults
 *
 * @param scenarioOptions - Scenario options containing default step options
 * @param partialOptions - Partial step options to merge
 * @returns Merged complete step options
 */
function mergeStepOptions(
  scenarioOptions: BuilderScenarioOptions,
  partialOptions?: BuilderStepOptions,
): StepOptions {
  const scenarioStepOptions = scenarioOptions.stepOptions ||
    DEFAULT_STEP_OPTIONS;

  return {
    timeout: partialOptions?.timeout ?? scenarioStepOptions.timeout ??
      DEFAULT_STEP_OPTIONS.timeout,
    retry: {
      maxAttempts: partialOptions?.retry?.maxAttempts ??
        scenarioStepOptions.retry?.maxAttempts ??
        DEFAULT_STEP_OPTIONS.retry.maxAttempts,
      backoff: partialOptions?.retry?.backoff ??
        scenarioStepOptions.retry?.backoff ??
        DEFAULT_STEP_OPTIONS.retry.backoff,
    },
  };
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
  #scenarioOptions: BuilderScenarioOptions;
  #entries: Entry[] = [];

  constructor(name: string, options?: BuilderScenarioOptions) {
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
    const clonedOptions: BuilderScenarioOptions = {
      ...this.#scenarioOptions,
      tags: this.#scenarioOptions.tags
        ? [...this.#scenarioOptions.tags]
        : undefined,
      stepOptions: this.#scenarioOptions.stepOptions
        ? {
          ...this.#scenarioOptions.stepOptions,
          retry: this.#scenarioOptions.stepOptions.retry
            ? {
              ...this.#scenarioOptions.stepOptions.retry,
            }
            : undefined,
        }
        : undefined,
    };

    const cloned = new ScenarioBuilderState<NewResources>(
      this.#name,
      clonedOptions,
    );
    cloned.#entries = [...this.#entries];
    return cloned;
  }

  addResource(
    name: string,
    // deno-lint-ignore no-explicit-any
    factory: (...args: any[]) => any,
  ): void {
    const runtimeFactory = factory as RunnerResourceFactory;
    this.#entries.push({
      kind: "resource",
      value: { name, factory: runtimeFactory },
    });
  }

  // deno-lint-ignore no-explicit-any
  addSetup(fn: (...args: any[]) => any): void {
    const location = captureSourceLocation(3);
    const runtimeFn = fn as RunnerSetupFunction;
    this.#entries.push({
      kind: "setup",
      value: { fn: runtimeFn, location },
    });
  }

  addStep<P, T, A extends readonly unknown[]>(
    nameOrFn: string | StepFunction<P, T, A, Resources>,
    fnOrOptions?: StepFunction<P, T, A, Resources> | BuilderStepOptions,
    stepOptions?: BuilderStepOptions,
  ): void {
    let stepName: string;
    let stepFn: StepFunction<P, T, A, Resources>;
    let options: BuilderStepOptions | undefined;

    if (typeof nameOrFn === "string") {
      stepName = nameOrFn;
      stepFn = fnOrOptions as StepFunction<P, T, A, Resources>;
      options = stepOptions;
    } else {
      // Count only steps for auto-naming
      const stepCount = this.#entries.filter((e) => e.kind === "step").length;
      stepName = `Step ${stepCount + 1}`;
      stepFn = nameOrFn;
      options = fnOrOptions as BuilderStepOptions | undefined;
    }

    const stepLocation = captureSourceLocation(3);
    const mergedOptions = mergeStepOptions(this.#scenarioOptions, options);

    const stepDef: StepDefinition = {
      name: stepName,
      fn: stepFn as AnyStepFunction,
      options: mergedOptions,
      location: stepLocation,
    };

    this.#entries.push({
      kind: "step",
      value: stepDef,
    });
  }

  build(): ScenarioDefinition {
    const mergedScenarioOptions: ScenarioOptions = {
      tags: this.#scenarioOptions.tags ?? DEFAULT_SCENARIO_OPTIONS.tags,
      skip: this.#scenarioOptions.skip ?? DEFAULT_SCENARIO_OPTIONS.skip,
      stepOptions: {
        timeout: this.#scenarioOptions.stepOptions?.timeout ??
          DEFAULT_SCENARIO_OPTIONS.stepOptions.timeout,
        retry: {
          maxAttempts: this.#scenarioOptions.stepOptions?.retry?.maxAttempts ??
            DEFAULT_SCENARIO_OPTIONS.stepOptions.retry.maxAttempts,
          backoff: this.#scenarioOptions.stepOptions?.retry?.backoff ??
            DEFAULT_SCENARIO_OPTIONS.stepOptions.retry.backoff,
        },
      },
    };

    // Capture location at build time
    // depth=3 to skip: captureSourceLocation -> State.build -> BuilderClass.build
    const scenarioLocation = captureSourceLocation(3);

    const definition: ScenarioDefinition = {
      name: this.#name,
      options: mergedScenarioOptions,
      entries: Object.freeze([...this.#entries]) as readonly Entry[],
      location: scenarioLocation,
    };

    return definition;
  }
}

/**
 * Scenario builder - allows resource(), setup(), step(), build() at any time
 *
 * @template P - Type of the previous step result
 * @template A - Tuple type of accumulated results
 * @template Resources - Accumulated resource types
 */
class ScenarioBuilderInit<
  P = unknown,
  A extends readonly unknown[] = readonly [],
  Resources extends Record<string, unknown> = Record<string, never>,
> {
  #state: ScenarioBuilderState<Resources>;

  constructor(state: ScenarioBuilderState<Resources>) {
    this.#state = state;
  }

  /**
   * Register a resource for this scenario
   *
   * Resources are initialized in declaration order.
   * If a resource implements AsyncDisposable or Disposable, it will be automatically
   * disposed in reverse order.
   *
   * @template K - Resource name (string literal)
   * @template R - Resource type
   * @param name - Unique resource name
   * @param factory - Function to create the resource (can access previously registered resources)
   * @returns New builder with updated Resources type
   */
  resource<K extends string, R>(
    name: K,
    factory: (ctx: ResourceFactoryContext<P, A, Resources>) => R | Promise<R>,
  ): ScenarioBuilderInit<P, A, Resources & Record<K, R>> {
    const clonedState = this.#state.clone<Resources & Record<K, R>>();
    clonedState.addResource(name, factory);
    return new ScenarioBuilderInit(clonedState);
  }

  /**
   * Add a setup function to the scenario
   *
   * Setup functions can return a cleanup function or Disposable for automatic cleanup.
   * Can be called multiple times and at any point in the builder chain.
   *
   * @param fn - Setup function that can return cleanup
   * @returns Same builder for chaining
   */
  setup(
    fn: SetupHook<P, A, Resources>,
  ): ScenarioBuilderInit<P, A, Resources> {
    const clonedState = this.#state.clone();
    clonedState.addSetup(fn);
    return new ScenarioBuilderInit(clonedState);
  }

  /**
   * Add a named step to the scenario
   *
   * @template T - Type of this step's return value
   * @param name - Step name
   * @param fn - Step function
   * @param options - Partial step options
   * @returns New builder with updated generic types
   */
  step<T>(
    name: string,
    fn: StepFunction<P, T, A, Resources>,
    options?: BuilderStepOptions,
  ): ScenarioBuilderInit<T, readonly [...A, T], Resources>;

  /**
   * Add an unnamed step to the scenario (auto-named as "Step N")
   *
   * @template T - Type of this step's return value
   * @param fn - Step function
   * @param options - Partial step options
   * @returns New builder with updated generic types
   */
  step<T>(
    fn: StepFunction<P, T, A, Resources>,
    options?: BuilderStepOptions,
  ): ScenarioBuilderInit<T, readonly [...A, T], Resources>;

  step<T>(
    nameOrFn: string | StepFunction<P, T, A, Resources>,
    fnOrOptions?: StepFunction<P, T, A, Resources> | BuilderStepOptions,
    stepOptions?: BuilderStepOptions,
  ): ScenarioBuilderInit<T, readonly [...A, T], Resources> {
    const clonedState = this.#state.clone();
    clonedState.addStep(nameOrFn, fnOrOptions, stepOptions);
    return new ScenarioBuilderInit(clonedState);
  }

  /**
   * Build and return immutable scenario definition
   *
   * Can be called at any time.
   *
   * @returns Immutable scenario definition with all defaults applied
   */
  build(): ScenarioDefinition {
    return this.#state.build();
  }
}

/**
 * Create a new scenario builder with fluent API
 *
 * @param name - Human-readable scenario name
 * @param options - Optional partial scenario options
 * @returns New ScenarioBuilder instance with empty result chain
 *
 * @example
 * ```ts
 * const definition = scenario("User Registration")
 *   .step("Create user", async () => {
 *     const user = await createUser({ email: "test@example.com" });
 *     return user.id;
 *   })
 *   .step("Verify email", async (ctx) => {
 *     const userId = ctx.previous;
 *     await verifyEmail(userId);
 *   })
 *   .build();
 * ```
 */
export function scenario(
  name: string,
  options?: BuilderScenarioOptions,
): ScenarioBuilderInit {
  const state = new ScenarioBuilderState(name, options);
  return new ScenarioBuilderInit(state);
}
