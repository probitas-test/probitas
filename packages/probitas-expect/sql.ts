import {
  buildCountAtLeastError,
  buildCountAtMostError,
  buildCountError,
  containsSubset,
  createDurationMethods,
} from "./common.ts";
import type { SqlQueryResult, SqlRows } from "@probitas/client-sql";

/**
 * Expectation interface for SQL query results.
 * All methods return `this` for chaining.
 */
export interface SqlQueryResultExpectation<T> {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectSqlQueryResult(result).not.toBeSuccessful();
   * expectSqlQueryResult(result).not.toHaveContent();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the query succeeded.
   *
   * @example
   * ```ts
   * expectSqlQueryResult(result).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the result has at least one row.
   *
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveContent();
   * ```
   */
  toHaveContent(): this;

  /**
   * Asserts that the row count matches the expected value.
   *
   * @param expected - The expected number of rows
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveLength(10);
   * ```
   */
  toHaveLength(expected: number): this;

  /**
   * Asserts that the row count is at least the expected value.
   *
   * @param expected - The minimum expected number of rows
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveLengthGreaterThanOrEqual(5);
   * ```
   */
  toHaveLengthGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the row count is at most the expected value.
   *
   * @param expected - The maximum expected number of rows
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveLengthLessThanOrEqual(100);
   * ```
   */
  toHaveLengthLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the affected row count matches the expected value.
   *
   * @param count - The expected affected row count
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveRowCount(1);
   * ```
   */
  toHaveRowCount(count: number): this;

  /**
   * Asserts that the affected row count is at least the expected value.
   *
   * @param count - The minimum expected affected row count
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveRowCountGreaterThanOrEqual(1);
   * ```
   */
  toHaveRowCountGreaterThanOrEqual(count: number): this;

  /**
   * Asserts that the affected row count is at most the expected value.
   *
   * @param count - The maximum expected affected row count
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveRowCountLessThanOrEqual(10);
   * ```
   */
  toHaveRowCountLessThanOrEqual(count: number): this;

  /**
   * Asserts that at least one row contains the given subset of properties.
   *
   * @param subset - The partial object to match against rows
   * @example
   * ```ts
   * expectSqlQueryResult(result).toMatchObject({ name: "Alice", active: true });
   * ```
   */
  toMatchObject(subset: Partial<T>): this;

  /**
   * Validates the rows using a custom matcher function.
   *
   * @param matcher - A function that receives the rows and performs assertions
   * @example
   * ```ts
   * expectSqlQueryResult(result).toSatisfy((rows) => {
   *   assertEquals(rows.length, 2);
   *   assertEquals(rows[0].name, "Alice");
   * });
   * ```
   */
  toSatisfy(matcher: (rows: SqlRows<T>) => void): this;

  /**
   * Asserts that at least one mapped row contains the given subset.
   *
   * @param mapper - A function to transform each row
   * @param subset - The partial object to match against mapped rows
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveMapContaining(
   *   (row) => ({ upperName: row.name.toUpperCase() }),
   *   { upperName: "ALICE" }
   * );
   * ```
   */
  toHaveMapContaining<U>(mapper: (row: T) => U, subset: Partial<U>): this;

  /**
   * Validates the mapped rows using a custom matcher function.
   *
   * @param mapper - A function to transform each row
   * @param matcher - A function that receives the mapped rows and performs assertions
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveMapMatching(
   *   (row) => row.name.toUpperCase(),
   *   (names) => assertEquals(names, ["ALICE", "BOB"])
   * );
   * ```
   */
  toHaveMapMatching<U>(
    mapper: (row: T) => U,
    matcher: (mapped: U[]) => void,
  ): this;

  /**
   * Asserts that at least one instance created from rows contains the given subset.
   *
   * @param ctor - The constructor to instantiate with each row
   * @param subset - The partial object to match against instances
   * @example
   * ```ts
   * class User {
   *   constructor(row: { name: string }) {
   *     this.displayName = row.name.toUpperCase();
   *   }
   *   displayName: string;
   * }
   * expectSqlQueryResult(result).toHaveInstanceContaining(User, { displayName: "ALICE" });
   * ```
   */
  toHaveInstanceContaining<U>(
    ctor: new (row: T) => U,
    subset: Partial<U>,
  ): this;

