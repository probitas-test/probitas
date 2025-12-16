/**
 * Formatting utilities for expect implementations.
 *
 * This module provides value formatting for error messages.
 *
 * @module
 */

/** Maximum length for formatted output */
const MAX_LENGTH = 80;

/**
 * Formats a value for display in error messages.
 *
 * Keeps output concise (max ~80 characters) by:
 * - Using Deno.inspect with depth: 0 (shows structure only)
 * - Replacing [Array] with [...] and [Object] with {...}
 * - Truncating long output with "..."
 *
 * @param value - The value to format
 * @returns Formatted string representation
 */
export function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") {
    if (value.length <= MAX_LENGTH) return value;
    return value.slice(0, MAX_LENGTH - 3) + "...";
  }
  let str = Deno.inspect(value, {
    compact: true,
    breakLength: Infinity,
    depth: 0,
  });
  // Replace [Array] with [...] and [Object] with {...}
  str = str.replace(/\[Array\]/g, "[...]").replace(/\[Object\]/g, "{...}");
  if (str.length <= MAX_LENGTH) return str;
  return str.slice(0, MAX_LENGTH - 3) + "...";
}
