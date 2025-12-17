/**
 * Diff formatting utilities for expect implementations.
 *
 * This module provides diff formatting for error messages,
 * showing the differences between actual and expected values.
 *
 * @module
 */

import { type Change, diffLines } from "diff";
import type { Theme } from "@probitas/core/theme";

/**
 * Options for diff formatting.
 */
export interface FormatDiffOptions {
  /** Theme for styling output */
  readonly theme: Theme;
}

/**
 * Common inspect options for consistent diff output.
 */
const INSPECT_OPTIONS: Deno.InspectOptions = {
  depth: Infinity,
  colors: false,
  breakLength: 1,
  trailingComma: true,
};

/**
 * Formats the diff between actual and expected values.
 *
 * Returns a formatted diff string showing the differences between two values.
 * Uses `npm:diff` for diff calculation and Theme for styling.
 *
 * Returns `undefined` when:
 * - Both values are primitives (string, number, boolean, null, undefined)
 * - No differences are found between values
 *
 * @param actual - The actual value
 * @param expected - The expected value
 * @param options - Formatting options
 * @returns Formatted diff string, or undefined if diff is not applicable
 *
 * @example
 * ```ts
 * import { formatDiff } from "./format_diff.ts";
 * import { noColorTheme } from "@probitas/core/theme";
 *
 * const actual = { name: "Alice", age: 30 };
 * const expected = { name: "Bob", age: 30 };
 * const diffStr = formatDiff(actual, expected, { theme: noColorTheme });
 * ```
 */
export function formatDiff(
  actual: unknown,
  expected: unknown,
  options: FormatDiffOptions,
): string | undefined {
  // Skip diff for primitives - they're already clear in the message
  if (!shouldShowDiff(actual) && !shouldShowDiff(expected)) {
    return undefined;
  }

  const { theme } = options;

  const actualStr = stringifyForDiff(actual);
  const expectedStr = stringifyForDiff(expected);

  const changes: Change[] = diffLines(actualStr, expectedStr);

  // Skip if no differences found
  if (changes.every((c) => !c.added && !c.removed)) {
    return undefined;
  }

  const lines: string[] = [];

  for (const change of changes) {
    // Remove trailing newline and split into lines
    const changeLines = change.value.replace(/\n$/, "").split("\n");

    for (const line of changeLines) {
      if (change.removed) {
        // Actual (removed) - red with "-" marker
        lines.push(theme.failure(`  - ${line}`));
      } else if (change.added) {
        // Expected (added) - green with "+" marker
        lines.push(theme.success(`  + ${line}`));
      } else {
        // Common - dim with 4-space indent
        lines.push(theme.dim(`    ${line}`));
      }
    }
  }

  return lines.join("\n");
}

/**
 * Checks if a value should show diff (non-primitive objects).
 */
function shouldShowDiff(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}

/**
 * Converts a value to a multi-line string for diff comparison.
 *
 * Uses consistent inspect options and normalizes empty containers
 * to multi-line format for better diff results.
 */
function stringifyForDiff(value: unknown): string {
  const str = Deno.inspect(value, INSPECT_OPTIONS);
  // Normalize empty containers to multi-line format
  // This ensures `{}` vs `{ foo: 1 }` shows only the added property as diff
  return str
    .replace(/^\{\}$/gm, "{\n}")
    .replace(/^\[\]$/gm, "[\n]");
}
