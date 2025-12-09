import { containsSubset } from "./common.ts";
import type { SqlQueryResult, SqlRows } from "@probitas/client-sql";

/**
 * Expectation interface for SQL query results.
 * All methods return `this` for chaining.
 */
export interface SqlQueryResultExpectation<T> {
  /** Verify query succeeded */
  ok(): this;

  /** Verify query failed */
  notOk(): this;

  /** Verify result has no rows */
  noContent(): this;

  /** Verify result has rows */
  hasContent(): this;

  /** Verify exact row count */
  count(expected: number): this;

  /** Verify minimum row count */
  countAtLeast(expected: number): this;

  /** Verify maximum row count */
  countAtMost(expected: number): this;

  /** Verify exact affected row count */
  rowCount(count: number): this;

  /** Verify minimum affected row count */
  rowCountAtLeast(count: number): this;

  /** Verify maximum affected row count */
  rowCountAtMost(count: number): this;

  /** Verify a row contains the given subset */
  dataContains(subset: Partial<T>): this;

  /** Custom row validation */
  dataMatch(matcher: (rows: SqlRows<T>) => void): this;

  /** Verify mapped data contains the given subset */
  mapContains<U>(mapper: (row: T) => U, subset: Partial<U>): this;

  /** Custom mapped data validation */
  mapMatch<U>(mapper: (row: T) => U, matcher: (mapped: U[]) => void): this;

  /** Verify instance contains the given subset */
  asContains<U>(ctor: new (row: T) => U, subset: Partial<U>): this;

  /** Custom instance validation */
  asMatch<U>(ctor: new (row: T) => U, matcher: (instances: U[]) => void): this;

  /** Verify exact lastInsertId */
  lastInsertId(expected: bigint | string): this;

  /** Verify lastInsertId is present */
  hasLastInsertId(): this;

  /** Verify query duration is below threshold */
  durationLessThan(ms: number): this;
}

/**
 * Implementation of SqlQueryResultExpectation.
 */
class SqlQueryResultExpectationImpl<T> implements SqlQueryResultExpectation<T> {
  constructor(private readonly result: SqlQueryResult<T>) {}

  ok(): this {
    if (!this.result.ok) {
      throw new Error("Expected query to succeed");
    }
    return this;
  }

  notOk(): this {
    if (this.result.ok) {
      throw new Error("Expected query to fail");
    }
    return this;
  }

  noContent(): this {
    if (this.result.rows.length > 0) {
      throw new Error(`Expected no rows, got ${this.result.rows.length}`);
    }
    return this;
  }

  hasContent(): this {
    if (this.result.rows.length === 0) {
      throw new Error("Expected rows to be present");
    }
    return this;
  }

  count(expected: number): this {
    if (this.result.rows.length !== expected) {
      throw new Error(
        `Expected ${expected} rows, got ${this.result.rows.length}`,
      );
    }
    return this;
  }

  countAtLeast(expected: number): this {
    if (this.result.rows.length < expected) {
      throw new Error(
        `Expected at least ${expected} rows, got ${this.result.rows.length}`,
      );
    }
    return this;
  }

  countAtMost(expected: number): this {
    if (this.result.rows.length > expected) {
      throw new Error(
        `Expected at most ${expected} rows, got ${this.result.rows.length}`,
      );
    }
    return this;
  }

  rowCount(count: number): this {
    if (this.result.rowCount !== count) {
      throw new Error(
        `Expected rowCount ${count}, got ${this.result.rowCount}`,
      );
    }
    return this;
  }

  rowCountAtLeast(count: number): this {
    if (this.result.rowCount < count) {
      throw new Error(
        `Expected rowCount at least ${count}, got ${this.result.rowCount}`,
      );
    }
    return this;
  }

  rowCountAtMost(count: number): this {
    if (this.result.rowCount > count) {
      throw new Error(
        `Expected rowCount at most ${count}, got ${this.result.rowCount}`,
      );
    }
    return this;
  }

  dataContains(subset: Partial<T>): this {
    const found = this.result.rows.find((row) => containsSubset(row, subset));
    if (!found) {
      throw new Error("No row contains the expected subset");
    }
    return this;
  }

  dataMatch(matcher: (rows: SqlRows<T>) => void): this {
    matcher(this.result.rows);
    return this;
  }

  mapContains<U>(mapper: (row: T) => U, subset: Partial<U>): this {
    const mapped = this.result.map(mapper);
    const found = mapped.find((item) => containsSubset(item, subset));
    if (!found) {
      throw new Error("No mapped row contains the expected subset");
    }
    return this;
  }

  mapMatch<U>(mapper: (row: T) => U, matcher: (mapped: U[]) => void): this {
    const mapped = this.result.map(mapper);
    matcher(mapped);
    return this;
  }

  asContains<U>(ctor: new (row: T) => U, subset: Partial<U>): this {
    const instances = this.result.as(ctor);
    const found = instances.find((item) => containsSubset(item, subset));
    if (!found) {
      throw new Error("No instance contains the expected subset");
    }
    return this;
  }

  asMatch<U>(ctor: new (row: T) => U, matcher: (instances: U[]) => void): this {
    const instances = this.result.as(ctor);
    matcher(instances);
    return this;
  }

  lastInsertId(expected: bigint | string): this {
    const actual = this.result.metadata.lastInsertId;
    if (actual !== expected) {
      throw new Error(`Expected lastInsertId ${expected}, got ${actual}`);
    }
    return this;
  }

  hasLastInsertId(): this {
    if (this.result.metadata.lastInsertId === undefined) {
      throw new Error("Expected lastInsertId to be present");
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Create a fluent expectation chain for SQL query result validation.
 *
 * Returns an expectation object with chainable assertion methods.
 * Each assertion throws an Error if it fails, making it ideal for testing.
 *
 * @param result - The SQL query result to validate
 * @returns A fluent expectation chain
 *
 * @example Basic assertions
 * ```ts
 * const result = await client.query("SELECT * FROM users WHERE active = true");
 *
 * expectSqlQueryResult(result)
 *   .ok()
 *   .countAtLeast(1)
 *   .dataContains({ name: "Alice" });
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
 *   .ok()
 *   .rowCount(1)
 *   .hasLastInsertId();
 * ```
 *
 * @example Custom matcher with mapped data
 * ```ts
 * expectSqlQueryResult(result)
 *   .ok()
 *   .mapMatch(
 *     (row) => row.name.toUpperCase(),
 *     (names) => assertEquals(names, ["ALICE", "BOB"])
 *   );
 * ```
 *
 * @example Performance assertions
 * ```ts
 * expectSqlQueryResult(result)
 *   .ok()
 *   .durationLessThan(100);  // Must complete within 100ms
 * ```
 */
// deno-lint-ignore no-explicit-any
export function expectSqlQueryResult<T = Record<string, any>>(
  result: SqlQueryResult<T>,
): SqlQueryResultExpectation<T> {
  return new SqlQueryResultExpectationImpl(result);
}
