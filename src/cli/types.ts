/**
 * Type definitions for the CLI module
 *
 * @module
 */

import type { StepOptions } from "@probitas/core";

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

  /** Default timeout for scenario execution (string format like "30s", "10m") */
  readonly timeout?: string;

  /** Default step options (timeout, retry) applied to all steps */
  readonly stepOptions?: StepOptions;
}
