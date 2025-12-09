/**
 * Assertion helper functions for expect implementations.
 *
 * This module provides generic assertion utilities that throw errors
 * when conditions are not met.
 *
 * @module
 */

/**
 * Generic assertion helper that throws an error if condition is not met.
 * Supports optional negation logic.
 *
 * @param condition - The condition to check
 * @param errorMessage - Error message when condition fails
 * @param negate - If true, throws when condition is true instead
 * @param negatedErrorMessage - Optional error message for negated case
 */
export function assert(
  condition: boolean,
  errorMessage: string,
  negate = false,
  negatedErrorMessage?: string,
): void {
  if (negate ? condition : !condition) {
    throw new Error(
      negate && negatedErrorMessage ? negatedErrorMessage : errorMessage,
    );
  }
}

/**
 * Asserts numeric comparison with various operators.
 *
 * @param actual - Actual value
 * @param expected - Expected value
 * @param operator - Comparison operator
 * @param valueName - Name of the value being compared (for error messages)
 * @returns void, throws on failure
 */
export function assertNumericComparison(
  actual: number,
  expected: number,
  operator: "===" | ">" | "<" | ">=" | "<=",
  valueName: string,
): void {
  let condition: boolean;
  let message: string;

  switch (operator) {
    case "===":
      condition = actual === expected;
      message = `Expected ${valueName} ${expected}, got ${actual}`;
      break;
    case ">":
      condition = actual > expected;
      message = `Expected ${valueName} > ${expected}, but got ${actual}`;
      break;
    case "<":
      condition = actual < expected;
      message = `Expected ${valueName} < ${expected}, but got ${actual}`;
      break;
    case ">=":
      condition = actual >= expected;
      message = `Expected ${valueName} >= ${expected}, but got ${actual}`;
      break;
    case "<=":
      condition = actual <= expected;
      message = `Expected ${valueName} <= ${expected}, but got ${actual}`;
      break;
  }

  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Asserts that a value is included in an array.
 *
 * @param array - Array to search
 * @param value - Value to find
 * @param valueName - Name of the value (for error messages)
 */
export function assertIncludes<T>(
  array: T[],
  value: T,
  valueName: string,
): void {
  if (!array.includes(value)) {
    throw new Error(
      `Expected ${valueName} to be one of [${array.join(", ")}], got ${value}`,
    );
  }
}

/**
 * Asserts that a string matches a pattern (string or regex).
 *
 * @param actual - Actual string value
 * @param pattern - Expected pattern (string for exact match, RegExp for pattern)
 * @param valueName - Name of the value (for error messages)
 */
export function assertMatches(
  actual: string,
  pattern: string | RegExp,
  valueName: string,
): void {
  if (typeof pattern === "string") {
    if (actual !== pattern) {
      throw new Error(`Expected ${valueName} "${pattern}", got "${actual}"`);
    }
  } else {
    if (!pattern.test(actual)) {
      throw new Error(
        `Expected ${valueName} to match ${pattern}, got "${actual}"`,
      );
    }
  }
}

/**
 * Asserts that a string contains a substring.
 *
 * @param actual - Actual string value
 * @param substring - Expected substring
 * @param valueName - Name of the value (for error messages)
 */
export function assertContains(
  actual: string,
  substring: string,
  valueName: string,
): void {
  if (!actual.includes(substring)) {
    throw new Error(
      `Expected ${valueName} to contain "${substring}", got "${actual}"`,
    );
  }
}

/**
 * Gets a non-null value or throws an error.
 *
 * @param value - Value to check
 * @param valueName - Name of the value (for error messages)
 * @returns The value if not null/undefined
 * @throws Error if value is null or undefined
 */
export function getNonNull<T>(
  value: T | null | undefined,
  valueName: string,
): T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${valueName} to exist, but got ${value}`);
  }
  return value;
}
