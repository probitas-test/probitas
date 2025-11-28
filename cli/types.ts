/**
 * Type definitions for the CLI module
 *
 * @module
 */

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
 * ProbitasConfig - Configuration loaded from deno.json/deno.jsonc
 *
 * Configuration is stored in the "probitas" section of deno.json.
 */
export interface ProbitasConfig {
  /** Default reporter (dot/list/json/tap) */
  readonly reporter?: "dot" | "list" | "json" | "tap";

  /** File discovery patterns (glob) */
  readonly includes?: readonly string[];

  /** Exclude patterns (glob) */
  readonly excludes?: readonly string[];

  /** Default selectors (supports ! prefix for negation) */
  readonly selectors?: readonly string[];

  /** Maximum concurrent scenarios */
  readonly maxConcurrency?: number;

  /** Maximum failures before stopping */
  readonly maxFailures?: number;
}
