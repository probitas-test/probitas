import { assertEquals, assertExists } from "@std/assert";
import {
  expectMongoCountResult,
  type MongoCountResultExpectation,
} from "./count.ts";
import { mockMongoCountResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof MongoCountResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Count
  toHaveCount: [10],
  toHaveCountEqual: [10],
  toHaveCountStrictEqual: [10],
  toHaveCountSatisfying: [(v: number) => assertEquals(v, 10)],
  toHaveCountNaN: [],
  toHaveCountGreaterThan: [5],
  toHaveCountGreaterThanOrEqual: [10],
  toHaveCountLessThan: [20],
  toHaveCountLessThanOrEqual: [10],
  toHaveCountCloseTo: [10, 0],
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

Deno.test("expectMongoCountResult - method existence check", () => {
  const result = mockMongoCountResult();
  const expectation = expectMongoCountResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof MongoCountResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on MongoCountResultExpectation`,
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
    [keyof MongoCountResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (NaN values)
  if (methodName === "toHaveCountNaN" || methodName === "toHaveDurationNaN") {
    continue;
  }

  Deno.test(`expectMongoCountResult - ${methodName} - success`, () => {
    const result = mockMongoCountResult();
    const expectation = expectMongoCountResult(result);

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

Deno.test("expectMongoCountResult - not property - success", () => {
  const result = mockMongoCountResult({ ok: false });
  const expectation = expectMongoCountResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveCount(0);
});

Deno.test("expectMongoCountResult - zero count - success", () => {
  const result = mockMongoCountResult({ count: 0 });
  const expectation = expectMongoCountResult(result);

  expectation.toHaveCount(0);
  expectation.toHaveCountLessThan(1);
  expectation.toHaveCountGreaterThanOrEqual(0);
});

Deno.test("expectMongoCountResult - large count - success", () => {
  const result = mockMongoCountResult({ count: 1000000 });
  const expectation = expectMongoCountResult(result);

  expectation.toHaveCount(1000000);
  expectation.toHaveCountGreaterThan(999999);
  expectation.toHaveCountLessThanOrEqual(1000000);
});
