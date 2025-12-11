import { createDurationMethods } from "../common.ts";
import type { DenoKvAtomicResult } from "@probitas/client-deno-kv";

/**
 * Fluent API for validating DenoKvAtomicResult.
 *
 * Provides chainable assertions specifically designed for Deno KV atomic operation results.
 * All assertion methods return `this` to enable method chaining.
 */
export interface DenoKvAtomicResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).not.toBeSuccessful();
   * expectDenoKvResult(result).not.toHaveVersionstamp();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the atomic operation succeeded.
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the result has a versionstamp (only present on successful atomic commits).
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveVersionstamp();
   * ```
   */
  toHaveVersionstamp(): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds (exclusive)
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds (exclusive)
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveDurationGreaterThan(10);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveDurationGreaterThanOrEqual(10);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Create expectation for Deno KV atomic result.
 */
export function expectDenoKvAtomicResult(
  result: DenoKvAtomicResult,
  negate = false,
): DenoKvAtomicResultExpectation {
  const self: DenoKvAtomicResultExpectation = {
    get not(): DenoKvAtomicResultExpectation {
      return expectDenoKvAtomicResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate ? "Expected not ok result" : "Expected ok result",
        );
      }
      return this;
    },

    toHaveVersionstamp() {
      const hasStamp = !!result.versionstamp;
      if (negate ? hasStamp : !hasStamp) {
        throw new Error(
          negate
            ? "Expected no versionstamp, but it exists"
            : "Expected versionstamp, but it is missing or empty",
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}
