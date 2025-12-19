import type { RedisCountResult } from "@probitas/client-redis";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

/**
 * Fluent API for Redis count result validation.
 *
 * Provides chainable assertions specifically designed for count-based results
 * (e.g., DEL, LPUSH, SCARD operations).
 */
export interface RedisCountResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { RedisCountResult } from "@probitas/client-redis";
   * import { expectRedisCountResult } from "./count.ts";
   * const result = {
   *   kind: "redis:count",
   *   ok: true,
   *   value: 5,
   *   duration: 0,
   * } as unknown as RedisCountResult;
   *
   * expectRedisCountResult(result).not.toHaveValue(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the value equals the expected value.
   * @param expected - The expected value
   */
  toHaveValue(expected: unknown): this;

  /**
   * Asserts that the value equals the expected value using deep equality.
   * @param expected - The expected value
   */
  toHaveValueEqual(expected: unknown): this;

  /**
   * Asserts that the value strictly equals the expected value.
   * @param expected - The expected value
   */
  toHaveValueStrictEqual(expected: unknown): this;

  /**
   * Asserts that the value satisfies the provided matcher function.
   * @param matcher - A function that receives the value and performs assertions
   */
  toHaveValueSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the value is NaN.
   */
  toHaveValueNaN(): this;

  /**
   * Asserts that the value is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveValueGreaterThan(expected: number): this;

  /**
   * Asserts that the value is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveValueGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the value is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveValueLessThan(expected: number): this;

  /**
   * Asserts that the value is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveValueLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the value is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveValueCloseTo(expected: number, numDigits?: number): this;

  /**
   * Asserts that the duration equals the expected value.
   * @param expected - The expected duration value
   */
  toHaveDuration(expected: unknown): this;

  /**
   * Asserts that the duration equals the expected value using deep equality.
   * @param expected - The expected duration value
   */
  toHaveDurationEqual(expected: unknown): this;

  /**
   * Asserts that the duration strictly equals the expected value.
   * @param expected - The expected duration value
   */
  toHaveDurationStrictEqual(expected: unknown): this;

  /**
   * Asserts that the duration satisfies the provided matcher function.
   * @param matcher - A function that receives the duration and performs assertions
   */
  toHaveDurationSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the duration is NaN.
   */
  toHaveDurationNaN(): this;

  /**
   * Asserts that the duration is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveDurationGreaterThan(expected: number): this;

  /**
   * Asserts that the duration is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveDurationGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the duration is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveDurationLessThan(expected: number): this;

  /**
   * Asserts that the duration is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveDurationLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the duration is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveDurationCloseTo(expected: number, numDigits?: number): this;
}

export function expectRedisCountResult(
  result: RedisCountResult,
): RedisCountResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("count result")),
      // Value
      mixin.createValueMixin(() => result.value, negate, cfg("value")),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.value, "value"),
        negate,
        cfg("value"),
      ),
      // Duration
      mixin.createValueMixin(() => result.duration, negate, cfg("duration")),
      mixin.createNumberValueMixin(
        () => result.duration,
        negate,
        cfg("duration"),
      ),
    ] as const;
  });
}
