/**
 * Formatting utilities for expect implementations.
 *
 * This module provides formatting and diff utilities using standard libraries:
 * - @std/fmt/colors for color formatting with NO_COLOR support
 * - @std/internal/diff for smart difference detection (LCS algorithm)
 * - @std/internal/format for consistent value formatting
 * - @std/internal/build-message for creating readable diff output
 *
 * @module
 */

import { bold, green, red } from "@std/fmt/colors";
import { buildMessage } from "@std/internal/build-message";
import { diff } from "@std/internal/diff";
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

/**
 * Generates a diff between actual and expected values using LCS algorithm.
 *
 * This uses @std/internal/diff which implements a Longest Common Subsequence
 * algorithm for intelligent diff generation. This produces much more readable
 * output than simple line-by-line comparison, especially for arrays and nested objects.
 *
 * @param actual - The actual value
 * @param expected - The expected value
 * @returns Array of formatted diff lines (includes [Diff] header)
 */
export function formatDifferences(
  actual: unknown,
  expected: unknown,
): string[] {
  const actualStr = formatValue(actual);
  const expectedStr = formatValue(expected);

  if (actualStr === expectedStr) {
    return [];
  }

  const actualLines = actualStr.split("\n");
  const expectedLines = expectedStr.split("\n");

  // Use @std/internal/diff for smart LCS-based diffing
  const diffResult = diff(actualLines, expectedLines);

  // buildMessage returns the complete diff output with colors and [Diff] header
  return buildMessage(diffResult);
}

/**
 * Builds a structured error message with diffs.
 *
 * @param header - The error header message
 * @param diffs - Array of diff lines from formatDifferences (includes [Diff] header and colors)
 * @param expected - The expected value
 * @param actual - The actual value
 * @returns Formatted error message
 */
export function buildErrorMessage(
  header: string,
  diffs: string[],
  expected: unknown,
  actual: unknown,
): string {
  const lines: string[] = [header];

  // Add diff output if available (already includes [Diff] header with colors)
  if (diffs.length > 0) {
    lines.push(...diffs);
  }

  lines.push("");
  lines.push(bold(green("Expected:")));
  lines.push(formatValue(expected));
  lines.push("");
  lines.push(bold(red("Actual:")));
  lines.push(formatValue(actual));

  return lines.join("\n");
}

/**
 * Strips ANSI escape sequences from a string.
 * Useful for testing error messages.
 *
 * @param text - Text with ANSI codes
 * @returns Text without ANSI codes
 */
export function stripAnsi(text: string): string {
  // deno-lint-ignore no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}
