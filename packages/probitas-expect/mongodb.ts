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
  expectMongoInsertOneResult,
  type MongoInsertOneResultExpectation,
} from "./mongodb/insert_one.ts";
import {
  expectMongoInsertManyResult,
  type MongoInsertManyResultExpectation,
} from "./mongodb/insert_many.ts";
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
  MongoInsertManyResultExpectation,
  MongoInsertOneResultExpectation,
  MongoUpdateResultExpectation,
};

/**
 * Expectation type returned by expectMongoResult based on the result type.
 */
export type MongoExpectation<R extends MongoResult> = R extends
  MongoFindResult<infer T> ? MongoFindResultExpectation<T>
  : R extends MongoInsertOneResult ? MongoInsertOneResultExpectation
  : R extends MongoInsertManyResult ? MongoInsertManyResultExpectation
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
 * import type { MongoFindResult, MongoInsertOneResult, MongoUpdateResult, MongoDeleteResult, MongoFindOneResult, MongoCountResult } from "@probitas/client-mongodb";
 * import { expectMongoResult } from "./mongodb.ts";
 *
 * // For find result - returns MongoFindResultExpectation
 * const findResult = {
 *   kind: "mongo:find",
 *   ok: true,
 *   docs: [{ name: "Alice" }],
 *   duration: 0,
 * } as unknown as MongoFindResult;
 * expectMongoResult(findResult).toBeOk().toHaveDocsCount(1);
 *
 * // For insert result - returns MongoInsertOneResultExpectation
 * const insertResult = {
 *   kind: "mongo:insert-one",
 *   ok: true,
 *   insertedId: "123",
 *   duration: 0,
 * } as unknown as MongoInsertOneResult;
 * expectMongoResult(insertResult).toBeOk().toHaveInsertedId("123");
 *
 * // For update result - returns MongoUpdateResultExpectation
 * const updateResult = {
 *   kind: "mongo:update",
 *   ok: true,
 *   matchedCount: 1,
 *   modifiedCount: 1,
 *   duration: 0,
 * } as unknown as MongoUpdateResult;
 * expectMongoResult(updateResult).toBeOk().toHaveMatchedCount(1).toHaveModifiedCount(1);
 *
 * // For delete result - returns MongoDeleteResultExpectation
 * const deleteResult = {
 *   kind: "mongo:delete",
 *   ok: true,
 *   deletedCount: 1,
 *   duration: 0,
 * } as unknown as MongoDeleteResult;
 * expectMongoResult(deleteResult).toBeOk().toHaveDeletedCount(1);
 *
 * // For findOne result - returns MongoFindOneResultExpectation
 * const findOneResult = {
 *   kind: "mongo:find-one",
 *   ok: true,
 *   doc: { name: "Alice" },
 *   duration: 0,
 * } as unknown as MongoFindOneResult;
 * expectMongoResult(findOneResult).toBeOk().toHaveDocPresent();
 *
 * // For count result - returns MongoCountResultExpectation
 * const countResult = {
 *   kind: "mongo:count",
 *   ok: true,
 *   count: 10,
 *   duration: 0,
 * } as unknown as MongoCountResult;
 * expectMongoResult(countResult).toBeOk().toHaveCount(10);
 * ```
 */
export function expectMongoResult<R extends MongoResult>(
  result: R,
): MongoExpectation<R> {
  switch (result.kind) {
    case "mongo:find":
      return expectMongoFindResult(
        result as MongoFindResult,
      ) as MongoExpectation<R>;
    case "mongo:insert-one":
      return expectMongoInsertOneResult(
        result as MongoInsertOneResult,
      ) as MongoExpectation<R>;
    case "mongo:insert-many":
      return expectMongoInsertManyResult(
        result as MongoInsertManyResult,
      ) as MongoExpectation<R>;
    case "mongo:update":
      return expectMongoUpdateResult(
        result as MongoUpdateResult,
      ) as MongoExpectation<R>;
    case "mongo:delete":
      return expectMongoDeleteResult(
        result as MongoDeleteResult,
      ) as MongoExpectation<R>;
    case "mongo:find-one":
      return expectMongoFindOneResult(
        result as MongoFindOneResult,
      ) as MongoExpectation<R>;
    case "mongo:count":
      return expectMongoCountResult(
        result as MongoCountResult,
      ) as MongoExpectation<R>;
    default:
      throw new Error(
        `Unknown MongoDB result kind: ${(result as { kind: string }).kind}`,
      );
  }
}
