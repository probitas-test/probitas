import { assertEquals, assertExists } from "@std/assert";
import {
  expectMongoFindResult,
  type MongoFindResultExpectation,
} from "./find.ts";
import { mockMongoFindResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof MongoFindResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Docs (arrays - can't test with strict equality)
  toHaveDocs: [],
  toHaveDocsEqual: [],
  toHaveDocsStrictEqual: [],
  toHaveDocsSatisfying: [],
  toHaveDocsContaining: [],
  toHaveDocsContainingEqual: [],
  toHaveDocsMatching: [],
  toHaveDocsEmpty: [],
  // Docs count
  toHaveDocsCount: [1],
  toHaveDocsCountEqual: [1],
  toHaveDocsCountStrictEqual: [1],
  toHaveDocsCountSatisfying: [(v: number) => assertEquals(v, 1)],
  toHaveDocsCountNaN: [],
  toHaveDocsCountGreaterThan: [0],
  toHaveDocsCountGreaterThanOrEqual: [1],
  toHaveDocsCountLessThan: [2],
  toHaveDocsCountLessThanOrEqual: [1],
  toHaveDocsCountCloseTo: [1, 0],
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

Deno.test("expectMongoFindResult - method existence check", () => {
  const result = mockMongoFindResult();
  const expectation = expectMongoFindResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof MongoFindResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on MongoFindResultExpectation`,
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
    [keyof MongoFindResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup or have empty args (can't test with simple value equality)
  if (
    methodName === "toHaveDocsCountNaN" ||
    methodName === "toHaveDurationNaN" ||
    methodName === "toHaveDocsEmpty" ||
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectMongoFindResult - ${methodName} - success`, () => {
    const result = mockMongoFindResult();
    const expectation = expectMongoFindResult(result);

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

Deno.test("expectMongoFindResult - not property - success", () => {
  const result = mockMongoFindResult({ ok: false });
  const expectation = expectMongoFindResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveDocsCount(0);
});

Deno.test("expectMongoFindResult - empty docs - success", () => {
  const result = mockMongoFindResult({ docs: [] });
  const expectation = expectMongoFindResult(result);

  expectation.toHaveDocsEmpty();
  expectation.toHaveDocsCount(0);
});
