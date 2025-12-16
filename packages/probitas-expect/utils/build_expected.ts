/**
 * Expected value builders for diff output.
 *
 * This module provides utilities to construct expected objects
 * for diff display in partial matching scenarios.
 *
 * @module
 */

import { Any } from "./diff_any.ts";

/**
 * Builds an expected object for partial matching (toMatching).
 *
 * Combines actual object values with pattern values to create
 * a complete expected object for diff display.
 * - Pattern values override actual values for matching keys
 * - Actual values are preserved for non-pattern keys
 * - Pattern keys missing from actual are included
 *
 * @param actual - The actual object being tested
 * @param pattern - The pattern to match against
 * @returns Combined expected object for diff display
 *
 * @example
 * ```ts
 * const actual = { name: "Alice", age: 30 };
 * const pattern = { name: "Bob" };
 * const expected = buildMatchingExpected(actual, pattern);
 * // { name: "Bob", age: 30 }
 * ```
 */
export function buildMatchingExpected(
  actual: Record<string, unknown>,
  pattern: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Include all keys from actual, using pattern values where available
  for (const key of Object.keys(actual)) {
    if (key in pattern) {
      result[key] = pattern[key];
    } else {
      result[key] = actual[key];
    }
  }

  // Include pattern keys that don't exist in actual
  for (const key of Object.keys(pattern)) {
    if (!(key in actual)) {
      result[key] = pattern[key];
    }
  }

  return result;
}

/**
 * Builds an expected object for property existence check (toHaveProperty).
 *
 * Creates an expected object showing what the object should look like
 * if the property exists. Uses `Any` marker when no expected value is specified.
 *
 * @param actual - The actual object being tested
 * @param propertyPath - Dot-notation path to the property (e.g., "user.name", "items[0].id")
 * @param expectedValue - Optional expected value for the property
 * @returns Expected object with the property set
 *
 * @example
 * ```ts
 * const actual = { name: "Alice" };
 *
 * // Without expected value - shows <Any>
 * buildPropertyExpected(actual, "foo");
 * // { name: "Alice", foo: <Any> }
 *
 * // With expected value
 * buildPropertyExpected(actual, "foo", "bar");
 * // { name: "Alice", foo: "bar" }
 * ```
 */
export function buildPropertyExpected(
  actual: Record<string, unknown>,
  propertyPath: string,
  expectedValue?: unknown,
): Record<string, unknown> {
  // Deep clone actual to avoid mutation
  const result = deepClone(actual);

  // Parse the property path
  const segments = parsePropertyPath(propertyPath);

  // Set the value at the path
  setNestedValue(
    result,
    segments,
    expectedValue !== undefined ? expectedValue : Any,
  );

  return result;
}

/**
 * Parses a property path string into segments.
 * Handles both dot notation (a.b.c) and bracket notation (items[0]).
 */
function parsePropertyPath(path: string): (string | number)[] {
  const segments: (string | number)[] = [];
  const regex = /([^.\[\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) {
      // Property name (e.g., "name", "user")
      segments.push(match[1]);
    } else if (match[2] !== undefined) {
      // Array index (e.g., "[0]", "[1]")
      segments.push(parseInt(match[2], 10));
    }
  }

  return segments;
}

/**
 * Sets a value at a nested path, creating intermediate objects/arrays as needed.
 */
function setNestedValue(
  obj: Record<string, unknown>,
  segments: (string | number)[],
  value: unknown,
): void {
  let current: Record<string, unknown> | unknown[] = obj;

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];

    if (typeof segment === "number") {
      // Current segment is array index
      const arr = current as unknown[];
      if (arr[segment] === undefined || arr[segment] === null) {
        // Create intermediate object or array based on next segment
        arr[segment] = typeof nextSegment === "number" ? [] : {};
      } else if (typeof arr[segment] === "object") {
        // Clone existing object to avoid mutation
        arr[segment] = deepClone(arr[segment] as Record<string, unknown>);
      }
      current = arr[segment] as Record<string, unknown> | unknown[];
    } else {
      // Current segment is property name
      const record = current as Record<string, unknown>;
      if (record[segment] === undefined || record[segment] === null) {
        // Create intermediate object or array based on next segment
        record[segment] = typeof nextSegment === "number" ? [] : {};
      } else if (
        typeof record[segment] === "object" && record[segment] !== null
      ) {
        // Clone existing object/array to avoid mutation
        if (Array.isArray(record[segment])) {
          record[segment] = [...(record[segment] as unknown[])].map((item) =>
            typeof item === "object" && item !== null
              ? deepClone(item as Record<string, unknown>)
              : item
          );
        } else {
          record[segment] = deepClone(
            record[segment] as Record<string, unknown>,
          );
        }
      }
      current = record[segment] as Record<string, unknown> | unknown[];
    }
  }

  // Set the final value
  const lastSegment = segments[segments.length - 1];
  if (typeof lastSegment === "number") {
    (current as unknown[])[lastSegment] = value;
  } else {
    (current as Record<string, unknown>)[lastSegment] = value;
  }
}

/**
 * Deep clones an object, preserving special markers like Any.
 */
function deepClone(obj: Record<string, unknown>): Record<string, unknown> {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Preserve Any marker (singleton with Deno.customInspect)
  if (obj === Any) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === "object" && item !== null
        ? deepClone(item as Record<string, unknown>)
        : item
    ) as unknown as Record<string, unknown>;
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === "object" && value !== null) {
      result[key] = deepClone(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}
