import { assertEquals, assertExists } from "@std/assert";
import type { SqlQueryResult } from "@probitas/client-sql";
import { expectSqlQueryResult, type SqlQueryResultExpectation } from "./sql.ts";

// Mock SqlQueryResult for testing
function createMockResult(
  overrides: Partial<{
    ok: boolean;
    rows: unknown[];
    rowCount: number;
    duration: number;
    lastInsertId?: unknown;
    warnings?: unknown[];
  }> = {},
): SqlQueryResult<Record<string, unknown>> {
  const rows = [
    { id: 1, name: "Alice", age: 30 },
    { id: 2, name: "Bob", age: 25 },
  ];
  const defaultResult = {
    kind: "sql",
    processed: true,
    ok: true,
    error: null,
    rows,
    rowCount: 2,
    duration: 123,
    lastInsertId: BigInt(42),
    warnings: ["Warning: truncated value"],
    map: <U>(fn: (row: Record<string, unknown>) => U) => rows.map(fn),
    as: () => rows,
  } as unknown as SqlQueryResult<Record<string, unknown>>;

  return {
    ...defaultResult,
    ...overrides,
  } as SqlQueryResult<Record<string, unknown>>;
}

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof SqlQueryResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Rows (arrays - can't test with strict equality)
  toHaveRows: [],
  toHaveRowsEqual: [],
  toHaveRowsStrictEqual: [],
  toHaveRowsSatisfying: [(v: unknown[]) => assertEquals(v.length, 2)],
  toHaveRowsContaining: [],
  toHaveRowsContainingEqual: [],
  toHaveRowsMatching: [{ id: 1, name: "Alice" }],
  toHaveRowsEmpty: [],
  // Row count
  toHaveRowCount: [2],
  toHaveRowCountEqual: [2],
  toHaveRowCountStrictEqual: [2],
  toHaveRowCountSatisfying: [(v: number) => assertEquals(v, 2)],
  toHaveRowCountNaN: [],
  toHaveRowCountGreaterThan: [1],
  toHaveRowCountGreaterThanOrEqual: [2],
  toHaveRowCountLessThan: [3],
  toHaveRowCountLessThanOrEqual: [2],
  toHaveRowCountCloseTo: [2, 0],
  // Last insert ID
  toHaveLastInsertId: [BigInt(42)],
  toHaveLastInsertIdEqual: [BigInt(42)],
  toHaveLastInsertIdStrictEqual: [BigInt(42)],
  toHaveLastInsertIdSatisfying: [(v: unknown) => assertEquals(v, BigInt(42))],
  toHaveLastInsertIdPresent: [],
  toHaveLastInsertIdNull: [],
  toHaveLastInsertIdUndefined: [],
  toHaveLastInsertIdNullish: [],
  // Warnings (arrays - can't test with strict equality)
  toHaveWarnings: [],
  toHaveWarningsEqual: [],
  toHaveWarningsStrictEqual: [],
  toHaveWarningsSatisfying: [(v: unknown[]) => assertEquals(v.length, 1)],
  toHaveWarningsPresent: [],
  toHaveWarningsNull: [],
  toHaveWarningsUndefined: [],
  toHaveWarningsNullish: [],
  toHaveWarningsContaining: [],
  toHaveWarningsContainingEqual: [],
  toHaveWarningsMatching: [],
  toHaveWarningsEmpty: [],
  // Duration
  toHaveDuration: [123],
  toHaveDurationEqual: [123],
  toHaveDurationStrictEqual: [123],
  toHaveDurationSatisfying: [(v: number) => assertEquals(v, 123)],
  toHaveDurationNaN: [],
  toHaveDurationGreaterThan: [100],
  toHaveDurationGreaterThanOrEqual: [123],
  toHaveDurationLessThan: [200],
  toHaveDurationLessThanOrEqual: [123],
  toHaveDurationCloseTo: [123, 0],
};

Deno.test("expectSqlQueryResult - method existence check", () => {
  const result = createMockResult();
  const expectation = expectSqlQueryResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof SqlQueryResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on SqlQueryResultExpectation`,
    );
  }

  // Verify count matches (helps catch if we added methods but didn't list them)
  const actualPropertyCount = Object.getOwnPropertyNames(expectation).length;
  assertEquals(
    actualPropertyCount,
    expectedMethodNames.length,
    `Expected ${expectedMethodNames.length} methods but found ${actualPropertyCount}`,
  );
});

// Generate individual test for each method
for (
  const [methodName, args] of Object.entries(EXPECTED_METHODS) as Array<
    [keyof SqlQueryResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup or have empty args (can't test with simple value equality)
  if (
    methodName === "toHaveRowCountNaN" ||
    methodName === "toHaveDurationNaN" ||
    methodName === "toHaveRowsEmpty" ||
    methodName === "toHaveWarningsEmpty" ||
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectSqlQueryResult - ${methodName} - success`, () => {
    const result = createMockResult();
    const expectation = expectSqlQueryResult(result);

    // Call the method with provided arguments
    // deno-lint-ignore no-explicit-any
    const method = expectation[methodName] as (...args: any[]) => any;
    const chainedResult = method.call(expectation, ...args);

    // Verify method returns an expectation object (for chaining)
    assertExists(chainedResult);
    assertExists(
      chainedResult.toBeOk,
      "Result should have toBeOk method for chaining",
    );
  });
}

Deno.test("expectSqlQueryResult - not property - success", () => {
  const result = createMockResult({ ok: false, rowCount: 0 });
  const expectation = expectSqlQueryResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveRowCount(2);
});

Deno.test("expectSqlQueryResult - empty array methods - success", () => {
  // Test empty rows
  const emptyRowsResult = createMockResult({
    rows: [],
    rowCount: 0,
    warnings: [],
  });
  const emptyExpectation = expectSqlQueryResult(emptyRowsResult);

  emptyExpectation.toHaveRowsEmpty();
  emptyExpectation.toHaveWarningsEmpty();

  // Test non-empty (should pass with .not)
  const nonEmptyResult = createMockResult();
  const nonEmptyExpectation = expectSqlQueryResult(nonEmptyResult);

  nonEmptyExpectation.not.toHaveRowsEmpty();
  nonEmptyExpectation.not.toHaveWarningsEmpty();
});