  /**
   * Validates instances created from rows using a custom matcher function.
   *
   * @param ctor - The constructor to instantiate with each row
   * @param matcher - A function that receives the instances and performs assertions
   * @example
   * ```ts
   * class User {
   *   constructor(row: { name: string }) {
   *     this.displayName = row.name.toUpperCase();
   *   }
   *   displayName: string;
   * }
   * expectSqlQueryResult(result).toHaveInstanceMatching(User, (users) => {
   *   assertEquals(users.length, 2);
   * });
   * ```
   */
  toHaveInstanceMatching<U>(
    ctor: new (row: T) => U,
    matcher: (instances: U[]) => void,
  ): this;

  /**
   * Asserts that the lastInsertId matches the expected value.
   *
   * @param expected - The expected lastInsertId value
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveLastInsertId(1n);
   * expectSqlQueryResult(result).toHaveLastInsertId("uuid-string");
   * ```
   */
  toHaveLastInsertId(expected: bigint | string): this;

  /**
   * Asserts that the lastInsertId is present.
   *
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveLastInsertId();
   * ```
   */
  toHaveLastInsertId(): this;

  /**
   * Asserts that the query duration is less than the threshold.
   *
   * @param ms - The maximum duration in milliseconds (exclusive)
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the query duration is at most the threshold.
   *
   * @param ms - The maximum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the query duration is greater than the threshold.
   *
   * @param ms - The minimum duration in milliseconds (exclusive)
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the query duration is at least the threshold.
   *
   * @param ms - The minimum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqlQueryResult(result).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Create a fluent expectation chain for SQL query result validation.
 *
 * Returns an expectation object with chainable assertion methods.
 * Each assertion throws an Error if it fails, making it ideal for testing.
 *
 * @param result - The SQL query result to validate
 * @param negate - Whether to negate assertions (used internally by .not)
 * @returns A fluent expectation chain
 *
 * @example Basic assertions
 * ```ts
 * const result = await client.query("SELECT * FROM users WHERE active = true");
 *
 * expectSqlQueryResult(result)
 *   .toBeSuccessful()
 *   .toHaveLengthGreaterThanOrEqual(1)
 *   .toMatchObject({ name: "Alice" });
 * ```
 *
 * @example Insert/Update assertions
 * ```ts
 * const result = await client.query(
 *   "INSERT INTO users (name, email) VALUES ($1, $2)",
 *   ["Bob", "bob@example.com"]
 * );
 *
 * expectSqlQueryResult(result)
 *   .toBeSuccessful()
 *   .toHaveRowCount(1)
 *   .toHaveLastInsertId();
 * ```
 *
 * @example Custom matcher with mapped data
 * ```ts
 * expectSqlQueryResult(result)
 *   .toBeSuccessful()
 *   .toHaveMapMatching(
 *     (row) => row.name.toUpperCase(),
 *     (names) => assertEquals(names, ["ALICE", "BOB"])
 *   );
 * ```
 *
 * @example Performance assertions
 * ```ts
 * expectSqlQueryResult(result)
 *   .toBeSuccessful()
 *   .toHaveDurationLessThan(100);  // Must complete within 100ms
 * ```
 */
// deno-lint-ignore no-explicit-any
export function expectSqlQueryResult<T = Record<string, any>>(
  result: SqlQueryResult<T>,
  negate = false,
): SqlQueryResultExpectation<T> {
  const self: SqlQueryResultExpectation<T> = {
    get not(): SqlQueryResultExpectation<T> {
      return expectSqlQueryResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate ? "Expected query to fail" : "Expected query to succeed",
        );
      }
      return this;
    },

