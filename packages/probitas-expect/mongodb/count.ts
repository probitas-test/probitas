import {
  buildCountAtLeastError,
  buildCountAtMostError,
  buildCountError,
  createDurationMethods,
} from "../common.ts";
import type { MongoCountResult } from "@probitas/client-mongodb";

/**
 * Fluent API for MongoDB count result validation.
 */
export interface MongoCountResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectMongoResult(countResult).not.toHaveLength(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the count operation completed successfully.
   *
   * @example
   * ```ts
   * expectMongoResult(countResult).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the document count equals the expected value.
   *
   * @param expected - The expected document count
   * @example
   * ```ts
   * expectMongoResult(countResult).toHaveLength(10);
   * ```
   */
  toHaveLength(expected: number): this;

  /**
   * Asserts that the document count is at least the specified minimum.
   *
   * @param min - The minimum expected document count
   * @example
   * ```ts
   * expectMongoResult(countResult).toHaveLengthGreaterThanOrEqual(5);
   * ```
   */
  toHaveLengthGreaterThanOrEqual(min: number): this;

  /**
   * Asserts that the document count is at most the specified maximum.
   *
   * @param max - The maximum expected document count
   * @example
   * ```ts
   * expectMongoResult(countResult).toHaveLengthLessThanOrEqual(100);
   * ```
   */
  toHaveLengthLessThanOrEqual(max: number): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(countResult).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(countResult).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(countResult).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(countResult).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

export function expectMongoCountResult(
  result: MongoCountResult,
  negate = false,
): MongoCountResultExpectation {
  const self: MongoCountResultExpectation = {
    get not(): MongoCountResultExpectation {
      return expectMongoCountResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? "Expected not ok result, but ok is true"
            : "Expected ok result, but ok is false",
        );
      }
      return this;
    },

    toHaveLength(expected: number) {
      const match = result.count === expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected count to not be ${expected}, got ${result.count}`
            : buildCountError(expected, result.count, "count"),
        );
      }
      return this;
    },

    toHaveLengthGreaterThanOrEqual(min: number) {
      const match = result.count >= min;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected count to not be >= ${min}, got ${result.count}`
            : buildCountAtLeastError(min, result.count, "count"),
        );
      }
      return this;
    },

    toHaveLengthLessThanOrEqual(max: number) {
      const match = result.count <= max;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected count to not be <= ${max}, got ${result.count}`
            : buildCountAtMostError(max, result.count, "count"),
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}
