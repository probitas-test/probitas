import { assertEquals, assertExists } from "@std/assert";
import {
  type DenoKvListResultExpectation,
  expectDenoKvListResult,
} from "./list.ts";
import { mockDenoKvListResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof DenoKvListResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Entries (enhanced arrays with helper methods - can't test with strict equality)
  toHaveEntries: [],
  toHaveEntriesEqual: [],
  toHaveEntriesStrictEqual: [],
  toHaveEntriesSatisfying: [
    (v: unknown[]) => assertEquals(v.length, 1),
  ],
  toHaveEntriesContaining: [],
  toHaveEntriesContainingEqual: [],
  toHaveEntriesMatching: [],
  toHaveEntriesEmpty: [],
  // Entry Count
  toHaveEntryCount: [1],
  toHaveEntryCountEqual: [1],
  toHaveEntryCountStrictEqual: [1],
  toHaveEntryCountSatisfying: [(v: number) => assertEquals(v, 1)],
  toHaveEntryCountNaN: [],
  toHaveEntryCountGreaterThan: [0],
  toHaveEntryCountGreaterThanOrEqual: [1],
  toHaveEntryCountLessThan: [10],
  toHaveEntryCountLessThanOrEqual: [1],
  toHaveEntryCountCloseTo: [1, 0],
  // Duration
  toHaveDuration: [100],
  toHaveDurationEqual: [100],
  toHaveDurationStrictEqual: [100],
  toHaveDurationSatisfying: [(v: number) => assertEquals(v, 100)],
  toHaveDurationNaN: [],
  toHaveDurationGreaterThan: [50],
  toHaveDurationGreaterThanOrEqual: [100],
  toHaveDurationLessThan: [200],
  toHaveDurationLessThanOrEqual: [100],
  toHaveDurationCloseTo: [100, 0],
};

Deno.test("expectDenoKvListResult - method existence check", () => {
  const result = mockDenoKvListResult();
  const expectation = expectDenoKvListResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof DenoKvListResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on DenoKvListResultExpectation`,
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
    [keyof DenoKvListResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (empty entries, NaN)
  if (
    methodName === "toHaveEntriesEmpty" ||
    methodName === "toHaveDurationNaN" ||
    methodName === "toHaveEntryCountNaN" ||
    // Skip methods with empty args (need special handling)
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectDenoKvListResult - ${methodName} - success`, () => {
    const result = mockDenoKvListResult();
    const expectation = expectDenoKvListResult(result);

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

Deno.test("expectDenoKvListResult - not property - success", () => {
  const result = mockDenoKvListResult({ ok: false });
  const expectation = expectDenoKvListResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveEntryCount(100);
});

Deno.test("expectDenoKvListResult - empty entries methods - success", () => {
  const emptyResult = mockDenoKvListResult({ entries: [] });
  const emptyExpectation = expectDenoKvListResult(emptyResult);

  emptyExpectation.toHaveEntriesEmpty();
  emptyExpectation.toHaveEntryCount(0);
});

Deno.test("expectDenoKvListResult - method chaining - success", () => {
  const result = mockDenoKvListResult();
  const expectation = expectDenoKvListResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveEntryCount(1)
    .toHaveEntriesContainingEqual({
      key: ["users", "1"],
      value: { name: "Alice" },
      versionstamp: "v1",
    })
    .toHaveDuration(100);
});

Deno.test("expectDenoKvListResult - multiple entries - success", () => {
  const result = mockDenoKvListResult({
    entries: [
      { key: ["users", "1"], value: { name: "Alice" }, versionstamp: "v1" },
      { key: ["users", "2"], value: { name: "Bob" }, versionstamp: "v2" },
      { key: ["users", "3"], value: { name: "Charlie" }, versionstamp: "v3" },
    ],
  });
  const expectation = expectDenoKvListResult(result);

  expectation
    .toBeOk()
    .toHaveEntryCount(3)
    .toHaveEntryCountGreaterThan(2)
    .toHaveEntryCountLessThanOrEqual(3);
});
