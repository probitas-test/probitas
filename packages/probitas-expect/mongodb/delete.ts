import type { MongoDeleteResult } from "@probitas/client-mongodb";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

/**
 * Fluent API for MongoDB delete result validation.
 */
export interface MongoDeleteResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { MongoDeleteResult } from "@probitas/client-mongodb";
   * import { expectMongoDeleteResult } from "./delete.ts";
   * const result = {
   *   kind: "mongo:delete",
   *   ok: true,
   *   deletedCount: 3,
   *   duration: 0,
   * } as unknown as MongoDeleteResult;
   *
   * expectMongoDeleteResult(result).not.toHaveDeletedCount(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the delete result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the deleted count equals the expected value.
   * @param expected - The expected deleted count
   */
  toHaveDeletedCount(expected: unknown): this;

  /**
   * Asserts that the deleted count equals the expected value using deep equality.
   * @param expected - The expected deleted count
   */
  toHaveDeletedCountEqual(expected: unknown): this;

  /**
   * Asserts that the deleted count strictly equals the expected value.
   * @param expected - The expected deleted count
   */
  toHaveDeletedCountStrictEqual(expected: unknown): this;

  /**
   * Asserts that the deleted count satisfies the provided matcher function.
   * @param matcher - A function that receives the deleted count and performs assertions
   */
  toHaveDeletedCountSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the deleted count is NaN.
   */
  toHaveDeletedCountNaN(): this;

  /**
   * Asserts that the deleted count is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveDeletedCountGreaterThan(expected: number): this;

  /**
   * Asserts that the deleted count is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveDeletedCountGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the deleted count is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveDeletedCountLessThan(expected: number): this;

  /**
   * Asserts that the deleted count is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveDeletedCountLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the deleted count is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveDeletedCountCloseTo(expected: number, numDigits?: number): this;

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

export function expectMongoDeleteResult(
  result: MongoDeleteResult,
): MongoDeleteResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("delete result")),
      // Deleted count
      mixin.createValueMixin(
        () => result.deletedCount,
        negate,
        cfg("deleted count"),
      ),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.deletedCount, "deletedCount"),
        negate,
        cfg("deleted count"),
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
