/**
 * ScenarioBuilder - Fluent API for building scenario definitions
 *
 * Provides type-safe, fluent API for constructing scenario definitions with
 * automatic type inference for step results.
 *
 * @module
 */

import type {
  Entry,
  ResourceDefinition,
  ResourceFactory,
  ScenarioDefinition,
  ScenarioOptions,
  SetupDefinition,
  SetupFunction,
  StepDefinition,
  StepFunction,
  StepOptions,
} from "@lambdalisue/probitas-scenario";
import type { BuilderScenarioOptions, BuilderStepOptions } from "./types.ts";
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
    factory: ResourceFactory,
  ): void {
    const resourceDef: ResourceDefinition = {
      name,
      factory,
    };
    this.#entries.push({
      kind: "resource",
      value: resourceDef,
    });
  }

  addSetup(fn: SetupFunction): void {
    const location = captureSourceLocation(3);
    const setupDef: SetupDefinition = {
      fn,
      location,
    };
    this.#entries.push({
      kind: "setup",
      value: setupDef,
    });
  }

  addStep(
    nameOrFn: string | StepFunction,
    fnOrOptions?: StepFunction | BuilderStepOptions,
    stepOptions?: BuilderStepOptions,
  ): void {
    let stepName: string;
    let stepFn: StepFunction;
    let options: BuilderStepOptions | undefined;

    if (typeof nameOrFn === "string") {
      stepName = nameOrFn;
      stepFn = fnOrOptions as StepFunction;
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
      fn: stepFn as StepFunction,
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
 * @template Previous - Type of the previous step result
 * @template Results - Tuple type of accumulated results
 * @template Resources - Accumulated resource types
 */
class ScenarioBuilderInit<
  Previous = unknown,
  Results extends readonly unknown[] = readonly [],
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
   * @template T - Resource type
   * @param name - Unique resource name
   * @param factory - Function to create the resource (can access previously registered resources)
   * @returns New builder with updated Resources type
   */
  resource<K extends string, T>(
    name: K,
    factory: ResourceFactory<T, Previous, Results, Resources>,
  ): ScenarioBuilderInit<Previous, Results, Resources & Record<K, T>> {
    const clonedState = this.#state.clone<Resources & Record<K, T>>();
    clonedState.addResource(name, factory as ResourceFactory);
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
    fn: SetupFunction<Previous, Results, Resources>,
  ): ScenarioBuilderInit<Previous, Results, Resources> {
    const clonedState = this.#state.clone();
    clonedState.addSetup(fn as SetupFunction);
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
    fn: StepFunction<T, Previous, Results, Resources>,
    options?: BuilderStepOptions,
  ): ScenarioBuilderInit<T, readonly [...Results, T], Resources>;

  /**
   * Add an unnamed step to the scenario (auto-named as "Step N")
   *
   * @template T - Type of this step's return value
   * @param fn - Step function
   * @param options - Partial step options
   * @returns New builder with updated generic types
   */
  step<T>(
    fn: StepFunction<T, Previous, Results, Resources>,
    options?: BuilderStepOptions,
  ): ScenarioBuilderInit<T, readonly [...Results, T], Resources>;

  step<T>(
    nameOrFn: string | StepFunction<T, Previous, Results, Resources>,
    fnOrOptions?:
      | StepFunction<T, Previous, Results, Resources>
      | BuilderStepOptions,
    stepOptions?: BuilderStepOptions,
  ): ScenarioBuilderInit<T, readonly [...Results, T], Resources> {
    const clonedState = this.#state.clone();
    clonedState.addStep(
      nameOrFn as (string | StepFunction),
      fnOrOptions as (StepFunction | BuilderStepOptions),
      stepOptions,
    );
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
