/**
 * Theme implementation
 *
 * Provides semantic color functions for reporters.
 *
 * @module
 */

import { bold, cyan, gray, green, red, yellow } from "@std/fmt/colors";

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
 * @see {@linkcode colorTheme} for the built-in colored theme
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
 * Default theme with colors
 */
export const colorTheme: Theme = {
  success: green,
  failure: red,
  skip: yellow,
  dim: gray,
  title: bold,
  info: cyan,
  warning: yellow,
};

/**
 * No-color theme (NO_COLOR compatible)
 */
export const noColorTheme: Theme = {
  success: (text) => text,
  failure: (text) => text,
  skip: (text) => text,
  dim: (text) => text,
  title: (text) => text,
  info: (text) => text,
  warning: (text) => text,
};

export const defaultTheme = Deno.noColor ? noColorTheme : colorTheme;
