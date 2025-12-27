/**
 * SQL Client Failure Examples
 *
 * This file demonstrates failure messages for each SQL expectation method.
 * All scenarios are expected to fail - they use dummy results to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import {
  SqlError,
  type SqlQueryResult,
  type SqlQueryResultError,
  type SqlQueryResultSuccess,
} from "jsr:@probitas/client-sql@^0";

// Helper to create mock SQL error result (error result has no rows)
function createMockErrorResult(): SqlQueryResultError {
  return {
    kind: "sql" as const,
    processed: true as const,
    ok: false as const,
    error: new SqlError("Query failed", "query"),
    rows: [] as const,
    rowCount: 0 as const,
    duration: 50,
    lastInsertId: null,
    warnings: null,
    map: <U>(_fn: (row: Record<string, unknown>) => U) => [] as U[],
    as: <T>() => [] as T[],
  };
}

// Helper to create mock SQL success result (with data for failure tests)
function createMockSuccessResult(): SqlQueryResultSuccess {
  const rows = [
    { id: 1, name: "Alice", email: "alice@example.com" },
    { id: 2, name: "Bob", email: "bob@example.com" },
  ];
  return {
    kind: "sql",
    processed: true,
    ok: true,
    error: null,
    rows,
    rowCount: 2,
    duration: 30,
    lastInsertId: null,
    warnings: ["Warning: Deprecated syntax used"],
    map: <U>(fn: (row: Record<string, unknown>) => U) =>
      (rows as Record<string, unknown>[]).map(fn),
    as: <T>() => rows as T[],
  };
}

// Helper to create empty SQL success result
function createMockEmptyResult(): SqlQueryResultSuccess {
  const rows: unknown[] = [];
  return {
    kind: "sql",
    processed: true,
    ok: true,
    error: null,
    rows,
    rowCount: 0,
    duration: 10,
    lastInsertId: null,
    warnings: null,
    map: <U>(_fn: (row: Record<string, unknown>) => U) => [] as U[],
    as: <T>() => [] as T[],
  };
}

// Use success result for testing failures (it has actual data to test against)
const dummyResult: SqlQueryResult = createMockSuccessResult();
const errorResult: SqlQueryResult = createMockErrorResult();

export const toBeOk = scenario("SQL - toBeOk failure", {
  tags: ["failure", "sql"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(errorResult).toBeOk();
  })
  .build();

export const toHaveRowsEmpty = scenario("SQL - toHaveRowsEmpty failure", {
  tags: ["failure", "sql"],
})
  .step("toHaveRowsEmpty fails when rows exist", () => {
    expect(dummyResult).toHaveRowsEmpty();
  })
  .build();

export const toHaveRowsMatching = scenario("SQL - toHaveRowsMatching failure", {
  tags: ["failure", "sql"],
})
  .step("toHaveRowsMatching fails", () => {
    expect(dummyResult).toHaveRowsMatching({ name: "Charlie" });
  })
  .build();

export const toHaveRowCount = scenario("SQL - toHaveRowCount failure", {
  tags: ["failure", "sql"],
})
  .step("toHaveRowCount fails with wrong count", () => {
    expect(dummyResult).toHaveRowCount(10);
  })
  .build();

export const toHaveRowCountGreaterThan = scenario(
  "SQL - toHaveRowCountGreaterThan failure",
  { tags: ["failure", "sql"] },
)
  .step("toHaveRowCountGreaterThan fails", () => {
    expect(dummyResult).toHaveRowCountGreaterThan(5);
  })
  .build();

export const toHaveRowCountLessThan = scenario(
  "SQL - toHaveRowCountLessThan failure",
  { tags: ["failure", "sql"] },
)
  .step("toHaveRowCountLessThan fails", () => {
    expect(dummyResult).toHaveRowCountLessThan(2);
  })
  .build();

export const toHaveLastInsertIdPresent = scenario(
  "SQL - toHaveLastInsertIdPresent failure",
  { tags: ["failure", "sql"] },
)
  .step("toHaveLastInsertIdPresent fails when null", () => {
    expect(dummyResult).toHaveLastInsertIdPresent();
  })
  .build();

export const toHaveWarningsEmpty = scenario(
  "SQL - toHaveWarningsEmpty failure",
  { tags: ["failure", "sql"] },
)
  .step("toHaveWarningsEmpty fails when warnings exist", () => {
    expect(dummyResult).toHaveWarningsEmpty();
  })
  .build();

export const toHaveDuration = scenario("SQL - toHaveDuration failure", {
  tags: ["failure", "sql"],
})
  .step("toHaveDuration fails with wrong duration", () => {
    expect(dummyResult).toHaveDuration(10);
  })
  .build();

export const toHaveDurationLessThan = scenario(
  "SQL - toHaveDurationLessThan failure",
  { tags: ["failure", "sql"] },
)
  .step("toHaveDurationLessThan fails", () => {
    expect(dummyResult).toHaveDurationLessThan(20);
  })
  .build();

export const notToBeOk = scenario("SQL - not.toBeOk failure", {
  tags: ["failure", "sql"],
})
  .step("not.toBeOk fails when ok is true", () => {
    expect(dummyResult).not.toBeOk();
  })
  .build();

export const notToHaveRowsEmpty = scenario(
  "SQL - not.toHaveRowsEmpty failure",
  { tags: ["failure", "sql"] },
)
  .step("not.toHaveRowsEmpty fails when rows empty", () => {
    const emptyResult: SqlQueryResult = createMockEmptyResult();
    expect(emptyResult).not.toHaveRowsEmpty();
  })
  .build();

export default [
  toBeOk,
  toHaveRowsEmpty,
  toHaveRowsMatching,
  toHaveRowCount,
  toHaveRowCountGreaterThan,
  toHaveRowCountLessThan,
  toHaveLastInsertIdPresent,
  toHaveWarningsEmpty,
  toHaveDuration,
  toHaveDurationLessThan,
  notToBeOk,
  notToHaveRowsEmpty,
];
