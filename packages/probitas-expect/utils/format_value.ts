/**
 * Formatting utilities for expect implementations.
 *
 * This module provides value formatting using @std/internal/format
 * for consistent formatting that matches Deno's built-in assertion library.
 *
 * @module
 */

import { format } from "@std/internal/format";

/**
 * Formats a value for display in error messages.
 *
 * Uses @std/internal/format for consistent formatting that matches
 * Deno's built-in assertion library.
 *
 * @param value - The value to format
 * @returns Formatted string representation
 */
export function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  return format(value);
}
