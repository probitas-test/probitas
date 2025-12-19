import type { MongoInsertManyResult } from "@probitas/client-mongodb";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

/**
 * Fluent API for MongoDB insertMany result validation.
 */
export interface MongoInsertManyResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { MongoInsertManyResult } from "@probitas/client-mongodb";
   * import { expectMongoInsertManyResult } from "./insert_many.ts";
   * const result = {
   *   kind: "mongo:insert-many",
   *   ok: true,
   *   insertedIds: ["1", "2", "3"],
   *   insertedCount: 3,
   *   duration: 0,
   * } as unknown as MongoInsertManyResult;
   *
   * expectMongoInsertManyResult(result).not.toHaveInsertedCount(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the insert result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the inserted IDs equal the expected value.
   * @param expected - The expected inserted IDs
   */
  toHaveInsertedIds(expected: unknown): this;

  /**
   * Asserts that the inserted IDs equal the expected value using deep equality.
   * @param expected - The expected inserted IDs
   */
  toHaveInsertedIdsEqual(expected: unknown): this;

  /**
   * Asserts that the inserted IDs strictly equal the expected value.
   * @param expected - The expected inserted IDs
   */
  toHaveInsertedIdsStrictEqual(expected: unknown): this;

  /**
   * Asserts that the inserted IDs satisfy the provided matcher function.
   * @param matcher - A function that receives the inserted IDs and performs assertions
   */
  toHaveInsertedIdsSatisfying(matcher: (value: string[]) => void): this;

  /**
   * Asserts that the inserted IDs array contains the specified item.
   * @param item - The item to search for
   */
  toHaveInsertedIdsContaining(item: unknown): this;

  /**
   * Asserts that the inserted IDs array contains an item equal to the specified value.
   * @param item - The item to search for using deep equality
   */
  toHaveInsertedIdsContainingEqual(item: unknown): this;

  /**
   * Asserts that the inserted IDs array matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveInsertedIdsMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the inserted IDs array is empty.
   */
  toHaveInsertedIdsEmpty(): this;

  /**
   * Asserts that the inserted count equals the expected value.
   * @param expected - The expected inserted count
   */
  toHaveInsertedCount(expected: unknown): this;

  /**
   * Asserts that the inserted count equals the expected value using deep equality.
   * @param expected - The expected inserted count
   */
  toHaveInsertedCountEqual(expected: unknown): this;

  /**
   * Asserts that the inserted count strictly equals the expected value.
   * @param expected - The expected inserted count
   */
  toHaveInsertedCountStrictEqual(expected: unknown): this;

  /**
   * Asserts that the inserted count satisfies the provided matcher function.
   * @param matcher - A function that receives the inserted count and performs assertions
   */
  toHaveInsertedCountSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the inserted count is NaN.
   */
  toHaveInsertedCountNaN(): this;

  /**
   * Asserts that the inserted count is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveInsertedCountGreaterThan(expected: number): this;

  /**
   * Asserts that the inserted count is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveInsertedCountGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the inserted count is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveInsertedCountLessThan(expected: number): this;

  /**
   * Asserts that the inserted count is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveInsertedCountLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the inserted count is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveInsertedCountCloseTo(expected: number, numDigits?: number): this;

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

export function expectMongoInsertManyResult(
  result: MongoInsertManyResult,
): MongoInsertManyResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("insert result")),
      // Inserted ids
      mixin.createValueMixin(
        () => result.insertedIds,
        negate,
        cfg("inserted ids"),
      ),
      mixin.createArrayValueMixin(
        () => ensureNonNullish(result.insertedIds, "insertedIds"),
        negate,
        cfg("inserted ids"),
      ),
      // Inserted count
      mixin.createValueMixin(
        () => result.insertedCount,
        negate,
        cfg("inserted count"),
      ),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.insertedCount, "insertedCount"),
        negate,
        cfg("inserted count"),
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
