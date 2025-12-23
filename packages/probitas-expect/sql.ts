import type { SqlQueryResult } from "@probitas/client-sql";
import { ensureNonNullish } from "./utils.ts";
import * as mixin from "./mixin.ts";

type SqlRows = SqlQueryResult["rows"];
type SqlWarnings = SqlQueryResult["warnings"];

/**
 * Expectation interface for SQL query results.
 * All methods return `this` for chaining.
 */
export interface SqlQueryResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { SqlQueryResult } from "@probitas/client-sql";
   * import { expectSqlQueryResult } from "./sql.ts";
   * const result = {
   *   kind: "sql",
   *   ok: false,
   *   rows: [],
   *   rowCount: 0,
   *   duration: 0,
   *   map: () => [],
   *   as: () => [],
   * } as unknown as SqlQueryResult;
   *
   * expectSqlQueryResult(result).not.toBeOk();
   * expectSqlQueryResult(result).not.toHaveRowCount(5);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result is successful.
   *
   * @example
   * ```ts
   * import type { SqlQueryResult } from "@probitas/client-sql";
   * import { expectSqlQueryResult } from "./sql.ts";
   * const result = {
   *   kind: "sql",
   *   ok: true,
   *   rows: [],
   *   rowCount: 0,
   *   duration: 0,
   *   map: () => [],
   *   as: () => [],
   * } as unknown as SqlQueryResult;
   *
   * expectSqlQueryResult(result).toBeOk();
   * ```
   */
  toBeOk(): this;

  /**
   * Asserts that the rows equal the expected value.
   * @param expected - The expected rows value
   */
  toHaveRows(expected: unknown): this;

  /**
   * Asserts that the rows equal the expected value using deep equality.
   * @param expected - The expected rows value
   */
  toHaveRowsEqual(expected: unknown): this;

  /**
   * Asserts that the rows strictly equal the expected value.
   * @param expected - The expected rows value
   */
  toHaveRowsStrictEqual(expected: unknown): this;

  /**
   * Asserts that the rows satisfy the provided matcher function.
   * @param matcher - A function that receives the rows and performs assertions
   */
  toHaveRowsSatisfying(matcher: (value: SqlRows) => void): this;

  /**
   * Asserts that the rows array contains the specified item.
   * @param item - The item to search for
   */
  toHaveRowsContaining(item: unknown): this;

  /**
   * Asserts that the rows array contains an item equal to the specified value.
   * @param item - The item to search for using deep equality
   */
  toHaveRowsContainingEqual(item: unknown): this;

  /**
   * Asserts that the rows array matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveRowsMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the rows array is empty.
   */
  toHaveRowsEmpty(): this;

  /**
   * Asserts that the row count equals the expected value.
   * @param expected - The expected row count
   */
  toHaveRowCount(expected: unknown): this;

  /**
   * Asserts that the row count equals the expected value using deep equality.
   * @param expected - The expected row count
   */
  toHaveRowCountEqual(expected: unknown): this;

  /**
   * Asserts that the row count strictly equals the expected value.
   * @param expected - The expected row count
   */
  toHaveRowCountStrictEqual(expected: unknown): this;

  /**
   * Asserts that the row count satisfies the provided matcher function.
   * @param matcher - A function that receives the row count and performs assertions
   */
  toHaveRowCountSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the row count is NaN.
   */
  toHaveRowCountNaN(): this;

  /**
   * Asserts that the row count is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveRowCountGreaterThan(expected: number): this;

  /**
   * Asserts that the row count is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveRowCountGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the row count is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveRowCountLessThan(expected: number): this;

  /**
   * Asserts that the row count is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveRowCountLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the row count is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveRowCountCloseTo(expected: number, numDigits?: number): this;

  /**
   * Asserts that the last insert ID equals the expected value.
   * @param expected - The expected last insert ID
   */
  toHaveLastInsertId(expected: unknown): this;

  /**
   * Asserts that the last insert ID equals the expected value using deep equality.
   * @param expected - The expected last insert ID
   */
  toHaveLastInsertIdEqual(expected: unknown): this;

  /**
   * Asserts that the last insert ID strictly equals the expected value.
   * @param expected - The expected last insert ID
   */
  toHaveLastInsertIdStrictEqual(expected: unknown): this;

  /**
   * Asserts that the last insert ID satisfies the provided matcher function.
   * @param matcher - A function that receives the last insert ID and performs assertions
   */
  // deno-lint-ignore no-explicit-any
  toHaveLastInsertIdSatisfying(matcher: (value: any) => void): this;

  /**
   * Asserts that the last insert ID is present (not null or undefined).
   */
  toHaveLastInsertIdPresent(): this;

  /**
   * Asserts that the last insert ID is null.
   */
  toHaveLastInsertIdNull(): this;

  /**
   * Asserts that the last insert ID is undefined.
   */
  toHaveLastInsertIdUndefined(): this;

  /**
   * Asserts that the last insert ID is nullish (null or undefined).
   */
  toHaveLastInsertIdNullish(): this;

  /**
   * Asserts that the warnings equal the expected value.
   * @param expected - The expected warnings value
   */
  toHaveWarnings(expected: unknown): this;

  /**
   * Asserts that the warnings equal the expected value using deep equality.
   * @param expected - The expected warnings value
   */
  toHaveWarningsEqual(expected: unknown): this;

  /**
   * Asserts that the warnings strictly equal the expected value.
   * @param expected - The expected warnings value
   */
  toHaveWarningsStrictEqual(expected: unknown): this;

  /**
   * Asserts that the warnings satisfy the provided matcher function.
   * @param matcher - A function that receives the warnings and performs assertions
   */
  toHaveWarningsSatisfying(matcher: (value: SqlWarnings) => void): this;

  /**
   * Asserts that the warnings are present (not null or undefined).
   */
  toHaveWarningsPresent(): this;

  /**
   * Asserts that the warnings are null.
   */
  toHaveWarningsNull(): this;

  /**
   * Asserts that the warnings are undefined.
   */
  toHaveWarningsUndefined(): this;

  /**
   * Asserts that the warnings are nullish (null or undefined).
   */
  toHaveWarningsNullish(): this;

  /**
   * Asserts that the warnings array contains the specified item.
   * @param item - The item to search for
   */
  toHaveWarningsContaining(item: unknown): this;

  /**
   * Asserts that the warnings array contains an item equal to the specified value.
   * @param item - The item to search for using deep equality
   */
  toHaveWarningsContainingEqual(item: unknown): this;

  /**
   * Asserts that the warnings array matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveWarningsMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the warnings array is empty.
   */
  toHaveWarningsEmpty(): this;

  /**
   * Asserts that the duration equals the expected value.
   * @param expected - The expected duration value
   */
  toHaveDuration(expected: unknown): this;

  /**
   * Asserts that the duration equals the expected value using deep equality.
   * @param expected - The expected duration value
   */
  toHaveDurationEqual(expected: unknown): this;

  /**
   * Asserts that the duration strictly equals the expected value.
   * @param expected - The expected duration value
   */
  toHaveDurationStrictEqual(expected: unknown): this;

  /**
   * Asserts that the duration satisfies the provided matcher function.
   * @param matcher - A function that receives the duration and performs assertions
   */
  toHaveDurationSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the duration is NaN.
   */
  toHaveDurationNaN(): this;

  /**
   * Asserts that the duration is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveDurationGreaterThan(expected: number): this;

  /**
   * Asserts that the duration is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveDurationGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the duration is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveDurationLessThan(expected: number): this;

  /**
   * Asserts that the duration is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveDurationLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the duration is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveDurationCloseTo(expected: number, numDigits?: number): this;
}

// deno-lint-ignore no-explicit-any
export function expectSqlQueryResult<T = Record<string, any>>(
  result: SqlQueryResult<T>,
): SqlQueryResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("result")),
      // Rows
      mixin.createValueMixin(() => result.rows, negate, cfg("rows")),
      mixin.createArrayValueMixin(
        () => ensureNonNullish(result.rows, "rows"),
        negate,
        cfg("rows"),
      ),
      // Row count
      mixin.createValueMixin(() => result.rowCount, negate, cfg("row count")),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.rowCount, "rowCount"),
        negate,
        cfg("row count"),
      ),
      // LastInsertedId
      mixin.createValueMixin(
        () => result.lastInsertId,
        negate,
        cfg("last insert id"),
      ),
      mixin.createNullishValueMixin(
        () => result.lastInsertId,
        negate,
        cfg("last insert id"),
      ),
      // Warnings
      mixin.createValueMixin(() => result.warnings, negate, cfg("warnings")),
      mixin.createNullishValueMixin(
        () => result.warnings,
        negate,
        cfg("warnings"),
      ),
      mixin.createArrayValueMixin(
        () => ensureNonNullish(result.warnings, "warnings"),
        negate,
        cfg("warnings"),
      ),
      // Duration
      mixin.createValueMixin(() => result.duration, negate, cfg("duration")),
      mixin.createNumberValueMixin(
        () => result.duration,
        negate,
        cfg("duration"),
      ),
    ] as const;
  });
}
