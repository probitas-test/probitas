/**
 * Error message builders for expect implementations.
 *
 * This module provides functions that generate formatted error messages
 * for various types of assertion failures.
 *
 * @module
 */

/**
 * Build error message for count assertion.
 *
 * @param expected - Expected count
 * @param actual - Actual count
 * @param itemName - Name of items being counted (e.g., "rows", "documents", "messages")
 * @returns Formatted error message
 */
export function buildCountError(
  expected: number,
  actual: number,
  itemName: string = "items",
): string {
  return `Expected ${expected} ${itemName}, got ${actual}`;
}

/**
 * Build error message for "at least" count assertion.
 *
 * @param min - Minimum expected count
 * @param actual - Actual count
 * @param itemName - Name of items being counted
 * @returns Formatted error message
 */
export function buildCountAtLeastError(
  min: number,
  actual: number,
  itemName: string = "items",
): string {
  return `Expected at least ${min} ${itemName}, got ${actual}`;
}

/**
 * Build error message for "at most" count assertion.
 *
 * @param max - Maximum expected count
 * @param actual - Actual count
 * @param itemName - Name of items being counted
 * @returns Formatted error message
 */
export function buildCountAtMostError(
  max: number,
  actual: number,
  itemName: string = "items",
): string {
  return `Expected at most ${max} ${itemName}, got ${actual}`;
}

/**
 * Build error message for duration assertion.
 *
 * @param threshold - Maximum allowed duration in ms
 * @param actual - Actual duration in ms
 * @returns Formatted error message
 */
export function buildDurationError(
  threshold: number,
  actual: number,
): string {
  return `Expected duration < ${threshold}ms, got ${actual}ms`;
}

/**
 * Builds an error message for duration less than or equal assertion failures.
 *
 * @param threshold - Maximum duration threshold in milliseconds
 * @param actual - Actual duration in milliseconds
 * @returns Formatted error message
 */
export function buildDurationLessThanOrEqualError(
  threshold: number,
  actual: number,
): string {
  return `Expected duration <= ${threshold}ms, got ${actual}ms`;
}

/**
 * Builds an error message for duration greater than assertion failures.
 *
 * @param threshold - Minimum duration threshold in milliseconds
 * @param actual - Actual duration in milliseconds
 * @returns Formatted error message
 */
export function buildDurationGreaterThanError(
  threshold: number,
  actual: number,
): string {
  return `Expected duration > ${threshold}ms, got ${actual}ms`;
}

/**
 * Builds an error message for duration greater than or equal assertion failures.
 *
 * @param threshold - Minimum duration threshold in milliseconds
 * @param actual - Actual duration in milliseconds
 * @returns Formatted error message
 */
export function buildDurationGreaterThanOrEqualError(
  threshold: number,
  actual: number,
): string {
  return `Expected duration >= ${threshold}ms, got ${actual}ms`;
}
