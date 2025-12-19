import type { MongoCountResult } from "@probitas/client-mongodb";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

/**
 * Fluent API for MongoDB count result validation.
 */
export interface MongoCountResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { MongoCountResult } from "@probitas/client-mongodb";
   * import { expectMongoCountResult } from "./count.ts";
   * const result = {
   *   kind: "mongo:count",
   *   ok: true,
   *   count: 5,
   *   duration: 0,
   * } as unknown as MongoCountResult;
   *
   * expectMongoCountResult(result).not.toHaveCount(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the count result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the count equals the expected value.
   * @param expected - The expected count
   */
  toHaveCount(expected: unknown): this;

  /**
   * Asserts that the count equals the expected value using deep equality.
   * @param expected - The expected count
   */
  toHaveCountEqual(expected: unknown): this;

  /**
   * Asserts that the count strictly equals the expected value.
   * @param expected - The expected count
   */
  toHaveCountStrictEqual(expected: unknown): this;

  /**
   * Asserts that the count satisfies the provided matcher function.
   * @param matcher - A function that receives the count and performs assertions
   */
  toHaveCountSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the count is NaN.
   */
  toHaveCountNaN(): this;

  /**
   * Asserts that the count is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveCountGreaterThan(expected: number): this;

  /**
   * Asserts that the count is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveCountGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the count is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveCountLessThan(expected: number): this;

  /**
   * Asserts that the count is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveCountLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the count is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveCountCloseTo(expected: number, numDigits?: number): this;

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

export function expectMongoCountResult(
  result: MongoCountResult,
): MongoCountResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("count result")),
      // Count
      mixin.createValueMixin(() => result.count, negate, cfg("count")),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.count, "count"),
        negate,
        cfg("count"),
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
