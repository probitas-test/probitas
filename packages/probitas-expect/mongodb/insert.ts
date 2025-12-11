import { createDurationMethods } from "../common.ts";
import type {
  MongoInsertManyResult,
  MongoInsertOneResult,
} from "@probitas/client-mongodb";

export interface MongoInsertResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectMongoResult(insertResult).not.toHaveInsertedCount(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the insert operation completed successfully.
   *
   * @example
   * ```ts
   * expectMongoResult(insertResult).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the inserted document count matches the expected value.
   *
   * @param count - The expected number of inserted documents
   * @example
   * ```ts
   * expectMongoResult(insertResult).toHaveInsertedCount(3);
   * ```
   */
  toHaveInsertedCount(count: number): this;

  /**
   * Asserts that the inserted document count is greater than the specified threshold.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectMongoResult(insertResult).toHaveInsertedCountGreaterThan(0);
   * ```
   */
  toHaveInsertedCountGreaterThan(count: number): this;

  /**
   * Asserts that the inserted document count is at least the specified minimum.
   *
   * @param count - The minimum expected number of inserted documents
   * @example
   * ```ts
   * expectMongoResult(insertResult).toHaveInsertedCountGreaterThanOrEqual(1);
   * ```
   */
  toHaveInsertedCountGreaterThanOrEqual(count: number): this;

  /**
   * Asserts that the inserted document count is less than the specified threshold.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectMongoResult(insertResult).toHaveInsertedCountLessThan(100);
   * ```
   */
  toHaveInsertedCountLessThan(count: number): this;

  /**
   * Asserts that the inserted document count is at most the specified maximum.
   *
   * @param count - The maximum expected number of inserted documents
   * @example
   * ```ts
   * expectMongoResult(insertResult).toHaveInsertedCountLessThanOrEqual(10);
   * ```
   */
  toHaveInsertedCountLessThanOrEqual(count: number): this;

  /**
   * Asserts that insertedId (for insertOne) or insertedIds (for insertMany) is present.
   *
   * @example
   * ```ts
   * expectMongoResult(insertResult).toHaveInsertedId();
   * ```
   */
  toHaveInsertedId(): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(insertResult).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(insertResult).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(insertResult).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(insertResult).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

export function expectMongoInsertResult(
  result: MongoInsertOneResult | MongoInsertManyResult,
  negate = false,
): MongoInsertResultExpectation {
  const self: MongoInsertResultExpectation = {
    get not(): MongoInsertResultExpectation {
      return expectMongoInsertResult(result, !negate);
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

    toHaveInsertedCount(count: number) {
      const actualCount = "insertedCount" in result ? result.insertedCount : 1;
      const match = actualCount === count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected inserted count to not be ${count}, got ${actualCount}`
            : `Expected ${count} inserted documents, got ${actualCount}`,
        );
      }
      return this;
    },

    toHaveInsertedCountGreaterThan(count: number) {
      const actualCount = "insertedCount" in result ? result.insertedCount : 1;
      const match = actualCount > count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected inserted count to not be > ${count}, got ${actualCount}`
            : `Expected inserted count > ${count}, but got ${actualCount}`,
        );
      }
      return this;
    },

    toHaveInsertedCountGreaterThanOrEqual(count: number) {
      const actualCount = "insertedCount" in result ? result.insertedCount : 1;
      const match = actualCount >= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected inserted count to not be >= ${count}, got ${actualCount}`
            : `Expected inserted count >= ${count}, but got ${actualCount}`,
        );
      }
      return this;
    },

    toHaveInsertedCountLessThan(count: number) {
      const actualCount = "insertedCount" in result ? result.insertedCount : 1;
      const match = actualCount < count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected inserted count to not be < ${count}, got ${actualCount}`
            : `Expected inserted count < ${count}, but got ${actualCount}`,
        );
      }
      return this;
    },

    toHaveInsertedCountLessThanOrEqual(count: number) {
      const actualCount = "insertedCount" in result ? result.insertedCount : 1;
      const match = actualCount <= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected inserted count to not be <= ${count}, got ${actualCount}`
            : `Expected inserted count <= ${count}, but got ${actualCount}`,
        );
      }
      return this;
    },

    toHaveInsertedId() {
      let hasId: boolean;
      if ("insertedId" in result) {
        hasId = !!result.insertedId;
      } else {
        hasId = result.insertedIds.length > 0;
      }
      if (negate ? hasId : !hasId) {
        throw new Error(
          negate
            ? "Expected no insertedId, but insertedId exists"
            : "insertedId" in result
            ? "Expected insertedId, but it is empty"
            : "Expected insertedIds, but array is empty",
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}
