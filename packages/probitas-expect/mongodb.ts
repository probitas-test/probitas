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
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation completed successfully */
  toBeSuccessful(): this;

  /** Assert that result contains at least one document */
  toHaveContent(): this;

  /** Assert that document count matches expected value */
  toHaveLength(expected: number): this;

  /** Assert that document count is at least the minimum */
  toHaveLengthGreaterThanOrEqual(min: number): this;

  /** Assert that document count is at most the maximum */
  toHaveLengthLessThanOrEqual(max: number): this;

  /** Assert that at least one document contains the given subset */
  toMatchObject(subset: Partial<T>): this;

  /** Assert documents using custom matcher function */
  toSatisfy(matcher: (docs: MongoDocs<T>) => void): this;

  /** Assert that operation duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that operation duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that operation duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that operation duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for MongoDB insert result validation.
 */
export interface MongoInsertResultExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation completed successfully */
  toBeSuccessful(): this;

  /** Assert that inserted count matches expected value */
  toHaveInsertedCount(count: number): this;

  /** Assert that inserted count is greater than threshold */
  toHaveInsertedCountGreaterThan(count: number): this;

  /** Assert that inserted count is at least the minimum */
  toHaveInsertedCountGreaterThanOrEqual(count: number): this;

  /** Assert that inserted count is less than threshold */
  toHaveInsertedCountLessThan(count: number): this;

  /** Assert that inserted count is at most the maximum */
  toHaveInsertedCountLessThanOrEqual(count: number): this;

  /** Assert that insertedId or insertedIds is present */
  toHaveInsertedId(): this;

  /** Assert that operation duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that operation duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that operation duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that operation duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for MongoDB update result validation.
 */
export interface MongoUpdateResultExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation completed successfully */
  toBeSuccessful(): this;

  /** Assert that matched count matches expected value */
  toHaveMatchedCount(count: number): this;

  /** Assert that matched count is greater than threshold */
  toHaveMatchedCountGreaterThan(count: number): this;

  /** Assert that matched count is at least the minimum */
  toHaveMatchedCountGreaterThanOrEqual(count: number): this;

  /** Assert that matched count is less than threshold */
  toHaveMatchedCountLessThan(count: number): this;

  /** Assert that matched count is at most the maximum */
  toHaveMatchedCountLessThanOrEqual(count: number): this;

  /** Assert that modified count matches expected value */
  toHaveModifiedCount(count: number): this;

  /** Assert that modified count is greater than threshold */
  toHaveModifiedCountGreaterThan(count: number): this;

  /** Assert that modified count is at least the minimum */
  toHaveModifiedCountGreaterThanOrEqual(count: number): this;

  /** Assert that modified count is less than threshold */
  toHaveModifiedCountLessThan(count: number): this;

  /** Assert that modified count is at most the maximum */
  toHaveModifiedCountLessThanOrEqual(count: number): this;

  /** Assert that upsertedId is present */
  toHaveUpsertedId(): this;

  /** Assert that operation duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that operation duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that operation duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that operation duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for MongoDB delete result validation.
 */
export interface MongoDeleteResultExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation completed successfully */
  toBeSuccessful(): this;

  /** Assert that deleted count matches expected value */
  toHaveDeletedCount(count: number): this;

  /** Assert that deleted count is greater than threshold */
  toHaveDeletedCountGreaterThan(count: number): this;

  /** Assert that deleted count is at least the minimum */
  toHaveDeletedCountGreaterThanOrEqual(count: number): this;

  /** Assert that deleted count is less than threshold */
  toHaveDeletedCountLessThan(count: number): this;

  /** Assert that deleted count is at most the maximum */
  toHaveDeletedCountLessThanOrEqual(count: number): this;

  /** Assert that operation duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that operation duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that operation duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that operation duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for MongoDB findOne result validation.
 */
export interface MongoFindOneResultExpectation<T> {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation completed successfully */
  toBeSuccessful(): this;

  /** Assert that a document was found */
  toHaveContent(): this;

  /** Assert that document contains the given subset */
  toMatchObject(subset: Partial<T>): this;

  /** Assert document using custom matcher function */
  toSatisfy(matcher: (doc: T) => void): this;

  /** Assert that operation duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that operation duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that operation duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that operation duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for MongoDB count result validation.
 */
export interface MongoCountResultExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation completed successfully */
  toBeSuccessful(): this;

  /** Assert that document count matches expected value */
  toHaveLength(expected: number): this;

  /** Assert that document count is at least the minimum */
  toHaveLengthGreaterThanOrEqual(min: number): this;

  /** Assert that document count is at most the maximum */
  toHaveLengthLessThanOrEqual(max: number): this;

  /** Assert that operation duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that operation duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that operation duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that operation duration is greater than or equal to threshold (ms) */
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
