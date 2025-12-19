import { assertEquals, assertExists } from "@std/assert";
import {
  expectMongoInsertManyResult,
  type MongoInsertManyResultExpectation,
} from "./insert_many.ts";
import { mockMongoInsertManyResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<
  keyof MongoInsertManyResultExpectation,
  unknown[]
> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Inserted IDs
  toHaveInsertedIds: [],
  toHaveInsertedIdsEqual: [],
  toHaveInsertedIdsStrictEqual: [],
  toHaveInsertedIdsSatisfying: [
    (v: string[]) => assertEquals(v, ["123", "456", "789"]),
  ],
  toHaveInsertedIdsContaining: [],
  toHaveInsertedIdsContainingEqual: [],
  toHaveInsertedIdsMatching: [],
  toHaveInsertedIdsEmpty: [],
  // Inserted count
  toHaveInsertedCount: [3],
  toHaveInsertedCountEqual: [3],
  toHaveInsertedCountStrictEqual: [3],
  toHaveInsertedCountSatisfying: [(v: number) => assertEquals(v, 3)],
  toHaveInsertedCountNaN: [],
  toHaveInsertedCountGreaterThan: [2],
  toHaveInsertedCountGreaterThanOrEqual: [3],
  toHaveInsertedCountLessThan: [5],
  toHaveInsertedCountLessThanOrEqual: [3],
  toHaveInsertedCountCloseTo: [3, 0],
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

Deno.test("expectMongoInsertManyResult - method existence check", () => {
  const result = mockMongoInsertManyResult();
  const expectation = expectMongoInsertManyResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof MongoInsertManyResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on MongoInsertManyResultExpectation`,
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
    [keyof MongoInsertManyResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup or have empty args
  if (
    methodName === "toHaveInsertedCountNaN" ||
    methodName === "toHaveDurationNaN" ||
    methodName === "toHaveInsertedIdsEmpty" ||
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectMongoInsertManyResult - ${methodName} - success`, () => {
    const result = mockMongoInsertManyResult();
    const expectation = expectMongoInsertManyResult(result);

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

Deno.test("expectMongoInsertManyResult - not property - success", () => {
  const result = mockMongoInsertManyResult({ ok: false });
  const expectation = expectMongoInsertManyResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveInsertedCount(0);
});

Deno.test("expectMongoInsertManyResult - empty inserted IDs - success", () => {
  const result = mockMongoInsertManyResult({
    insertedIds: [],
    insertedCount: 0,
  });
  const expectation = expectMongoInsertManyResult(result);

  expectation.toHaveInsertedIdsEmpty();
  expectation.toHaveInsertedCount(0);
});

Deno.test("expectMongoInsertManyResult - single insert - success", () => {
  const result = mockMongoInsertManyResult({
    insertedIds: ["single-id"],
    insertedCount: 1,
  });
  const expectation = expectMongoInsertManyResult(result);

  expectation.toHaveInsertedCount(1);
  expectation.toHaveInsertedIdsContaining("single-id");
});
