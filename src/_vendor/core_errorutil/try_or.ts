/**
 * Try to execute a function and return the result or a default value if an error occurs.
 *
 * ```ts
 * import { tryOr } from "@core/errorutil/try-or";
 *
 * console.log(tryOr(() => 1, 2)); // 1
 * console.log(tryOr(() => { throw "err"; }, 2)); // 2
 * ```
 */
export function tryOr<T>(fn: () => T, orValue: T): T {
  try {
    return fn();
  } catch {
    return orValue;
  }
}
