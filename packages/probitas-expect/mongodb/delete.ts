import { createDurationMethods } from "../common.ts";
import type { MongoDeleteResult } from "@probitas/client-mongodb";

/**
 * Fluent API for MongoDB delete result validation.
 */
export interface MongoDeleteResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectMongoResult(deleteResult).not.toHaveDeletedCount(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the delete operation completed successfully.
   *
   * @example
   * ```ts
   * expectMongoResult(deleteResult).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the number of deleted documents equals the expected value.
   *
   * @param count - The expected number of deleted documents
   * @example
   * ```ts
   * expectMongoResult(deleteResult).toHaveDeletedCount(1);
   * ```
   */
  toHaveDeletedCount(count: number): this;

  /**
   * Asserts that the number of deleted documents is greater than the specified threshold.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectMongoResult(deleteResult).toHaveDeletedCountGreaterThan(0);
   * ```
   */
  toHaveDeletedCountGreaterThan(count: number): this;

  /**
   * Asserts that the number of deleted documents is at least the specified minimum.
   *
   * @param count - The minimum expected number of deleted documents
   * @example
   * ```ts
   * expectMongoResult(deleteResult).toHaveDeletedCountGreaterThanOrEqual(1);
   * ```
   */
  toHaveDeletedCountGreaterThanOrEqual(count: number): this;

  /**
   * Asserts that the number of deleted documents is less than the specified threshold.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectMongoResult(deleteResult).toHaveDeletedCountLessThan(100);
   * ```
   */
  toHaveDeletedCountLessThan(count: number): this;

  /**
   * Asserts that the number of deleted documents is at most the specified maximum.
   *
   * @param count - The maximum expected number of deleted documents
   * @example
   * ```ts
   * expectMongoResult(deleteResult).toHaveDeletedCountLessThanOrEqual(10);
   * ```
   */
  toHaveDeletedCountLessThanOrEqual(count: number): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(deleteResult).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(deleteResult).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(deleteResult).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(deleteResult).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

export function expectMongoDeleteResult(
  result: MongoDeleteResult,
  negate = false,
): MongoDeleteResultExpectation {
  const self: MongoDeleteResultExpectation = {
    get not(): MongoDeleteResultExpectation {
      return expectMongoDeleteResult(result, !negate);
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

    toHaveDeletedCount(count: number) {
      const match = result.deletedCount === count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected deleted count to not be ${count}, got ${result.deletedCount}`
            : `Expected ${count} deleted documents, got ${result.deletedCount}`,
        );
      }
      return this;
    },

    toHaveDeletedCountGreaterThan(count: number) {
      const match = result.deletedCount > count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected deleted count to not be > ${count}, got ${result.deletedCount}`
            : `Expected deleted count > ${count}, but got ${result.deletedCount}`,
        );
      }
      return this;
    },

    toHaveDeletedCountGreaterThanOrEqual(count: number) {
      const match = result.deletedCount >= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected deleted count to not be >= ${count}, got ${result.deletedCount}`
            : `Expected deleted count >= ${count}, but got ${result.deletedCount}`,
        );
      }
      return this;
    },

    toHaveDeletedCountLessThan(count: number) {
      const match = result.deletedCount < count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected deleted count to not be < ${count}, got ${result.deletedCount}`
            : `Expected deleted count < ${count}, but got ${result.deletedCount}`,
        );
      }
      return this;
    },

    toHaveDeletedCountLessThanOrEqual(count: number) {
      const match = result.deletedCount <= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected deleted count to not be <= ${count}, got ${result.deletedCount}`
            : `Expected deleted count <= ${count}, but got ${result.deletedCount}`,
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}
