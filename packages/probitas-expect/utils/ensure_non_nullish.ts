/**
 * Utility to ensure values are non-nullish.
 *
 * This module provides the ensureNonNullish function for asserting
 * that values are not null or undefined.
 *
 * @module
 */

/**
 * Ensures a value is non-nullish (not null or undefined) or throws an error.
 *
 * @param value - Value to check
 * @param valueName - Name of the value (for error messages)
 * @returns The value if not null/undefined
 * @throws Error if value is null or undefined
 */
export function ensureNonNullish<T>(
  value: T,
  valueName: string,
): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${valueName} to exist, but got ${value}`);
  }
  return value;
}
