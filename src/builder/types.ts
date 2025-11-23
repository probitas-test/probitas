/**
 * Type definitions for the Builder layer
 *
 * Types for building scenario definitions with type-safe fluent API.
 *
 * @module
 */

import type {
  ScenarioOptions,
  StepContext,
  StepOptions,
} from "../runner/types.ts";

/**
 * Deep partial type - makes all properties and nested properties optional
 *
 * Excludes functions and arrays from deep processing to preserve their types.
 */
// deno-lint-ignore no-explicit-any
export type DeepPartial<T> = T extends (...args: any[]) => any ? T
  // deno-lint-ignore no-explicit-any
  : T extends readonly any[] ? T
  : T extends object ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Function signature for a step in the builder
 *
 * @template P - Type of the previous step result
 * @template T - Type of this step's return value
 * @template A - Tuple type of accumulated results
 */
export type StepFunction<
  P = unknown,
  T = unknown,
  A extends readonly unknown[] = readonly [],
> = (ctx: StepContext<P, A>) => T | Promise<T>;

/**
 * Partial scenario options used during building (all fields and nested fields optional)
 */
export type BuilderScenarioOptions = DeepPartial<ScenarioOptions>;

/**
 * Partial step options used during building (all fields and nested fields optional)
 */
export type BuilderStepOptions = DeepPartial<StepOptions>;
