/**
 * Origin type for tracking where code was defined.
 *
 * Captured automatically when defining scenarios, steps, and setups.
 * Used by reporters to show meaningful stack traces and error locations.
 *
 * @module
 *
 * @example
 * ```ts
 * import type { Origin } from "@probitas/core/origin";
 *
 * const origin: Origin = {
 *   path: "/project/tests/auth.probitas.ts",
 *   line: 42
 * };
 * ```
 */

/**
 * Origin information for tracking where code was defined.
 *
 * This interface captures the file path and optional line/column numbers
 * where a scenario, step, or setup was defined. This information is used
 * for error reporting, debugging, and generating meaningful stack traces.
 *
 * @example
 * ```ts
 * const origin: Origin = {
 *   path: "/project/tests/auth.probitas.ts",
 *   line: 42,
 *   column: 5
 * };
 * ```
 */
export interface Origin {
  /** Absolute file path where the element was defined */
  readonly path: string;

  /** Line number in the file (1-indexed) */
  readonly line?: number;

  /** Column number in the file (1-indexed) */
  readonly column?: number;
}

/**
 * Options for formatting an origin location.
 */
export interface FormatOriginOptions {
  /** Prefix to add before the formatted origin (e.g., "(") */
  prefix?: string;
  /** Suffix to add after the formatted origin (e.g., ")") */
  suffix?: string;
  /**
   * Base directory to make paths relative to.
   * If provided, absolute paths will be converted to relative paths.
   */
  cwd?: string;
}

/**
 * Format an origin location for display.
 *
 * Converts an Origin object into a human-readable string showing the file path
 * and optional line/column numbers. Useful for error messages and reporters.
 *
 * @param origin - The origin location to format
 * @param options - Formatting options
 * @returns Formatted string like "(file.ts:42)" or empty string if no origin
 *
 * @example
 * ```ts
 * import { formatOrigin } from "@probitas/core/origin";
 *
 * const origin = { path: "/project/test.ts", line: 42 };
 *
 * formatOrigin(origin);
 * // => "/project/test.ts:42"
 *
 * formatOrigin(origin, { prefix: "(", suffix: ")" });
 * // => "(test.ts:42)"
 *
 * formatOrigin(origin, { cwd: "/project" });
 * // => "test.ts:42"
 * ```
 */
export function formatOrigin(
  origin?: Origin,
  options: FormatOriginOptions = {},
): string {
  if (!origin) {
    return "";
  }
  const { prefix = "", suffix = "", cwd } = options;
  let { path } = origin;
  const { line, column } = origin;

  // Convert absolute path to relative if cwd is provided
  if (cwd && path.startsWith(cwd)) {
    path = path.slice(cwd.length + 1);
  }

  if (column !== undefined && line !== undefined) {
    return `${prefix}${path}:${line}:${column}${suffix}`;
  } else if (line !== undefined) {
    return `${prefix}${path}:${line}${suffix}`;
  }
  return `${prefix}${path}${suffix}`;
}
