/**
 * Try to execute a function and return the result or execute another function and return its result if an error occurs.
 *
 * ```ts
 * import { tryOrElse } from "@core/errorutil/try-or-else";
 *
 * console.log(tryOrElse(() => 1, () => 2)); // 1
 * console.log(tryOrElse(() => { throw "err" }, () => 2)); // 2
 * ```
 */
export function tryOrElse<T>(fn: () => T, elseFn: (err: unknown) => T): T {
  try {
    return fn();
  } catch (err) {
    return elseFn(err);
  }
}
