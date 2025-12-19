import { assertEquals, assertExists } from "@std/assert";
import {
  expectSqsEnsureQueueResult,
  type SqsEnsureQueueResultExpectation,
} from "./ensure_queue.ts";
import { mockSqsEnsureQueueResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<
  keyof SqsEnsureQueueResultExpectation,
  unknown[]
> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Queue URL
  toHaveQueueUrl: ["https://sqs.us-east-1.amazonaws.com/123456/test-queue"],
  toHaveQueueUrlEqual: [
    "https://sqs.us-east-1.amazonaws.com/123456/test-queue",
  ],
  toHaveQueueUrlStrictEqual: [
    "https://sqs.us-east-1.amazonaws.com/123456/test-queue",
  ],
  toHaveQueueUrlSatisfying: [
    (v: string) =>
      assertEquals(v, "https://sqs.us-east-1.amazonaws.com/123456/test-queue"),
  ],
  toHaveQueueUrlContaining: ["test-queue"],
  toHaveQueueUrlMatching: [/test-queue/],
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

Deno.test("expectSqsEnsureQueueResult - method existence check", () => {
  const result = mockSqsEnsureQueueResult();
  const expectation = expectSqsEnsureQueueResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof SqsEnsureQueueResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on SqsEnsureQueueResultExpectation`,
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
    [keyof SqsEnsureQueueResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (NaN)
  if (methodName === "toHaveDurationNaN") {
    continue;
  }

  Deno.test(`expectSqsEnsureQueueResult - ${methodName} - success`, () => {
    const result = mockSqsEnsureQueueResult();
    const expectation = expectSqsEnsureQueueResult(result);

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

Deno.test("expectSqsEnsureQueueResult - not property - success", () => {
  const result = mockSqsEnsureQueueResult({ ok: false });
  const expectation = expectSqsEnsureQueueResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveQueueUrl("wrong-url");
});

Deno.test("expectSqsEnsureQueueResult - queue url validation - success", () => {
  const result = mockSqsEnsureQueueResult({
    queueUrl: "https://sqs.eu-west-1.amazonaws.com/789/my-queue",
  });
  const expectation = expectSqsEnsureQueueResult(result);

  expectation.toHaveQueueUrlContaining("eu-west-1");
  expectation.toHaveQueueUrlContaining("my-queue");
  expectation.toHaveQueueUrlMatching(/sqs\..*\.amazonaws\.com/);
});

Deno.test("expectSqsEnsureQueueResult - chaining - success", () => {
  const result = mockSqsEnsureQueueResult();
  const expectation = expectSqsEnsureQueueResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveQueueUrlContaining("test-queue")
    .toHaveDurationLessThan(200);
});