    toHaveContent() {
      const hasRows = result.rows.length > 0;
      if (negate ? hasRows : !hasRows) {
        throw new Error(
          negate
            ? `Expected no rows, got ${result.rows.length}`
            : "Expected rows to be present",
        );
      }
      return this;
    },

    toHaveLength(expected: number) {
      const match = result.rows.length === expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected row count to not be ${expected}, got ${result.rows.length}`
            : buildCountError(expected, result.rows.length, "rows"),
        );
      }
      return this;
    },

    toHaveLengthGreaterThanOrEqual(expected: number) {
      const match = result.rows.length >= expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected row count to not be >= ${expected}, got ${result.rows.length}`
            : buildCountAtLeastError(expected, result.rows.length, "rows"),
        );
      }
      return this;
    },

    toHaveLengthLessThanOrEqual(expected: number) {
      const match = result.rows.length <= expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected row count to not be <= ${expected}, got ${result.rows.length}`
            : buildCountAtMostError(expected, result.rows.length, "rows"),
        );
      }
      return this;
    },

    toHaveRowCount(count: number) {
      const match = result.rowCount === count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected rowCount to not be ${count}, got ${result.rowCount}`
            : buildCountError(count, result.rowCount, "rowCount"),
        );
      }
      return this;
    },

    toHaveRowCountGreaterThanOrEqual(count: number) {
      const match = result.rowCount >= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected rowCount to not be >= ${count}, got ${result.rowCount}`
            : buildCountAtLeastError(count, result.rowCount, "rowCount"),
        );
      }
      return this;
    },

    toHaveRowCountLessThanOrEqual(count: number) {
      const match = result.rowCount <= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected rowCount to not be <= ${count}, got ${result.rowCount}`
            : buildCountAtMostError(count, result.rowCount, "rowCount"),
        );
      }
      return this;
    },

    toMatchObject(subset: Partial<T>) {
      const found = result.rows.find((row) => containsSubset(row, subset));
      if (negate ? found : !found) {
        throw new Error(
          negate
            ? "Expected no row to contain the subset, but found one"
            : "No row contains the expected subset",
        );
      }
      return this;
    },

    toSatisfy(matcher: (rows: SqlRows<T>) => void) {
      matcher(result.rows);
      return this;
    },

    toHaveMapContaining<U>(mapper: (row: T) => U, subset: Partial<U>) {
      const mapped = result.map(mapper);
      const found = mapped.find((item) => containsSubset(item, subset));
      if (negate ? found : !found) {
        throw new Error(
          negate
            ? "Expected no mapped row to contain the subset, but found one"
            : "No mapped row contains the expected subset",
        );
      }
      return this;
    },

    toHaveMapMatching<U>(
      mapper: (row: T) => U,
      matcher: (mapped: U[]) => void,
    ) {
      const mapped = result.map(mapper);
      matcher(mapped);
      return this;
    },

    toHaveInstanceContaining<U>(ctor: new (row: T) => U, subset: Partial<U>) {
      const instances = result.as(ctor);
      const found = instances.find((item) => containsSubset(item, subset));
      if (negate ? found : !found) {
        throw new Error(
          negate
            ? "Expected no instance to contain the subset, but found one"
            : "No instance contains the expected subset",
        );
      }
      return this;
    },

    toHaveInstanceMatching<U>(
      ctor: new (row: T) => U,
      matcher: (instances: U[]) => void,
    ) {
      const instances = result.as(ctor);
      matcher(instances);
      return this;
    },

    toHaveLastInsertId(expected?: bigint | string) {
      const actual = result.metadata.lastInsertId;
      if (expected !== undefined) {
        const match = actual === expected;
        if (negate ? match : !match) {
          throw new Error(
            negate
              ? `Expected lastInsertId to not be ${expected}, got ${actual}`
              : `Expected lastInsertId ${expected}, got ${actual}`,
          );
        }
      } else {
        const hasId = actual !== undefined;
        if (negate ? hasId : !hasId) {
          throw new Error(
            negate
              ? "Expected no lastInsertId, but it exists"
              : "Expected lastInsertId to be present",
          );
        }
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}
