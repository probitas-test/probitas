import type { RedisGetResult } from "@probitas/client-redis";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

/**
 * Fluent API for Redis get result validation.
 *
 * Provides chainable assertions specifically designed for Redis GET operation results.
 */
export interface RedisGetResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { RedisGetResult } from "@probitas/client-redis";
   * import { expectRedisGetResult } from "./get.ts";
   * const result = {
   *   kind: "redis:get",
   *   ok: true,
   *   value: "hello",
   *   duration: 0,
   * } as unknown as RedisGetResult;
   *
   * expectRedisGetResult(result).not.toHaveValue("world");
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
  toHaveValueSatisfying(matcher: (value: string) => void): this;

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
   * Asserts that the value is present (not null or undefined).
   */
  toHaveValuePresent(): this;

  /**
   * Asserts that the value is null.
   */
  toHaveValueNull(): this;

  /**
   * Asserts that the value is undefined.
   */
  toHaveValueUndefined(): this;

  /**
   * Asserts that the value is nullish (null or undefined).
   */
  toHaveValueNullish(): this;

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

export function expectRedisGetResult(
  result: RedisGetResult,
): RedisGetResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("get result")),
      // Value
      mixin.createValueMixin(() => result.value, negate, cfg("value")),
      mixin.createNullishValueMixin(() => result.value, negate, cfg("value")),
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
