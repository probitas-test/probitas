/**
 * SQL Client Failure Examples
 *
 * This file demonstrates failure messages for each SQL expectation method.
 * All scenarios are expected to fail - they use dummy results to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import type { SqlQueryResult } from "jsr:@probitas/client-sql@^0";

// Helper to create mock SQL result
function createMockResult(
  overrides: Partial<{
    ok: boolean;
    rows: unknown[];
    rowCount: number;
    duration: number;
    lastInsertId?: unknown;
    warnings?: unknown[];
  }> = {},
): SqlQueryResult {
  const defaultResult: SqlQueryResult = {
    kind: "sql",
    ok: false,
    rows: [
      { id: 1, name: "Alice", email: "alice@example.com" },
      { id: 2, name: "Bob", email: "bob@example.com" },
    ] as unknown as SqlQueryResult["rows"],
    rowCount: 2,
    duration: 50,
    lastInsertId: undefined,
    warnings: ["Warning: Deprecated syntax used"],
    map: <U>(fn: (row: Record<string, unknown>) => U) =>
      (defaultResult.rows as Record<string, unknown>[]).map(fn),
    as: () => defaultResult.rows as unknown as never[],
  };

  return {
    ...defaultResult,
    ...overrides,
  } as SqlQueryResult;
}

const dummyResult = createMockResult();

export const toBeOk = scenario("SQL - toBeOk failure", {
  tags: ["failure", "sql"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyResult).toBeOk();
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
  .step("toHaveLastInsertIdPresent fails when undefined", () => {
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
    expect(dummyResult).toHaveDurationLessThan(30);
  })
  .build();

export const notToBeOk = scenario("SQL - not.toBeOk failure", {
  tags: ["failure", "sql"],
})
  .step("not.toBeOk fails when ok is true", () => {
    const okResult = createMockResult({ ok: true });
    expect(okResult).not.toBeOk();
  })
  .build();

export const notToHaveRowsEmpty = scenario(
  "SQL - not.toHaveRowsEmpty failure",
  { tags: ["failure", "sql"] },
)
  .step("not.toHaveRowsEmpty fails when rows empty", () => {
    const emptyResult = createMockResult({
      rows: [],
      rowCount: 0,
    });
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
