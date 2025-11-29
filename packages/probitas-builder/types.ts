/**
 * Type definitions for the Builder layer
 *
 * Types for building scenario definitions with type-safe fluent API.
 * Re-exports core types from the scenario module.
 *
 * @module
 */

import type {
  ScenarioOptions,
  StepOptions,
} from "@lambdalisue/probitas-scenario";

/**
 * Deep partial type - makes all properties and nested properties optional
 *
 * Excludes functions and arrays from deep processing to preserve their types.
 */
// deno-lint-ignore no-explicit-any
type DeepPartial<T> = T extends (...args: any[]) => any ? T
  // deno-lint-ignore no-explicit-any
  : T extends readonly any[] ? T
  : T extends object ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Partial scenario options used during building (all fields and nested fields optional)
 */
export type BuilderScenarioOptions = DeepPartial<ScenarioOptions>;

/**
 * Partial step options used during building (all fields and nested fields optional)
 */
export type BuilderStepOptions = DeepPartial<StepOptions>;

// Re-export core types used by builder consumers
export type {
  ResourceFactory,
  SetupCleanup,
  SetupFunction,
  StepContext,
  StepFunction,
} from "@lambdalisue/probitas-scenario";
