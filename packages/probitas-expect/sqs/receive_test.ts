import { assertEquals, assertExists } from "@std/assert";
import {
  expectSqsReceiveResult,
  type SqsReceiveResultExpectation,
} from "./receive.ts";
import { mockSqsReceiveResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof SqsReceiveResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Messages (arrays - can't test with strict equality)
  toHaveMessages: [],
  toHaveMessagesEqual: [],
  toHaveMessagesStrictEqual: [],
  toHaveMessagesSatisfying: [(v: unknown[]) => assertEquals(v.length, 1)],
  toHaveMessagesContaining: [],
  toHaveMessagesContainingEqual: [],
  toHaveMessagesMatching: [],
  toHaveMessagesEmpty: [],
  // Message Count
  toHaveMessagesCount: [1],
  toHaveMessagesCountEqual: [1],
  toHaveMessagesCountStrictEqual: [1],
  toHaveMessagesCountSatisfying: [(v: number) => assertEquals(v, 1)],
  toHaveMessagesCountNaN: [],
  toHaveMessagesCountGreaterThan: [0],
  toHaveMessagesCountGreaterThanOrEqual: [1],
  toHaveMessagesCountLessThan: [10],
  toHaveMessagesCountLessThanOrEqual: [1],
  toHaveMessagesCountCloseTo: [1, 0],
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

Deno.test("expectSqsReceiveResult - method existence check", () => {
  const result = mockSqsReceiveResult();
  const expectation = expectSqsReceiveResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof SqsReceiveResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on SqsReceiveResultExpectation`,
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
    [keyof SqsReceiveResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup or have empty args (can't test with simple value equality)
  if (
    methodName === "toHaveDurationNaN" ||
    methodName === "toHaveMessagesCountNaN" ||
    methodName === "toHaveMessagesEmpty" ||
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectSqsReceiveResult - ${methodName} - success`, () => {
    const result = mockSqsReceiveResult();
    const expectation = expectSqsReceiveResult(result);

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

Deno.test("expectSqsReceiveResult - not property - success", () => {
  const result = mockSqsReceiveResult({ ok: false });
  const expectation = expectSqsReceiveResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
});

Deno.test("expectSqsReceiveResult - empty messages - success", () => {
  const result = mockSqsReceiveResult({ messages: [] });
  const expectation = expectSqsReceiveResult(result);

  expectation.toHaveMessagesEmpty();
  expectation.toHaveMessagesCount(0);
});

Deno.test("expectSqsReceiveResult - multiple messages - success", () => {
  const result = mockSqsReceiveResult({
    messages: [
      {
        messageId: "m1",
        body: '{"order":"123"}',
        attributes: {},
        receiptHandle: "r1",
        md5OfBody: "md5-1",
      },
      {
        messageId: "m2",
        body: '{"order":"456"}',
        attributes: {},
        receiptHandle: "r2",
        md5OfBody: "md5-2",
      },
    ],
  });
  const expectation = expectSqsReceiveResult(result);

  expectation.toHaveMessagesCount(2);
  expectation.toHaveMessagesCountGreaterThan(1);
  expectation.not.toHaveMessagesEmpty();
});

Deno.test("expectSqsReceiveResult - chaining - success", () => {
  const result = mockSqsReceiveResult();
  const expectation = expectSqsReceiveResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveMessagesCountGreaterThan(0)
    .toHaveDurationLessThan(200);
});
