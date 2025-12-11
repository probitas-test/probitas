import { createDurationMethods } from "../common.ts";
import type { MongoUpdateResult } from "@probitas/client-mongodb";

/**
 * Fluent API for MongoDB update result validation.
 */
export interface MongoUpdateResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectMongoResult(updateResult).not.toHaveMatchedCount(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the update operation completed successfully.
   *
   * @example
   * ```ts
   * expectMongoResult(updateResult).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the number of matched documents equals the expected value.
   *
   * @param count - The expected number of matched documents
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveMatchedCount(1);
   * ```
   */
  toHaveMatchedCount(count: number): this;

  /**
   * Asserts that the number of matched documents is greater than the specified threshold.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveMatchedCountGreaterThan(0);
   * ```
   */
  toHaveMatchedCountGreaterThan(count: number): this;

  /**
   * Asserts that the number of matched documents is at least the specified minimum.
   *
   * @param count - The minimum expected number of matched documents
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveMatchedCountGreaterThanOrEqual(1);
   * ```
   */
  toHaveMatchedCountGreaterThanOrEqual(count: number): this;

  /**
   * Asserts that the number of matched documents is less than the specified threshold.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveMatchedCountLessThan(100);
   * ```
   */
  toHaveMatchedCountLessThan(count: number): this;

  /**
   * Asserts that the number of matched documents is at most the specified maximum.
   *
   * @param count - The maximum expected number of matched documents
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveMatchedCountLessThanOrEqual(10);
   * ```
   */
  toHaveMatchedCountLessThanOrEqual(count: number): this;

  /**
   * Asserts that the number of modified documents equals the expected value.
   *
   * @param count - The expected number of modified documents
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveModifiedCount(1);
   * ```
   */
  toHaveModifiedCount(count: number): this;

  /**
   * Asserts that the number of modified documents is greater than the specified threshold.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveModifiedCountGreaterThan(0);
   * ```
   */
  toHaveModifiedCountGreaterThan(count: number): this;

  /**
   * Asserts that the number of modified documents is at least the specified minimum.
   *
   * @param count - The minimum expected number of modified documents
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveModifiedCountGreaterThanOrEqual(1);
   * ```
   */
  toHaveModifiedCountGreaterThanOrEqual(count: number): this;

  /**
   * Asserts that the number of modified documents is less than the specified threshold.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveModifiedCountLessThan(100);
   * ```
   */
  toHaveModifiedCountLessThan(count: number): this;

  /**
   * Asserts that the number of modified documents is at most the specified maximum.
   *
   * @param count - The maximum expected number of modified documents
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveModifiedCountLessThanOrEqual(10);
   * ```
   */
  toHaveModifiedCountLessThanOrEqual(count: number): this;

  /**
   * Asserts that an upsertedId is present (document was upserted).
   *
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveUpsertedId();
   * ```
   */
  toHaveUpsertedId(): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(updateResult).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

export function expectMongoUpdateResult(
  result: MongoUpdateResult,
  negate = false,
): MongoUpdateResultExpectation {
  const self: MongoUpdateResultExpectation = {
    get not(): MongoUpdateResultExpectation {
      return expectMongoUpdateResult(result, !negate);
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

    toHaveMatchedCount(count: number) {
      const match = result.matchedCount === count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected matched count to not be ${count}, got ${result.matchedCount}`
            : `Expected ${count} matched documents, got ${result.matchedCount}`,
        );
      }
      return this;
    },

    toHaveMatchedCountGreaterThan(count: number) {
      const match = result.matchedCount > count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected matched count to not be > ${count}, got ${result.matchedCount}`
            : `Expected matched count > ${count}, but got ${result.matchedCount}`,
        );
      }
      return this;
    },

    toHaveMatchedCountGreaterThanOrEqual(count: number) {
      const match = result.matchedCount >= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected matched count to not be >= ${count}, got ${result.matchedCount}`
            : `Expected matched count >= ${count}, but got ${result.matchedCount}`,
        );
      }
      return this;
    },

    toHaveMatchedCountLessThan(count: number) {
      const match = result.matchedCount < count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected matched count to not be < ${count}, got ${result.matchedCount}`
            : `Expected matched count < ${count}, but got ${result.matchedCount}`,
        );
      }
      return this;
    },

    toHaveMatchedCountLessThanOrEqual(count: number) {
      const match = result.matchedCount <= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected matched count to not be <= ${count}, got ${result.matchedCount}`
            : `Expected matched count <= ${count}, but got ${result.matchedCount}`,
        );
      }
      return this;
    },

    toHaveModifiedCount(count: number) {
      const match = result.modifiedCount === count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected modified count to not be ${count}, got ${result.modifiedCount}`
            : `Expected ${count} modified documents, got ${result.modifiedCount}`,
        );
      }
      return this;
    },

    toHaveModifiedCountGreaterThan(count: number) {
      const match = result.modifiedCount > count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected modified count to not be > ${count}, got ${result.modifiedCount}`
            : `Expected modified count > ${count}, but got ${result.modifiedCount}`,
        );
      }
      return this;
    },

    toHaveModifiedCountGreaterThanOrEqual(count: number) {
      const match = result.modifiedCount >= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected modified count to not be >= ${count}, got ${result.modifiedCount}`
            : `Expected modified count >= ${count}, but got ${result.modifiedCount}`,
        );
      }
      return this;
    },

    toHaveModifiedCountLessThan(count: number) {
      const match = result.modifiedCount < count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected modified count to not be < ${count}, got ${result.modifiedCount}`
            : `Expected modified count < ${count}, but got ${result.modifiedCount}`,
        );
      }
      return this;
    },

    toHaveModifiedCountLessThanOrEqual(count: number) {
      const match = result.modifiedCount <= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected modified count to not be <= ${count}, got ${result.modifiedCount}`
            : `Expected modified count <= ${count}, but got ${result.modifiedCount}`,
        );
      }
      return this;
    },

    toHaveUpsertedId() {
      const hasId = !!result.upsertedId;
      if (negate ? hasId : !hasId) {
        throw new Error(
          negate
            ? "Expected no upsertedId, but upsertedId exists"
            : "Expected upsertedId, but no document was upserted",
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}
