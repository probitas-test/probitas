import { containsSubset, createDurationMethods } from "../common.ts";
import type { MongoFindOneResult } from "@probitas/client-mongodb";

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

export function expectMongoFindOneResult<T>(
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
