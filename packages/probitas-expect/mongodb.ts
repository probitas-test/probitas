import {
  buildCountAtLeastError,
  buildCountAtMostError,
  buildCountError,
  buildDurationError,
  containsSubset,
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
  readonly not: this;
  toBeSuccessful(): this;
  toHaveContent(): this;
  toHaveLength(expected: number): this;
  toHaveLengthGreaterThanOrEqual(min: number): this;
  toHaveLengthLessThanOrEqual(max: number): this;
  toMatchObject(subset: Partial<T>): this;
  toSatisfy(matcher: (docs: MongoDocs<T>) => void): this;
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for MongoDB insert result validation.
 */
export interface MongoInsertResultExpectation {
  readonly not: this;
  toBeSuccessful(): this;
  insertedCount(count: number): this;
  hasInsertedId(): this;
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for MongoDB update result validation.
 */
export interface MongoUpdateResultExpectation {
  readonly not: this;
  toBeSuccessful(): this;
  matchedCount(count: number): this;
  modifiedCount(count: number): this;
  hasUpsertedId(): this;
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for MongoDB delete result validation.
 */
export interface MongoDeleteResultExpectation {
  readonly not: this;
  toBeSuccessful(): this;
  deletedCount(count: number): this;
  deletedAtLeast(count: number): this;
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for MongoDB findOne result validation.
 */
export interface MongoFindOneResultExpectation<T> {
  readonly not: this;
  toBeSuccessful(): this;
  toHaveContent(): this;
  toMatchObject(subset: Partial<T>): this;
  toSatisfy(matcher: (doc: T) => void): this;
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for MongoDB count result validation.
 */
export interface MongoCountResultExpectation {
  readonly not: this;
  toBeSuccessful(): this;
  toHaveLength(expected: number): this;
  toHaveLengthGreaterThanOrEqual(min: number): this;
  toHaveLengthLessThanOrEqual(max: number): this;
  toHaveDurationLessThan(ms: number): this;
}

class MongoFindResultExpectationImpl<T>
  implements MongoFindResultExpectation<T> {
  readonly #result: MongoFindResult<T>;
  readonly #negate: boolean;

  constructor(result: MongoFindResult<T>, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new MongoFindResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  toHaveContent(): this {
    const hasContent = this.#result.docs.length > 0;
    if (this.#negate ? hasContent : !hasContent) {
      throw new Error(
        this.#negate
          ? `Expected no documents, got ${this.#result.docs.length}`
          : "Expected documents, but got none",
      );
    }
    return this;
  }

  toHaveLength(expected: number): this {
    if (this.#result.docs.length !== expected) {
      throw new Error(
        buildCountError(expected, this.#result.docs.length, "documents"),
      );
    }
    return this;
  }

  toHaveLengthGreaterThanOrEqual(min: number): this {
    if (this.#result.docs.length < min) {
      throw new Error(
        buildCountAtLeastError(min, this.#result.docs.length, "documents"),
      );
    }
    return this;
  }

  toHaveLengthLessThanOrEqual(max: number): this {
    if (this.#result.docs.length > max) {
      throw new Error(
        buildCountAtMostError(max, this.#result.docs.length, "documents"),
      );
    }
    return this;
  }

  toMatchObject(subset: Partial<T>): this {
    const found = this.#result.docs.some((doc) => containsSubset(doc, subset));
    if (!found) {
      throw new Error(
        `Expected at least one document to contain ${JSON.stringify(subset)}`,
      );
    }
    return this;
  }

  toSatisfy(matcher: (docs: MongoDocs<T>) => void): this {
    matcher(this.#result.docs);
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
    }
    return this;
  }
}

class MongoInsertResultExpectationImpl implements MongoInsertResultExpectation {
  readonly #result: MongoInsertOneResult | MongoInsertManyResult;
  readonly #negate: boolean;

  constructor(
    result: MongoInsertOneResult | MongoInsertManyResult,
    negate = false,
  ) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new MongoInsertResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  insertedCount(count: number): this {
    const actualCount = "insertedCount" in this.#result
      ? this.#result.insertedCount
      : 1;
    if (actualCount !== count) {
      throw new Error(
        `Expected ${count} inserted documents, got ${actualCount}`,
      );
    }
    return this;
  }

  hasInsertedId(): this {
    if ("insertedId" in this.#result) {
      if (!this.#result.insertedId) {
        throw new Error("Expected insertedId, but it is empty");
      }
    } else {
      if (this.#result.insertedIds.length === 0) {
        throw new Error("Expected insertedIds, but array is empty");
      }
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
    }
    return this;
  }
}

class MongoUpdateResultExpectationImpl implements MongoUpdateResultExpectation {
  readonly #result: MongoUpdateResult;
  readonly #negate: boolean;

  constructor(result: MongoUpdateResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new MongoUpdateResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  matchedCount(count: number): this {
    if (this.#result.matchedCount !== count) {
      throw new Error(
        `Expected ${count} matched documents, got ${this.#result.matchedCount}`,
      );
    }
    return this;
  }

  modifiedCount(count: number): this {
    if (this.#result.modifiedCount !== count) {
      throw new Error(
        `Expected ${count} modified documents, got ${this.#result.modifiedCount}`,
      );
    }
    return this;
  }

  hasUpsertedId(): this {
    if (!this.#result.upsertedId) {
      throw new Error("Expected upsertedId, but no document was upserted");
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
    }
    return this;
  }
}

class MongoDeleteResultExpectationImpl implements MongoDeleteResultExpectation {
  readonly #result: MongoDeleteResult;
  readonly #negate: boolean;

  constructor(result: MongoDeleteResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new MongoDeleteResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  deletedCount(count: number): this {
    if (this.#result.deletedCount !== count) {
      throw new Error(
        `Expected ${count} deleted documents, got ${this.#result.deletedCount}`,
      );
    }
    return this;
  }

  deletedAtLeast(count: number): this {
    if (this.#result.deletedCount < count) {
      throw new Error(
        `Expected at least ${count} deleted documents, got ${this.#result.deletedCount}`,
      );
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
    }
    return this;
  }
}

class MongoFindOneResultExpectationImpl<T>
  implements MongoFindOneResultExpectation<T> {
  readonly #result: MongoFindOneResult<T>;
  readonly #negate: boolean;

  constructor(result: MongoFindOneResult<T>, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new MongoFindOneResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  toHaveContent(): this {
    const hasContent = this.#result.doc !== undefined;
    if (this.#negate ? hasContent : !hasContent) {
      throw new Error(
        this.#negate
          ? "Expected document not to be found, but got a document"
          : "Expected document to be found, but got undefined",
      );
    }
    return this;
  }

  toMatchObject(subset: Partial<T>): this {
    if (this.#result.doc === undefined) {
      throw new Error(
        "Expected document to contain subset, but doc is undefined",
      );
    }
    if (!containsSubset(this.#result.doc, subset)) {
      throw new Error(
        `Expected document to contain ${JSON.stringify(subset)}`,
      );
    }
    return this;
  }

  toSatisfy(matcher: (doc: T) => void): this {
    if (this.#result.doc === undefined) {
      throw new Error("Expected document for matching, but doc is undefined");
    }
    matcher(this.#result.doc);
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
    }
    return this;
  }
}

class MongoCountResultExpectationImpl implements MongoCountResultExpectation {
  readonly #result: MongoCountResult;
  readonly #negate: boolean;

  constructor(result: MongoCountResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new MongoCountResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  toHaveLength(expected: number): this {
    if (this.#result.count !== expected) {
      throw new Error(
        buildCountError(expected, this.#result.count, "count"),
      );
    }
    return this;
  }

  toHaveLengthGreaterThanOrEqual(min: number): this {
    if (this.#result.count < min) {
      throw new Error(
        buildCountAtLeastError(min, this.#result.count, "count"),
      );
    }
    return this;
  }

  toHaveLengthLessThanOrEqual(max: number): this {
    if (this.#result.count > max) {
      throw new Error(
        buildCountAtMostError(max, this.#result.count, "count"),
      );
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
    }
    return this;
  }
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
 * expectMongoResult(findResult).toBeSuccessful().toHaveContent().count(2);
 *
 * // For insert result - returns MongoInsertResultExpectation
 * const insertResult = await users.insertOne({ name: "Alice", age: 30 });
 * expectMongoResult(insertResult).toBeSuccessful().hasInsertedId();
 *
 * // For update result - returns MongoUpdateResultExpectation
 * const updateResult = await users.updateOne({ name: "Alice" }, { $set: { age: 31 } });
 * expectMongoResult(updateResult).toBeSuccessful().matchedCount(1).modifiedCount(1);
 *
 * // For delete result - returns MongoDeleteResultExpectation
 * const deleteResult = await users.deleteOne({ name: "Alice" });
 * expectMongoResult(deleteResult).toBeSuccessful().deletedCount(1);
 *
 * // For findOne result - returns MongoFindOneResultExpectation
 * const findOneResult = await users.findOne({ name: "Alice" });
 * expectMongoResult(findOneResult).toBeSuccessful().toHaveContent().toMatchObject({ name: "Alice" });
 *
 * // For count result - returns MongoCountResultExpectation
 * const countResult = await users.countDocuments();
 * expectMongoResult(countResult).toBeSuccessful().count(10);
 * ```
 */
// deno-lint-ignore no-explicit-any
export function expectMongoResult<R extends MongoResult<any>>(
  result: R,
): MongoExpectation<R> {
  switch (result.type) {
    case "mongo:find":
      return new MongoFindResultExpectationImpl(
        result as MongoFindResult,
      ) as unknown as MongoExpectation<R>;
    case "mongo:insert":
      return new MongoInsertResultExpectationImpl(
        result as MongoInsertOneResult | MongoInsertManyResult,
      ) as unknown as MongoExpectation<R>;
    case "mongo:update":
      return new MongoUpdateResultExpectationImpl(
        result as MongoUpdateResult,
      ) as unknown as MongoExpectation<R>;
    case "mongo:delete":
      return new MongoDeleteResultExpectationImpl(
        result as MongoDeleteResult,
      ) as unknown as MongoExpectation<R>;
    case "mongo:find-one":
      return new MongoFindOneResultExpectationImpl(
        result as MongoFindOneResult,
      ) as unknown as MongoExpectation<R>;
    case "mongo:count":
      return new MongoCountResultExpectationImpl(
        result as MongoCountResult,
      ) as unknown as MongoExpectation<R>;
    default:
      throw new Error(
        `Unknown MongoDB result type: ${(result as { type: string }).type}`,
      );
  }
}
