/**
 * Try-ok utility for converting exceptions to boolean results.
 *
 * This module provides a utility function to execute a function and return
 * true if it succeeds (no exception), or false if it throws.
 *
 * @module
 */

/**
 * Executes a function and returns true if it succeeds, false if it throws.
 *
 * This is useful for converting assertion-based checks (that throw on failure)
 * into boolean results.
 *
 * @param fn - Function to execute
 * @returns true if fn executes without throwing, false if it throws
 *
 * @example
 * ```ts
 * import { tryOk } from "./try_ok.ts";
 * import { expect } from "@std/expect";
 *
 * const value = 42;
 * const expected = 42;
 * const ok = tryOk(() => expect(value).toEqual(expected));
 * if (!ok) {
 *   throw new Error("Values are not equal");
 * }
 * ```
 */
export function tryOk(fn: () => void): boolean {
  try {
    fn();
    return true;
  } catch {
    return false;
  }
}
