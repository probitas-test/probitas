/**
 * Theme implementation
 *
 * Provides semantic color functions for reporters.
 *
 * @module
 */

import { bold, cyan, gray, green, red, yellow } from "@std/fmt/colors";
import type { Theme } from "./types.ts";

/**
 * Default theme with colors
 */
export const defaultTheme: Theme = {
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
