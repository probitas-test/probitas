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
  ScenarioDefinition,
  ScenarioOptions,
  SourceLocation,
  StepDefinition,
  StepOptions,
} from "../runner/types.ts";
import type {
  BuilderScenarioOptions,
  BuilderStepOptions,
  StepFunction,
} from "./types.ts";
import { DEFAULT_SCENARIO_OPTIONS, DEFAULT_STEP_OPTIONS } from "./defaults.ts";

/**
 * Fluent builder for constructing scenario definitions
 *
 * @template P - Type of the previous step result
 * @template A - Tuple type of accumulated results
 */
export class ScenarioBuilder<
  P = unknown,
  A extends readonly unknown[] = readonly [],
> {
  #name: string;
  #scenarioOptions: BuilderScenarioOptions;
  #steps: StepDefinition[] = [];
  #unnamedStepCount = 0;
  #scenarioLocation: SourceLocation | undefined;

  /**
   * Create a new scenario builder
   *
   * @param name - Human-readable scenario name
   * @param options - Partial scenario options
   */
  constructor(name: string, options?: BuilderScenarioOptions) {
    this.#name = name;
    this.#scenarioOptions = options || {};
    // depth=3 to skip: captureSourceLocation -> constructor -> scenario()
    this.#scenarioLocation = this.#captureSourceLocation(3);
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
    fn: StepFunction<P, T, A>,
    options?: BuilderStepOptions,
  ): ScenarioBuilder<T, readonly [...A, T]>;

  /**
   * Add an unnamed step to the scenario (auto-named as "Step N")
   *
   * @template T - Type of this step's return value
   * @param fn - Step function
   * @param options - Partial step options
   * @returns New builder with updated generic types
   */
  step<T>(
    fn: StepFunction<P, T, A>,
    options?: BuilderStepOptions,
  ): ScenarioBuilder<T, readonly [...A, T]>;

  step<T>(
    nameOrFn: string | StepFunction<P, T, A>,
    fnOrOptions?: StepFunction<P, T, A> | BuilderStepOptions,
    stepOptions?: BuilderStepOptions,
  ): ScenarioBuilder<T, readonly [...A, T]> {
    // Determine if this is named or unnamed step
    let stepName: string = "";
    let stepFn: StepFunction<P, T, A>;
    let options: BuilderStepOptions | undefined;
    let isUnnamed = false;

    if (typeof nameOrFn === "string") {
      // Named step: step("name", fn, options?)
      stepName = nameOrFn;
      stepFn = fnOrOptions as StepFunction<P, T, A>;
      options = stepOptions;
    } else {
      // Unnamed step: step(fn, options?)
      isUnnamed = true;
      stepFn = nameOrFn;
      options = fnOrOptions as BuilderStepOptions | undefined;
    }

    // Create step definition
    const stepLocation = this.#captureSourceLocation(2);
    const mergedOptions = this.#mergeStepOptions(options);

    // Count total steps to generate unnamed step names
    const totalStepsBeforeAdd = this.#steps.length;
    if (isUnnamed) {
      stepName = `Step ${totalStepsBeforeAdd + 1}`;
    }

    const stepDef: StepDefinition = {
      name: stepName,
      fn: stepFn as AnyStepFunction,
      options: mergedOptions,
      location: stepLocation,
    };

    this.#steps.push(stepDef);

    // Return new builder with updated types
    const newBuilder = new ScenarioBuilder(
      this.#name,
      this.#scenarioOptions,
    );
    newBuilder.#steps = [...this.#steps];
    newBuilder.#unnamedStepCount = this.#unnamedStepCount;
    newBuilder.#scenarioLocation = this.#scenarioLocation;
    return newBuilder as unknown as ScenarioBuilder<T, readonly [...A, T]>;
  }

  /**
   * Build and return immutable scenario definition
   *
   * @returns Immutable scenario definition with all defaults applied
   */
  build(): ScenarioDefinition {
    const mergedScenarioOptions = this.#mergeScenarioOptions();

    const definition: ScenarioDefinition = {
      name: this.#name,
      options: mergedScenarioOptions,
      steps: Object.freeze([...this.#steps]) as readonly StepDefinition[],
      location: this.#scenarioLocation,
    };

    return definition;
  }

  /**
   * Merge partial step options with scenario defaults
   *
   * @param partialOptions - Partial step options
   * @returns Merged complete step options
   */
  #mergeStepOptions(partialOptions?: BuilderStepOptions): StepOptions {
    const scenarioStepOptions = this.#scenarioOptions.stepOptions ||
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
   * Merge partial scenario options with framework defaults
   *
   * @returns Merged complete scenario options
   */
  #mergeScenarioOptions(): ScenarioOptions {
    return {
      tags: this.#scenarioOptions.tags ?? DEFAULT_SCENARIO_OPTIONS.tags,
      skip: this.#scenarioOptions.skip ?? DEFAULT_SCENARIO_OPTIONS.skip,
      setup: this.#scenarioOptions.setup ?? DEFAULT_SCENARIO_OPTIONS.setup,
      teardown: this.#scenarioOptions.teardown ??
        DEFAULT_SCENARIO_OPTIONS.teardown,
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
  }

  /**
   * Capture current source location for better error messages
   *
   * @param depth - Stack depth to skip (default 2)
   * @returns Source location or undefined if unable to determine
   */
  #captureSourceLocation(depth = 2): SourceLocation | undefined {
    try {
      const err = new Error();
      const stack = err.stack;

      if (!stack) {
        return undefined;
      }

      // Parse stack trace to get file and line
      // Format: "at file:///path/to/file.ts:line:column" or "at functionName (file.ts:line:column)"
      const stackLines = stack.split("\n");

      // Skip the requested depth + 1 for captureSourceLocation itself
      const skipLines = depth + 1;
      for (let i = skipLines; i < stackLines.length; i++) {
        const line = stackLines[i];
        // Try format with parentheses first: "at functionName (file.ts:line:column)"
        let match = line.match(/\(([^:]+):(\d+):/);

        if (!match) {
          // Try format without parentheses: "at file:///path/to/file.ts:line:column"
          match = line.match(/at\s+(.+):(\d+):/);
        }

        if (match) {
          let [, file, lineNum] = match;

          // Convert file:// URL to path and make it relative to cwd
          if (file.startsWith("file://")) {
            file = file.slice(7); // Remove "file://"
          }

          // Make relative to current working directory
          const cwd = Deno.cwd();
          if (file.startsWith(cwd)) {
            file = file.slice(cwd.length + 1); // +1 to remove leading slash
          }

          return {
            file,
            line: parseInt(lineNum, 10),
          };
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  }
}
