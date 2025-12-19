import { assertEquals, assertExists } from "@std/assert";
import {
  expectMongoInsertOneResult,
  type MongoInsertOneResultExpectation,
} from "./insert_one.ts";
import { mockMongoInsertOneResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<
  keyof MongoInsertOneResultExpectation,
  unknown[]
> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Inserted ID
  toHaveInsertedId: ["123"],
  toHaveInsertedIdEqual: ["123"],
  toHaveInsertedIdStrictEqual: ["123"],
  toHaveInsertedIdSatisfying: [(v: string) => assertEquals(v, "123")],
  toHaveInsertedIdContaining: ["12"],
  toHaveInsertedIdMatching: [/^\d+$/],
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

Deno.test("expectMongoInsertOneResult - method existence check", () => {
  const result = mockMongoInsertOneResult();
  const expectation = expectMongoInsertOneResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof MongoInsertOneResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on MongoInsertOneResultExpectation`,
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
    [keyof MongoInsertOneResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (NaN values)
  if (methodName === "toHaveDurationNaN") {
    continue;
  }

  Deno.test(`expectMongoInsertOneResult - ${methodName} - success`, () => {
    const result = mockMongoInsertOneResult();
    const expectation = expectMongoInsertOneResult(result);

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

Deno.test("expectMongoInsertOneResult - not property - success", () => {
  const result = mockMongoInsertOneResult({ ok: false });
  const expectation = expectMongoInsertOneResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveInsertedId("456");
});

Deno.test("expectMongoInsertOneResult - custom inserted ID - success", () => {
  const result = mockMongoInsertOneResult({
    insertedId: "custom-uuid-12345",
  });
  const expectation = expectMongoInsertOneResult(result);

  expectation.toHaveInsertedId("custom-uuid-12345");
  expectation.toHaveInsertedIdContaining("uuid");
  expectation.toHaveInsertedIdMatching(/^custom-uuid-\d+$/);
});
