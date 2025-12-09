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
  /** Invert all assertions */
  readonly not: this;

  /** Verify query succeeded */
  toBeSuccessful(): this;

  /** Verify result has rows */
  toHaveContent(): this;

  /** Verify exact row count */
  toHaveLength(expected: number): this;

  /** Verify minimum row count */
  toHaveLengthGreaterThanOrEqual(expected: number): this;

  /** Verify maximum row count */
  toHaveLengthLessThanOrEqual(expected: number): this;

  /** Verify exact affected row count */
  toHaveRowCount(count: number): this;

  /** Verify minimum affected row count */
  toHaveRowCountGreaterThanOrEqual(count: number): this;

  /** Verify maximum affected row count */
  toHaveRowCountLessThanOrEqual(count: number): this;

  /** Verify a row contains the given subset */
  toMatchObject(subset: Partial<T>): this;

  /** Custom row validation */
  toSatisfy(matcher: (rows: SqlRows<T>) => void): this;

  /** Verify mapped data contains the given subset */
  toHaveMapContaining<U>(mapper: (row: T) => U, subset: Partial<U>): this;

  /** Custom mapped data validation */
  toHaveMapMatching<U>(
    mapper: (row: T) => U,
    matcher: (mapped: U[]) => void,
  ): this;

  /** Verify instance contains the given subset */
  toHaveInstanceContaining<U>(
    ctor: new (row: T) => U,
    subset: Partial<U>,
  ): this;

  /** Custom instance validation */
  toHaveInstanceMatching<U>(
    ctor: new (row: T) => U,
    matcher: (instances: U[]) => void,
  ): this;

  /** Verify exact lastInsertId */
  toHaveLastInsertId(expected: bigint | string): this;

  /** Verify lastInsertId is present (overload without expected) */
  toHaveLastInsertId(): this;

  /** Verify query duration is below threshold */
  toHaveDurationLessThan(ms: number): this;

  /** Verify query duration is at or below threshold */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Verify query duration is above threshold */
  toHaveDurationGreaterThan(ms: number): this;

  /** Verify query duration is at or above threshold */
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
