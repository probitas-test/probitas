import type {
  MongoCountResult,
  MongoDeleteResult,
  MongoFindOneResult,
  MongoFindResult,
  MongoInsertManyResult,
  MongoInsertOneResult,
  MongoResult,
  MongoUpdateResult,
} from "@probitas/client-mongodb";
import {
  expectMongoFindResult,
  type MongoFindResultExpectation,
} from "./mongodb/find.ts";
import {
  expectMongoInsertResult,
  type MongoInsertResultExpectation,
} from "./mongodb/insert.ts";
import {
  expectMongoUpdateResult,
  type MongoUpdateResultExpectation,
} from "./mongodb/update.ts";
import {
  expectMongoDeleteResult,
  type MongoDeleteResultExpectation,
} from "./mongodb/delete.ts";
import {
  expectMongoFindOneResult,
  type MongoFindOneResultExpectation,
} from "./mongodb/find_one.ts";
import {
  expectMongoCountResult,
  type MongoCountResultExpectation,
} from "./mongodb/count.ts";

// Re-export interfaces
export type {
  MongoCountResultExpectation,
  MongoDeleteResultExpectation,
  MongoFindOneResultExpectation,
  MongoFindResultExpectation,
  MongoInsertResultExpectation,
  MongoUpdateResultExpectation,
};

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
