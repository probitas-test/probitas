import { assertEquals, assertExists } from "@std/assert";
import {
  expectSqsDeleteResult,
  type SqsDeleteResultExpectation,
} from "./delete.ts";
import { mockSqsDeleteResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof SqsDeleteResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
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

Deno.test("expectSqsDeleteResult - method existence check", () => {
  const result = mockSqsDeleteResult();
  const expectation = expectSqsDeleteResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof SqsDeleteResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on SqsDeleteResultExpectation`,
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
    [keyof SqsDeleteResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (NaN)
  if (methodName === "toHaveDurationNaN") {
    continue;
  }

  Deno.test(`expectSqsDeleteResult - ${methodName} - success`, () => {
    const result = mockSqsDeleteResult();
    const expectation = expectSqsDeleteResult(result);

    // Call the method with provided arguments
    // deno-lint-ignore no-explicit-any
    const method = expectation[methodName] as (...args: any[]) => any;
    const returnValue = method.call(expectation, ...args);

    // Verify method returns an expectation object (for chaining)
    assertExists(returnValue);
    assertExists(
      returnValue.toBeOk,
      "Result should have toBeOk method for chaining",
    );
  });
}

Deno.test("expectSqsDeleteResult - not property - success", () => {
  const result = mockSqsDeleteResult({ ok: false });
  const expectation = expectSqsDeleteResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
});

Deno.test("expectSqsDeleteResult - chaining - success", () => {
  const result = mockSqsDeleteResult();
  const expectation = expectSqsDeleteResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveDuration(100)
    .toHaveDurationLessThan(200);
});
