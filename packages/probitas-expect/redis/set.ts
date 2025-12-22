import type { RedisSetResult } from "@probitas/client-redis";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

type RedisSetValue = RedisSetResult["value"];

/**
 * Fluent API for Redis set result validation.
 *
 * Provides chainable assertions specifically designed for Redis SET operation results.
 */
export interface RedisSetResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { RedisSetResult } from "@probitas/client-redis";
   * import { expectRedisSetResult } from "./set.ts";
   * const result = {
   *   kind: "redis:set",
   *   ok: true,
   *   value: "OK",
   *   duration: 0,
   * } as unknown as RedisSetResult;
   *
   * expectRedisSetResult(result).not.toHaveValue("ERROR");
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
  toHaveValueSatisfying(matcher: (value: RedisSetValue) => void): this;

  /**
   * Asserts that the value contains the specified substring.
   * @param substr - The substring to search for
   */
  toHaveValueContaining(substr: string): this;

  /**
   * Asserts that the value matches the specified regular expression.
   * @param expected - The regular expression to match against
   */
  toHaveValueMatching(expected: RegExp): this;

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

export function expectRedisSetResult(
  result: RedisSetResult,
): RedisSetResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("set result")),
      // Value
      mixin.createValueMixin(() => result.value, negate, cfg("value")),
      mixin.createStringValueMixin(
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
