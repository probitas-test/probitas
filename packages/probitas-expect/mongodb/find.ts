import {
  buildCountAtLeastError,
  buildCountAtMostError,
  buildCountError,
  containsSubset,
  createDurationMethods,
} from "../common.ts";
import type { MongoDocs, MongoFindResult } from "@probitas/client-mongodb";

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

export function expectMongoFindResult<T>(
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
