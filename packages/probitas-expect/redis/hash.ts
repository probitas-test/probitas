import type { RedisHashResult } from "@probitas/client-redis";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

/**
 * Fluent API for Redis hash result validation.
 *
 * Provides chainable assertions specifically designed for hash-based results
 * (e.g., HGETALL, HMGET operations).
 */
export interface RedisHashResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { RedisHashResult } from "@probitas/client-redis";
   * import { expectRedisHashResult } from "./hash.ts";
   * const result = {
   *   kind: "redis:hash",
   *   ok: true,
   *   value: { name: "Alice" },
   *   duration: 0,
   * } as unknown as RedisHashResult;
   *
   * expectRedisHashResult(result).not.toHaveValueProperty("age");
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
  // deno-lint-ignore no-explicit-any
  toHaveValueSatisfying(matcher: (value: any) => void): this;

  /**
   * Asserts that the value matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveValueMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the value has the specified property.
   * @param keyPath - The key path to check
   * @param value - Optional expected value at the key path
   */
  toHaveValueProperty(keyPath: string | string[], value?: unknown): this;

  /**
   * Asserts that the value property contains the expected value.
   * @param keyPath - The key path to check
   * @param expected - The expected contained value
   */
  toHaveValuePropertyContaining(
    keyPath: string | string[],
    expected: unknown,
  ): this;

  /**
   * Asserts that the value property matches the specified subset.
   * @param keyPath - The key path to check
   * @param subset - The subset to match against
   */
  toHaveValuePropertyMatching(
    keyPath: string | string[],
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the value property satisfies the provided matcher function.
   * @param keyPath - The key path to check
   * @param matcher - A function that receives the property value and performs assertions
   */
  toHaveValuePropertySatisfying(
    keyPath: string | string[],
    // deno-lint-ignore no-explicit-any
    matcher: (value: any) => void,
  ): this;

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

export function expectRedisHashResult(
  result: RedisHashResult,
): RedisHashResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("hash result")),
      // Value
      mixin.createValueMixin(() => result.value, negate, cfg("value")),
      mixin.createObjectValueMixin(
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
