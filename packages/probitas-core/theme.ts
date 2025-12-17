/**
 * Theme implementation
 *
 * Provides semantic color functions for reporters.
 *
 * @module
 */

import { cyan, gray, green, red, yellow } from "@std/fmt/colors";

/**
 * Apply light gray color (ANSI 256-color mode).
 * Used for resource and setup step titles as subtle secondary information.
 */
const lightGray = (text: string): string => `\x1b[38;5;243m${text}\x1b[0m`;

/**
 * Apply bold style with full reset.
 * Uses \x1b[0m instead of \x1b[22m for better terminal compatibility.
 */
const boldWithReset = (text: string): string => `\x1b[1m${text}\x1b[0m`;

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
 * import type { Theme } from "@probitas/core/theme";
 *
 * const myTheme: Theme = {
 *   success: (t) => `\x1b[32m${t}\x1b[0m`,
 *   failure: (t) => `\x1b[1;31m${t}\x1b[0m`,
 *   skip: (t) => `\x1b[33m${t}\x1b[0m`,
 *   dim: (t) => `\x1b[90m${t}\x1b[0m`,
 *   title: (t) => `\x1b[1m${t}\x1b[0m`,
 *   info: (t) => `\x1b[36m${t}\x1b[0m`,
 *   warning: (t) => `\x1b[33m${t}\x1b[0m`,
 *   lightGray: (t) => `\x1b[38;5;243m${t}\x1b[0m`,
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

  /** Style for light gray text (used for resource/setup step titles) */
  readonly lightGray: ThemeFunction;
}

/**
 * Default theme with colors
 */
export const colorTheme: Theme = {
  success: green,
  failure: red,
  skip: yellow,
  dim: gray,
  title: boldWithReset,
  info: cyan,
  warning: yellow,
  lightGray: lightGray,
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
  lightGray: (text) => text,
};

export const defaultTheme = Deno.noColor ? noColorTheme : colorTheme;

/**
 * Regular expression pattern for ANSI escape sequences.
 *
 * Matches SGR (Select Graphic Rendition) sequences like:
 * - `\x1b[0m` (reset)
 * - `\x1b[32m` (green)
 * - `\x1b[1;31m` (bold red)
 */
// deno-lint-ignore no-control-regex
const ANSI_ESCAPE_SEQUENCE_PATTERN = /\x1b\[[0-9;]*m/g;

/**
 * Remove ANSI color codes from a string.
 *
 * Useful for testing output that may contain color codes,
 * ensuring consistent snapshot comparisons across environments.
 *
 * @param text - The text to strip color codes from
 * @returns The text without ANSI color codes
 *
 * @example
 * ```ts
 * import { removeColors } from "@probitas/core/theme";
 *
 * const colored = "\x1b[32mSuccess\x1b[0m";
 * const plain = removeColors(colored);
 * // => "Success"
 * ```
 */
export function removeColors(text: string): string {
  return text.replace(ANSI_ESCAPE_SEQUENCE_PATTERN, "");
}
