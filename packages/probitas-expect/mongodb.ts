import {
  buildCountAtLeastError,
  buildCountAtMostError,
  buildCountError,
  containsSubset,
  createDurationMethods,
} from "./common.ts";
import type {
  MongoCountResult,
  MongoDeleteResult,
  MongoDocs,
  MongoFindOneResult,
  MongoFindResult,
  MongoInsertManyResult,
  MongoInsertOneResult,
  MongoResult,
  MongoUpdateResult,
} from "@probitas/client-mongodb";

/**
 * Fluent API for MongoDB find result validation.
 */
export interface MongoFindResultExpectation<T> {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectMongoResult(findResult).not.toHaveContent();
   * expectMongoResult(findResult).not.toHaveLength(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the find operation completed successfully.
   *
   * @example
   * ```ts
   * expectMongoResult(findResult).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the result contains at least one document.
   *
   * @example
   * ```ts
   * expectMongoResult(findResult).toHaveContent();
   * ```
   */
  toHaveContent(): this;

  /**
   * Asserts that the document count matches the expected value.
   *
   * @param expected - The expected number of documents
   * @example
   * ```ts
   * expectMongoResult(findResult).toHaveLength(5);
   * ```
   */
  toHaveLength(expected: number): this;

  /**
   * Asserts that the document count is at least the specified minimum.
   *
   * @param min - The minimum expected number of documents
   * @example
   * ```ts
   * expectMongoResult(findResult).toHaveLengthGreaterThanOrEqual(3);
   * ```
   */
  toHaveLengthGreaterThanOrEqual(min: number): this;

  /**
   * Asserts that the document count is at most the specified maximum.
   *
   * @param max - The maximum expected number of documents
   * @example
   * ```ts
   * expectMongoResult(findResult).toHaveLengthLessThanOrEqual(10);
   * ```
   */
  toHaveLengthLessThanOrEqual(max: number): this;

  /**
   * Asserts that at least one document in the result contains the given subset of properties.
   *
   * @param subset - An object containing the properties to match
   * @example
   * ```ts
   * expectMongoResult(findResult).toMatchObject({ name: "Alice", age: 30 });
   * ```
   */
  toMatchObject(subset: Partial<T>): this;

  /**
   * Asserts documents using a custom matcher function.
   *
   * @param matcher - A function that receives the array of documents and performs assertions
   * @example
   * ```ts
   * expectMongoResult(findResult).toSatisfy((docs) => {
   *   expect(docs.every((doc) => doc.age >= 18)).toBe(true);
   * });
   * ```
   */
  toSatisfy(matcher: (docs: MongoDocs<T>) => void): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(findResult).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(findResult).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(findResult).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(findResult).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for MongoDB insert result validation.
 */
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

/**
 * Fluent API for MongoDB findOne result validation.
 */
export interface MongoFindOneResultExpectation<T> {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectMongoResult(findOneResult).not.toHaveContent();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the findOne operation completed successfully.
   *
   * @example
   * ```ts
   * expectMongoResult(findOneResult).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that a document was found (not undefined).
   *
   * @example
   * ```ts
   * expectMongoResult(findOneResult).toHaveContent();
   * ```
   */
  toHaveContent(): this;

  /**
   * Asserts that the found document contains the given subset of properties.
   *
   * @param subset - An object containing the properties to match
   * @example
   * ```ts
   * expectMongoResult(findOneResult).toMatchObject({ name: "Alice", age: 30 });
   * ```
   */
  toMatchObject(subset: Partial<T>): this;

  /**
   * Asserts the document using a custom matcher function.
   *
   * @param matcher - A function that receives the document and performs assertions
   * @example
   * ```ts
   * expectMongoResult(findOneResult).toSatisfy((doc) => {
   *   expect(doc.age).toBeGreaterThan(18);
   * });
   * ```
   */
  toSatisfy(matcher: (doc: T) => void): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(findOneResult).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(findOneResult).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(findOneResult).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectMongoResult(findOneResult).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

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

/**
 * Create expectation for MongoDB find result.
 */
function expectMongoFindResult<T>(
  result: MongoFindResult<T>,
  negate = false,
): MongoFindResultExpectation<T> {
  const self: MongoFindResultExpectation<T> = {
    get not(): MongoFindResultExpectation<T> {
      return expectMongoFindResult(result, !negate);
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

    toHaveContent() {
      const hasContent = result.docs.length > 0;
      if (negate ? hasContent : !hasContent) {
        throw new Error(
          negate
            ? `Expected no documents, got ${result.docs.length}`
            : "Expected documents, but got none",
        );
      }
      return this;
    },

    toHaveLength(expected: number) {
      const match = result.docs.length === expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected document count to not be ${expected}, got ${result.docs.length}`
            : buildCountError(expected, result.docs.length, "documents"),
        );
      }
      return this;
    },

    toHaveLengthGreaterThanOrEqual(min: number) {
      const match = result.docs.length >= min;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected document count to not be >= ${min}, got ${result.docs.length}`
            : buildCountAtLeastError(min, result.docs.length, "documents"),
        );
      }
      return this;
    },

    toHaveLengthLessThanOrEqual(max: number) {
      const match = result.docs.length <= max;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected document count to not be <= ${max}, got ${result.docs.length}`
            : buildCountAtMostError(max, result.docs.length, "documents"),
        );
      }
      return this;
    },

    toMatchObject(subset: Partial<T>) {
      const found = result.docs.some((doc) => containsSubset(doc, subset));
      if (negate ? found : !found) {
        throw new Error(
          negate
            ? `Expected no document to contain ${
              JSON.stringify(subset)
            }, but found one`
            : `Expected at least one document to contain ${
              JSON.stringify(subset)
            }`,
        );
      }
      return this;
    },

    toSatisfy(matcher: (docs: MongoDocs<T>) => void) {
      matcher(result.docs);
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create expectation for MongoDB insert result.
 */
function expectMongoInsertResult(
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

/**
 * Create expectation for MongoDB update result.
 */
function expectMongoUpdateResult(
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

/**
 * Create expectation for MongoDB delete result.
 */
function expectMongoDeleteResult(
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

/**
 * Create expectation for MongoDB findOne result.
 */
function expectMongoFindOneResult<T>(
  result: MongoFindOneResult<T>,
  negate = false,
): MongoFindOneResultExpectation<T> {
  const self: MongoFindOneResultExpectation<T> = {
    get not(): MongoFindOneResultExpectation<T> {
      return expectMongoFindOneResult(result, !negate);
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

    toHaveContent() {
      const hasContent = result.doc !== undefined;
      if (negate ? hasContent : !hasContent) {
        throw new Error(
          negate
            ? "Expected document not to be found, but got a document"
            : "Expected document to be found, but got undefined",
        );
      }
      return this;
    },

    toMatchObject(subset: Partial<T>) {
      if (result.doc === undefined) {
        throw new Error(
          "Expected document to contain subset, but doc is undefined",
        );
      }
      const matches = containsSubset(result.doc, subset);
      if (negate ? matches : !matches) {
        throw new Error(
          negate
            ? `Expected document to not contain ${JSON.stringify(subset)}`
            : `Expected document to contain ${JSON.stringify(subset)}`,
        );
      }
      return this;
    },

    toSatisfy(matcher: (doc: T) => void) {
      if (result.doc === undefined) {
        throw new Error("Expected document for matching, but doc is undefined");
      }
      matcher(result.doc);
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create expectation for MongoDB count result.
 */
function expectMongoCountResult(
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

/**
 * Expectation type returned by expectMongoResult based on the result type.
 */
export type MongoExpectation<R extends MongoResult> = R extends
  MongoFindResult<infer T> ? MongoFindResultExpectation<T>
  : R extends MongoInsertOneResult ? MongoInsertResultExpectation
  : R extends MongoInsertManyResult ? MongoInsertResultExpectation
  : R extends MongoUpdateResult ? MongoUpdateResultExpectation
  : R extends MongoDeleteResult ? MongoDeleteResultExpectation
  : R extends MongoFindOneResult<infer T> ? MongoFindOneResultExpectation<T>
  : R extends MongoCountResult ? MongoCountResultExpectation
  : never;

/**
 * Create a fluent expectation chain for any MongoDB result validation.
 *
 * This unified function accepts any MongoDB result type and returns
 * the appropriate expectation interface based on the result's type discriminator.
 *
 * @example
 * ```ts
 * // For find result - returns MongoFindResultExpectation
 * const findResult = await users.find({ age: { $gte: 30 } });
 * expectMongoResult(findResult).toBeSuccessful().toHaveContent().toHaveLength(2);
 *
 * // For insert result - returns MongoInsertResultExpectation
 * const insertResult = await users.insertOne({ name: "Alice", age: 30 });
 * expectMongoResult(insertResult).toBeSuccessful().toHaveInsertedId();
 *
 * // For update result - returns MongoUpdateResultExpectation
 * const updateResult = await users.updateOne({ name: "Alice" }, { $set: { age: 31 } });
 * expectMongoResult(updateResult).toBeSuccessful().toHaveMatchedCount(1).toHaveModifiedCount(1);
 *
 * // For delete result - returns MongoDeleteResultExpectation
 * const deleteResult = await users.deleteOne({ name: "Alice" });
 * expectMongoResult(deleteResult).toBeSuccessful().toHaveDeletedCount(1);
 *
 * // For findOne result - returns MongoFindOneResultExpectation
 * const findOneResult = await users.findOne({ name: "Alice" });
 * expectMongoResult(findOneResult).toBeSuccessful().toHaveContent().toMatchObject({ name: "Alice" });
 *
 * // For count result - returns MongoCountResultExpectation
 * const countResult = await users.countDocuments();
 * expectMongoResult(countResult).toBeSuccessful().toHaveLength(10);
 * ```
 */
// deno-lint-ignore no-explicit-any
export function expectMongoResult<R extends MongoResult<any>>(
  result: R,
): MongoExpectation<R> {
  switch (result.type) {
    case "mongo:find":
      return expectMongoFindResult(
        result as MongoFindResult,
      ) as unknown as MongoExpectation<R>;
    case "mongo:insert":
      return expectMongoInsertResult(
        result as MongoInsertOneResult | MongoInsertManyResult,
      ) as unknown as MongoExpectation<R>;
    case "mongo:update":
      return expectMongoUpdateResult(
        result as MongoUpdateResult,
      ) as unknown as MongoExpectation<R>;
    case "mongo:delete":
      return expectMongoDeleteResult(
        result as MongoDeleteResult,
      ) as unknown as MongoExpectation<R>;
    case "mongo:find-one":
      return expectMongoFindOneResult(
        result as MongoFindOneResult,
      ) as unknown as MongoExpectation<R>;
    case "mongo:count":
      return expectMongoCountResult(
        result as MongoCountResult,
      ) as unknown as MongoExpectation<R>;
    default:
      throw new Error(
        `Unknown MongoDB result type: ${(result as { type: string }).type}`,
      );
  }
}
