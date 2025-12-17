/**
 * Error catching utility for testing.
 *
 * This module provides a utility function to catch errors thrown by a function
 * for use in snapshot testing and error message verification.
 *
 * @module
 */

import { tryOrElse } from "@core/errorutil/try-or-else";

/**
 * Catches an error thrown by a function and returns it as an Error object.
 *
 * If the function does not throw, throws an error.
 * If the thrown value is not an Error, wraps it in an Error.
 *
 * @param fn - Function that should throw an error
 * @returns The caught Error object
 * @throws If the function does not throw
 *
 * @example
 * ```ts
 * import { catchError } from "./catch_error.ts";
 *
 * const error = catchError(() => {
 *   throw new Error("test error");
 * });
 *
 * console.log(error.message); // "test error"
 * ```
 *
 * @example For assertion testing
 * ```ts
 * import { catchError } from "./catch_error.ts";
 * import { assertEquals } from "@std/assert";
 *
 * const error = catchError(() => {
 *   throw new Error("Expected status 200, got 404");
 * });
 * assertEquals(error.message, "Expected status 200, got 404");
 * ```
 */
export function catchError(fn: () => unknown): Error {
  const err = tryOrElse(() => void fn(), (err) => err);

  if (err === undefined) {
    throw new Error(
      "Expected function to throw an error, but it did not throw",
    );
  }

  return err instanceof Error ? err : new Error(String(err));
}
