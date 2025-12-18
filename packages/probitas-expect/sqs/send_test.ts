import { assertEquals, assertExists } from "@std/assert";
import { expectSqsSendResult, type SqsSendResultExpectation } from "./send.ts";
import { mockSqsSendResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof SqsSendResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Message ID
  toHaveMessageId: ["msg-123"],
  toHaveMessageIdEqual: ["msg-123"],
  toHaveMessageIdStrictEqual: ["msg-123"],
  toHaveMessageIdSatisfying: [(v: string) => assertEquals(v, "msg-123")],
  toHaveMessageIdContaining: ["msg"],
  toHaveMessageIdMatching: [/msg-\d+/],
  // MD5 of Body
  toHaveMd5OfBody: ["md5hash"],
  toHaveMd5OfBodyEqual: ["md5hash"],
  toHaveMd5OfBodyStrictEqual: ["md5hash"],
  toHaveMd5OfBodySatisfying: [
    (v: string) => assertEquals(v, "md5hash"),
  ],
  toHaveMd5OfBodyContaining: ["md5"],
  toHaveMd5OfBodyMatching: [/md5hash/],
  // Sequence Number
  toHaveSequenceNumber: ["seq-1"],
  toHaveSequenceNumberEqual: ["seq-1"],
  toHaveSequenceNumberStrictEqual: ["seq-1"],
  toHaveSequenceNumberSatisfying: [(v: string) => assertEquals(v, "seq-1")],
  toHaveSequenceNumberContaining: ["seq"],
  toHaveSequenceNumberMatching: [/seq-\d+/],
  toHaveSequenceNumberPresent: [],
  toHaveSequenceNumberNull: [],
  toHaveSequenceNumberUndefined: [],
  toHaveSequenceNumberNullish: [],
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

Deno.test("expectSqsSendResult - method existence check", () => {
  const result = mockSqsSendResult();
  const expectation = expectSqsSendResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof SqsSendResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on SqsSendResultExpectation`,
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
    [keyof SqsSendResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (NaN values, sequence number)
  if (
    methodName === "toHaveDurationNaN" ||
    methodName === "toHaveSequenceNumber" ||
    methodName === "toHaveSequenceNumberEqual" ||
    methodName === "toHaveSequenceNumberStrictEqual" ||
    methodName === "toHaveSequenceNumberSatisfying" ||
    methodName === "toHaveSequenceNumberContaining" ||
    methodName === "toHaveSequenceNumberMatching" ||
    methodName === "toHaveSequenceNumberPresent" ||
    methodName === "toHaveSequenceNumberNull"
  ) {
    continue;
  }

  Deno.test(`expectSqsSendResult - ${methodName} - success`, () => {
    const result = mockSqsSendResult();
    const expectation = expectSqsSendResult(result);

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

Deno.test("expectSqsSendResult - not property - success", () => {
  const result = mockSqsSendResult({ ok: false });
  const expectation = expectSqsSendResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveMessageId("wrong-id");
});

Deno.test("expectSqsSendResult - sequence number methods - success", () => {
  // Test with sequence number present
  const result = mockSqsSendResult({ sequenceNumber: "seq-1" });
  const expectation = expectSqsSendResult(result);

  expectation.toHaveSequenceNumber("seq-1");
  expectation.toHaveSequenceNumberEqual("seq-1");
  expectation.toHaveSequenceNumberStrictEqual("seq-1");
  expectation.toHaveSequenceNumberContaining("seq");
  expectation.toHaveSequenceNumberMatching(/seq-\d+/);
  expectation.toHaveSequenceNumberSatisfying((v: string) =>
    assertEquals(v, "seq-1")
  );
  expectation.toHaveSequenceNumberPresent();
  expectation.not.toHaveSequenceNumberNull();
  expectation.not.toHaveSequenceNumberUndefined();
  expectation.not.toHaveSequenceNumberNullish();
});

Deno.test("expectSqsSendResult - sequence number nullish methods - success", () => {
  // Test with sequence number undefined
  const result = mockSqsSendResult({ sequenceNumber: undefined });
  const expectation = expectSqsSendResult(result);

  expectation.toHaveSequenceNumberUndefined();
  expectation.toHaveSequenceNumberNullish();
  expectation.not.toHaveSequenceNumberPresent();
  expectation.not.toHaveSequenceNumberNull();
});

Deno.test("expectSqsSendResult - chaining - success", () => {
  const result = mockSqsSendResult();
  const expectation = expectSqsSendResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveMessageId("msg-123")
    .toHaveDurationLessThan(200);
});
