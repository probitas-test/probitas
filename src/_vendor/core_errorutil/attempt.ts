export type Success<T> = [error: undefined, value: T];
export type Failure<E> = [error: E, value: undefined];
export type Result<T, E> = Success<T> | Failure<E>;

/**
 * Attempt to execute a function and return a Result<T, E>.
 *
 * @param fn - The function to execute.
 * @returns A Result<T, E> where T is the return type of the function and E is the error type.
 *
 * @example
 * ```ts
 * import { attempt } from "@core/errorutil/attempt";
 *
 * console.log(attempt(() => 1)); // [undefined, 1]
 * console.log(attempt(() => { throw "err" })); // ["err", undefined]
 * ```
 */
export function attempt<T, E = unknown>(fn: () => T): Result<T, E> {
  try {
    return [undefined, fn()];
  } catch (e) {
    return [e as E, undefined];
  }
}
