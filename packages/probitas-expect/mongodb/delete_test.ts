import { assertEquals, assertExists } from "@std/assert";
import {
  expectMongoDeleteResult,
  type MongoDeleteResultExpectation,
} from "./delete.ts";
import { mockMongoDeleteResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof MongoDeleteResultExpectation, unknown[]> =
  {
    // Core (special property, not a method)
    not: [],
    // Ok
    toBeOk: [],
    // Deleted count
    toHaveDeletedCount: [1],
    toHaveDeletedCountEqual: [1],
    toHaveDeletedCountStrictEqual: [1],
    toHaveDeletedCountSatisfying: [(v: number) => assertEquals(v, 1)],
    toHaveDeletedCountNaN: [],
    toHaveDeletedCountGreaterThan: [0],
    toHaveDeletedCountGreaterThanOrEqual: [1],
    toHaveDeletedCountLessThan: [2],
    toHaveDeletedCountLessThanOrEqual: [1],
    toHaveDeletedCountCloseTo: [1, 0],
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

Deno.test("expectMongoDeleteResult - method existence check", () => {
  const result = mockMongoDeleteResult();
  const expectation = expectMongoDeleteResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof MongoDeleteResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on MongoDeleteResultExpectation`,
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
    [keyof MongoDeleteResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (NaN values)
  if (
    methodName === "toHaveDeletedCountNaN" ||
    methodName === "toHaveDurationNaN"
  ) {
    continue;
  }

  Deno.test(`expectMongoDeleteResult - ${methodName} - success`, () => {
    const result = mockMongoDeleteResult();
    const expectation = expectMongoDeleteResult(result);

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

Deno.test("expectMongoDeleteResult - not property - success", () => {
  const result = mockMongoDeleteResult({ ok: false });
  const expectation = expectMongoDeleteResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveDeletedCount(0);
});

Deno.test("expectMongoDeleteResult - no documents deleted - success", () => {
  const result = mockMongoDeleteResult({ deletedCount: 0 });
  const expectation = expectMongoDeleteResult(result);

  expectation.toHaveDeletedCount(0);
  expectation.toHaveDeletedCountLessThan(1);
});

Deno.test("expectMongoDeleteResult - multiple documents deleted - success", () => {
  const result = mockMongoDeleteResult({ deletedCount: 10 });
  const expectation = expectMongoDeleteResult(result);

  expectation.toHaveDeletedCount(10);
  expectation.toHaveDeletedCountGreaterThan(5);
  expectation.toHaveDeletedCountGreaterThanOrEqual(10);
  expectation.toHaveDeletedCountLessThan(20);
});
