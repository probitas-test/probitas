import { containsSubset } from "./common.ts";
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
  ok(): this;
  notOk(): this;
  noContent(): this;
  hasContent(): this;
  count(expected: number): this;
  countAtLeast(min: number): this;
  countAtMost(max: number): this;
  dataContains(subset: Partial<T>): this;
  dataMatch(matcher: (docs: MongoDocs<T>) => void): this;
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for MongoDB insert result validation.
 */
export interface MongoInsertResultExpectation {
  ok(): this;
  notOk(): this;
  insertedCount(count: number): this;
  hasInsertedId(): this;
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for MongoDB update result validation.
 */
export interface MongoUpdateResultExpectation {
  ok(): this;
  notOk(): this;
  matchedCount(count: number): this;
  modifiedCount(count: number): this;
  hasUpsertedId(): this;
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for MongoDB delete result validation.
 */
export interface MongoDeleteResultExpectation {
  ok(): this;
  notOk(): this;
  deletedCount(count: number): this;
  deletedAtLeast(count: number): this;
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for MongoDB findOne result validation.
 */
export interface MongoFindOneResultExpectation<T> {
  ok(): this;
  notOk(): this;
  hasContent(): this;
  noContent(): this;
  dataContains(subset: Partial<T>): this;
  dataMatch(matcher: (doc: T) => void): this;
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for MongoDB count result validation.
 */
export interface MongoCountResultExpectation {
  ok(): this;
  notOk(): this;
  count(expected: number): this;
  countAtLeast(min: number): this;
  countAtMost(max: number): this;
  durationLessThan(ms: number): this;
}

class MongoFindResultExpectationImpl<T>
  implements MongoFindResultExpectation<T> {
  readonly #result: MongoFindResult<T>;

  constructor(result: MongoFindResult<T>) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  noContent(): this {
    if (this.#result.docs.length !== 0) {
      throw new Error(
        `Expected no documents, got ${this.#result.docs.length}`,
      );
    }
    return this;
  }

  hasContent(): this {
    if (this.#result.docs.length === 0) {
      throw new Error("Expected documents, but got none");
    }
    return this;
  }

  count(expected: number): this {
    if (this.#result.docs.length !== expected) {
      throw new Error(
        `Expected ${expected} documents, got ${this.#result.docs.length}`,
      );
    }
    return this;
  }

  countAtLeast(min: number): this {
    if (this.#result.docs.length < min) {
      throw new Error(
        `Expected at least ${min} documents, got ${this.#result.docs.length}`,
      );
    }
    return this;
  }

  countAtMost(max: number): this {
    if (this.#result.docs.length > max) {
      throw new Error(
        `Expected at most ${max} documents, got ${this.#result.docs.length}`,
      );
    }
    return this;
  }

  dataContains(subset: Partial<T>): this {
    const found = this.#result.docs.some((doc) => containsSubset(doc, subset));
    if (!found) {
      throw new Error(
        `Expected at least one document to contain ${JSON.stringify(subset)}`,
      );
    }
    return this;
  }

  dataMatch(matcher: (docs: MongoDocs<T>) => void): this {
    matcher(this.#result.docs);
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

class MongoInsertResultExpectationImpl implements MongoInsertResultExpectation {
  readonly #result: MongoInsertOneResult | MongoInsertManyResult;

  constructor(result: MongoInsertOneResult | MongoInsertManyResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
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

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

class MongoUpdateResultExpectationImpl implements MongoUpdateResultExpectation {
  readonly #result: MongoUpdateResult;

  constructor(result: MongoUpdateResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
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

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

class MongoDeleteResultExpectationImpl implements MongoDeleteResultExpectation {
  readonly #result: MongoDeleteResult;

  constructor(result: MongoDeleteResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
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

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

class MongoFindOneResultExpectationImpl<T>
  implements MongoFindOneResultExpectation<T> {
  readonly #result: MongoFindOneResult<T>;

  constructor(result: MongoFindOneResult<T>) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  hasContent(): this {
    if (this.#result.doc === undefined) {
      throw new Error("Expected document to be found, but got undefined");
    }
    return this;
  }

  noContent(): this {
    if (this.#result.doc !== undefined) {
      throw new Error("Expected document not to be found, but got a document");
    }
    return this;
  }

  dataContains(subset: Partial<T>): this {
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

  dataMatch(matcher: (doc: T) => void): this {
    if (this.#result.doc === undefined) {
      throw new Error("Expected document for matching, but doc is undefined");
    }
    matcher(this.#result.doc);
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

class MongoCountResultExpectationImpl implements MongoCountResultExpectation {
  readonly #result: MongoCountResult;

  constructor(result: MongoCountResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  count(expected: number): this {
    if (this.#result.count !== expected) {
      throw new Error(
        `Expected count ${expected}, got ${this.#result.count}`,
      );
    }
    return this;
  }

  countAtLeast(min: number): this {
    if (this.#result.count < min) {
      throw new Error(
        `Expected count at least ${min}, got ${this.#result.count}`,
      );
    }
    return this;
  }

  countAtMost(max: number): this {
    if (this.#result.count > max) {
      throw new Error(
        `Expected count at most ${max}, got ${this.#result.count}`,
      );
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
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
 * expectMongoResult(findResult).ok().hasContent().count(2);
 *
 * // For insert result - returns MongoInsertResultExpectation
 * const insertResult = await users.insertOne({ name: "Alice", age: 30 });
 * expectMongoResult(insertResult).ok().hasInsertedId();
 *
 * // For update result - returns MongoUpdateResultExpectation
 * const updateResult = await users.updateOne({ name: "Alice" }, { $set: { age: 31 } });
 * expectMongoResult(updateResult).ok().matchedCount(1).modifiedCount(1);
 *
 * // For delete result - returns MongoDeleteResultExpectation
 * const deleteResult = await users.deleteOne({ name: "Alice" });
 * expectMongoResult(deleteResult).ok().deletedCount(1);
 *
 * // For findOne result - returns MongoFindOneResultExpectation
 * const findOneResult = await users.findOne({ name: "Alice" });
 * expectMongoResult(findOneResult).ok().hasContent().dataContains({ name: "Alice" });
 *
 * // For count result - returns MongoCountResultExpectation
 * const countResult = await users.countDocuments();
 * expectMongoResult(countResult).ok().count(10);
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
