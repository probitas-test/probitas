import type { RedisArrayResult } from "@probitas/client-redis";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

type RedisArrayValue = RedisArrayResult<unknown>["value"];

/**
 * Fluent API for Redis array result validation.
 *
 * Provides chainable assertions specifically designed for array-based results
 * (e.g., LRANGE, SMEMBERS, KEYS operations).
 */
export interface RedisArrayResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { RedisArrayResult } from "@probitas/client-redis";
   * import { expectRedisArrayResult } from "./array.ts";
   * const result = {
   *   kind: "redis:array",
   *   ok: true,
   *   value: ["a", "b"],
   *   duration: 0,
   * } as unknown as RedisArrayResult<string>;
   *
   * expectRedisArrayResult(result).not.toHaveValueEmpty();
   * expectRedisArrayResult(result).not.toHaveValueContaining("x");
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
  toHaveValueSatisfying(matcher: (value: RedisArrayValue) => void): this;

  /**
   * Asserts that the value array contains the specified item.
   * @param item - The item to search for
   */
  toHaveValueContaining(item: unknown): this;

  /**
   * Asserts that the value array contains an item equal to the specified value.
   * @param item - The item to search for using deep equality
   */
  toHaveValueContainingEqual(item: unknown): this;

  /**
   * Asserts that the value array matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveValueMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the value array is empty.
   */
  toHaveValueEmpty(): this;

  /**
   * Asserts that the value count equals the expected value.
   * @param expected - The expected value count
   */
  toHaveValueCount(expected: unknown): this;

  /**
   * Asserts that the value count equals the expected value using deep equality.
   * @param expected - The expected value count
   */
  toHaveValueCountEqual(expected: unknown): this;

  /**
   * Asserts that the value count strictly equals the expected value.
   * @param expected - The expected value count
   */
  toHaveValueCountStrictEqual(expected: unknown): this;

  /**
   * Asserts that the value count satisfies the provided matcher function.
   * @param matcher - A function that receives the value count and performs assertions
   */
  toHaveValueCountSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the value count is NaN.
   */
  toHaveValueCountNaN(): this;

  /**
   * Asserts that the value count is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveValueCountGreaterThan(expected: number): this;

  /**
   * Asserts that the value count is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveValueCountGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the value count is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveValueCountLessThan(expected: number): this;

  /**
   * Asserts that the value count is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveValueCountLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the value count is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveValueCountCloseTo(expected: number, numDigits?: number): this;

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

export function expectRedisArrayResult<T>(
  result: RedisArrayResult<T>,
): RedisArrayResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("array result")),
      // Value
      mixin.createValueMixin(() => result.value, negate, cfg("value")),
      mixin.createArrayValueMixin(
        () => ensureNonNullish(result.value, "value"),
        negate,
        cfg("value"),
      ),
      // Value count
      mixin.createValueMixin(
        () => ensureNonNullish(result.value, "value").length,
        negate,
        cfg("value count"),
      ),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.value, "value").length,
        negate,
        cfg("value count"),
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
