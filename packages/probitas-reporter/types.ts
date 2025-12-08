/**
 * Type definitions for the Reporter layer
 *
 * Types for reporting and formatting test execution results.
 *
 * @module
 */

import type { LogLevel } from "@probitas/logger";

/**
 * Function type for theme color/styling transformations.
 *
 * Takes a string and returns a styled version (typically with ANSI codes).
 *
 * @example
 * ```ts
 * const bold: ThemeFunction = (text) => `\x1b[1m${text}\x1b[0m`;
 * const green: ThemeFunction = (text) => `\x1b[32m${text}\x1b[0m`;
 * ```
 */
export type ThemeFunction = (text: string) => string;

/**
 * Theme interface for semantic output styling.
 *
 * Provides a consistent vocabulary for styling test output. Use semantic
 * names (`success`, `failure`) rather than colors (`green`, `red`) to
 * support different terminal themes and accessibility needs.
 *
 * @example Custom theme
 * ```ts
 * const myTheme: Theme = {
 *   success: (t) => chalk.green(t),
 *   failure: (t) => chalk.red.bold(t),
 *   skip: (t) => chalk.yellow(t),
 *   dim: (t) => chalk.gray(t),
 *   title: (t) => chalk.bold(t),
 *   info: (t) => chalk.cyan(t),
 *   warning: (t) => chalk.yellow(t)
 * };
 * ```
 *
 * @see {@linkcode defaultTheme} for the built-in colored theme
 * @see {@linkcode noColorTheme} for the plain text theme
 */
export interface Theme {
  /** Style for successful/passing states */
  readonly success: ThemeFunction;

  /** Style for failed/error states */
  readonly failure: ThemeFunction;

  /** Style for skipped states */
  readonly skip: ThemeFunction;

  /** Style for secondary/muted information */
  readonly dim: ThemeFunction;

  /** Style for titles and headers */
  readonly title: ThemeFunction;

  /** Style for informational messages */
  readonly info: ThemeFunction;

  /** Style for warnings */
  readonly warning: ThemeFunction;
}

/**
 * Configuration options for reporter initialization.
 *
 * Controls output destination, coloring, and styling for test reporters.
 *
 * @example Basic usage
 * ```ts
 * const reporter = new ListReporter({
 *   noColor: true,  // Disable colors for CI
 *   logLevel: "info"
 * });
 * ```
 *
 * @example Custom output stream
 * ```ts
 * const file = await Deno.open("results.txt", { write: true });
 * const reporter = new ListReporter({
 *   output: file.writable,
 *   noColor: true
 * });
 * ```
 */
export interface ReporterOptions {
  /**
   * Output stream for writing results.
   *
   * @default Deno.stderr.writable
   */
  readonly output?: WritableStream;

  /**
   * Minimum log level for output.
   *
   * - `"fatal"`: Only critical failures
   * - `"warning"`: Warnings and errors (default)
   * - `"info"`: Informational messages and above
   * - `"debug"`: All messages including debug
   *
   * @default "warning"
   */
  readonly logLevel?: LogLevel;

  /**
   * Disable colored output.
   *
   * When `true`, uses plain text without ANSI color codes.
   * Useful for CI environments or piping to files.
   *
   * @remarks
   * The reporter itself does not check the `NO_COLOR` environment variable.
   * The CLI handles `NO_COLOR` via `Deno.noColor` and passes it as this option.
   * If using reporters directly, you can check `Deno.noColor` yourself.
   *
   * @default false
   */
  readonly noColor?: boolean;

  /**
   * Custom theme for styling output.
   *
   * If not provided, uses {@linkcode defaultTheme} (or {@linkcode noColorTheme}
   * if `noColor` is true).
   */
  readonly theme?: Theme;
}
