/**
 * Alter the error of a function if an error is thrown.
 *
 * @param fn - The function to execute.
 * @param modifier - The function to execute if an error is thrown.
 * @returns The result of the function.
 * @throws The result of the modifier function.
 * @example
 *
 * ```ts
 * import { assertThrows } from "@std/assert";
 * import { alterElse } from "@core/errorutil/alter-else";
 *
 * console.log(alterElse(() => 1, () => "err")); // 1
 * assertThrows(() => alterElse(() => { throw "err" }, (err) => "new " + err), "new err"); // "new err" is thrown
 * ```
 */
export function alterElse<T, E>(fn: () => T, elseFn: (err: unknown) => E): T {
  try {
    return fn();
  } catch (err) {
    throw elseFn(err);
  }
}
