/**
 * Type definitions for the Builder layer
 *
 * Types for building scenario definitions with type-safe fluent API.
 *
 * @module
 */

import type {
  ScenarioOptions,
  SetupCleanup,
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
 * @template Resources - Available resources
 */
export type StepFunction<
  P = unknown,
  T = unknown,
  A extends readonly unknown[] = readonly [],
  Resources extends Record<string, unknown> = Record<string, never>,
> = (ctx: StepContext<P, A, Resources>) => T | Promise<T>;

/**
 * Context for resource factory functions
 *
 * Resource factories receive the same StepContext as steps/setups,
 * allowing access to previous step results, shared store, and signal.
 *
 * @template ExistingResources - Already registered resources
 */
export type ResourceFactoryContext<
  P = unknown,
  A extends readonly unknown[] = readonly [],
  ExistingResources extends Record<string, unknown> = Record<string, never>,
> = StepContext<P, A, ExistingResources>;

/**
 * Resource factory function
 *
 * @template T - Type of resource to create
 * @template P - Type of the previous step result
 * @template A - Tuple type of accumulated results
 * @template ExistingResources - Already registered resources available to this factory
 */
export type ResourceFactory<
  T,
  P = unknown,
  A extends readonly unknown[] = readonly [],
  ExistingResources extends Record<string, unknown> = Record<string, never>,
> = (ctx: ResourceFactoryContext<P, A, ExistingResources>) => T | Promise<T>;

/**
 * Setup hook function with strongly typed resources
 *
 * @template P - Type of the previous step result
 * @template A - Tuple type of accumulated results
 * @template Resources - Available resources
 */
export type SetupHook<
  P = unknown,
  A extends readonly unknown[] = readonly [],
  Resources extends Record<string, unknown> = Record<string, never>,
> = (
  ctx: StepContext<P, A, Resources>,
) => SetupCleanup | Promise<SetupCleanup>;

/**
 * Resource definition
 *
 * @template T - Type of the resource
 */
export interface ResourceDefinition<T = unknown> {
  name: string;
  // deno-lint-ignore no-explicit-any
  factory: ResourceFactory<T, any>; // Type erasure for storage
}

/**
 * Partial scenario options used during building (all fields and nested fields optional)
 */
export type BuilderScenarioOptions = DeepPartial<ScenarioOptions>;

/**
 * Partial step options used during building (all fields and nested fields optional)
 */
export type BuilderStepOptions = DeepPartial<StepOptions>;
