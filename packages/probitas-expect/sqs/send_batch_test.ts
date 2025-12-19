import { assertEquals, assertExists } from "@std/assert";
import {
  expectSqsSendBatchResult,
  type SqsSendBatchResultExpectation,
} from "./send_batch.ts";
import { mockSqsSendBatchResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof SqsSendBatchResultExpectation, unknown[]> =
  {
    // Core (special property, not a method)
    not: [],
    // Ok
    toBeOk: [],
    // Successful messages (arrays - can't test with strict equality)
    toHaveSuccessful: [],
    toHaveSuccessfulEqual: [],
    toHaveSuccessfulStrictEqual: [],
    toHaveSuccessfulSatisfying: [
      (v: unknown[]) => assertEquals(v.length, 1),
    ],
    toHaveSuccessfulContaining: [],
    toHaveSuccessfulContainingEqual: [],
    toHaveSuccessfulMatching: [],
    toHaveSuccessfulEmpty: [],
    toHaveSuccessfulCount: [1],
    toHaveSuccessfulCountEqual: [1],
    toHaveSuccessfulCountStrictEqual: [1],
    toHaveSuccessfulCountSatisfying: [(v: number) => assertEquals(v, 1)],
    toHaveSuccessfulCountNaN: [],
    toHaveSuccessfulCountGreaterThan: [0],
    toHaveSuccessfulCountGreaterThanOrEqual: [1],
    toHaveSuccessfulCountLessThan: [2],
    toHaveSuccessfulCountLessThanOrEqual: [1],
    toHaveSuccessfulCountCloseTo: [1, 0],
    // Failed messages (arrays - can't test with strict equality)
    toHaveFailed: [],
    toHaveFailedEqual: [],
    toHaveFailedStrictEqual: [],
    toHaveFailedSatisfying: [
      (v: unknown[]) => assertEquals(v.length, 0),
    ],
    toHaveFailedContaining: [],
    toHaveFailedContainingEqual: [],
    toHaveFailedMatching: [],
    toHaveFailedEmpty: [],
    toHaveFailedCount: [0],
    toHaveFailedCountEqual: [0],
    toHaveFailedCountStrictEqual: [0],
    toHaveFailedCountSatisfying: [(v: number) => assertEquals(v, 0)],
    toHaveFailedCountNaN: [],
    toHaveFailedCountGreaterThan: [-1],
    toHaveFailedCountGreaterThanOrEqual: [0],
    toHaveFailedCountLessThan: [1],
    toHaveFailedCountLessThanOrEqual: [0],
    toHaveFailedCountCloseTo: [0, 0],
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

Deno.test("expectSqsSendBatchResult - method existence check", () => {
  const result = mockSqsSendBatchResult();
  const expectation = expectSqsSendBatchResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof SqsSendBatchResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on SqsSendBatchResultExpectation`,
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
    [keyof SqsSendBatchResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup or have empty args (can't test with simple value equality)
  if (
    methodName === "toHaveDurationNaN" ||
    methodName === "toHaveSuccessfulEmpty" ||
    methodName === "toHaveFailedEmpty" ||
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectSqsSendBatchResult - ${methodName} - success`, () => {
    const result = mockSqsSendBatchResult();
    const expectation = expectSqsSendBatchResult(result);

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

Deno.test("expectSqsSendBatchResult - not property - success", () => {
  const result = mockSqsSendBatchResult({ ok: false });
  const expectation = expectSqsSendBatchResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
});

Deno.test("expectSqsSendBatchResult - empty arrays - success", () => {
  const result = mockSqsSendBatchResult({
    successful: [],
    failed: [],
  });
  const expectation = expectSqsSendBatchResult(result);

  expectation.toHaveSuccessfulEmpty();
  expectation.toHaveFailedEmpty();
});

Deno.test("expectSqsSendBatchResult - failed messages - success", () => {
  const result = mockSqsSendBatchResult({
    successful: [],
    failed: [{
      id: "fail-1",
      code: "Error",
      message: "err",
    }],
  });
  const expectation = expectSqsSendBatchResult(result);

  expectation.toHaveSuccessfulEmpty();
  expectation.not.toHaveFailedEmpty();
});

Deno.test("expectSqsSendBatchResult - chaining - success", () => {
  const result = mockSqsSendBatchResult();
  const expectation = expectSqsSendBatchResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveFailedEmpty()
    .toHaveDurationLessThan(200);
});
