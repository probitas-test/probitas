/**
 * Alter the error of a function if an error is thrown.
 *
 * @param fn - The function to execute.
 * @param alt - The value to throw if an error is thrown.
 * @returns The result of the function.
 * @throws The value of alt.
 * @example
 *
 * ```ts
 * import { assertThrows } from "@std/assert";
 * import { alter } from "@core/errorutil/alter";
 *
 * console.log(alter(() => 1, "err2")); // 1
 * assertThrows(() => alter(() => { throw "err1" }, "err2"), "err2"); // "err2" is thrown
 * ```
 */
export function alter<T, E>(fn: () => T, alt: E): T {
  try {
    return fn();
  } catch {
    throw alt;
  }
}
