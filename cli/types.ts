/**
 * Type definitions for the CLI module
 *
 * @module
 */

import type { Reporter, RunOptions } from "../src/runner/types.ts";

/**
 * Selector type for filtering scenarios
 */
export type SelectorType = "tag" | "name";

/**
 * Selector for filtering scenarios
 */
export interface Selector {
  /** Type of selector */
  readonly type: SelectorType;

  /** Value to match (string or RegExp) */
  readonly value: string | RegExp;

  /** Negation flag - if true, matches scenarios that do NOT match the selector */
  readonly negated: boolean;
}

/**
 * ProbitasConfig - Configuration type for CLI
 *
 * Extends RunOptions with CLI-specific settings for file patterns and reporter names.
 */
export interface ProbitasConfig
  extends Omit<RunOptions, "reporter" | "signal"> {
  /** Include patterns (glob, file, directory, or RegExp) */
  readonly includes?: (string | RegExp)[];

  /** Exclude patterns (glob, file, directory, or RegExp) */
  readonly excludes?: (string | RegExp)[];

  /** Reporter (string name or Reporter instance) */
  readonly reporter?: string | Reporter;

  /** Verbosity level */
  readonly verbosity?: "quiet" | "normal" | "verbose" | "debug";

  /** Selectors for filtering scenarios (CLI-specific, supports ! prefix for negation) */
  readonly selectors?: readonly string[];
}
