import { assertEquals, assertExists } from "@std/assert";
import {
  expectRabbitMqConsumeResult,
  type RabbitMqConsumeResultExpectation,
} from "./consume.ts";
import { mockRabbitMqConsumeResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<
  keyof RabbitMqConsumeResultExpectation,
  unknown[]
> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Message
  toHaveMessage: [],
  toHaveMessageEqual: [],
  toHaveMessageStrictEqual: [],
  toHaveMessageSatisfying: [(v: unknown) => assertExists(v)],
  toHaveMessagePresent: [],
  toHaveMessageNull: [],
  toHaveMessageUndefined: [],
  toHaveMessageNullish: [],
  toHaveMessageMatching: [{
    content: new TextEncoder().encode("test message"),
  }],
  toHaveMessageProperty: ["content"],
  toHaveMessagePropertyContaining: [],
  toHaveMessagePropertyMatching: [],
  toHaveMessagePropertySatisfying: [
    "content",
    (v: unknown) => assertExists(v),
  ],
  // Content
  toHaveContent: [],
  toHaveContentEqual: [],
  toHaveContentStrictEqual: [],
  toHaveContentSatisfying: [(v: unknown) => assertExists(v)],
  toHaveContentPresent: [],
  toHaveContentNull: [],
  toHaveContentUndefined: [],
  toHaveContentNullish: [],
  // Content length
  toHaveContentLength: [12],
  toHaveContentLengthEqual: [12],
  toHaveContentLengthStrictEqual: [12],
  toHaveContentLengthSatisfying: [(v: number) => assertEquals(v, 12)],
  toHaveContentLengthNaN: [],
  toHaveContentLengthGreaterThan: [5],
  toHaveContentLengthGreaterThanOrEqual: [12],
  toHaveContentLengthLessThan: [100],
  toHaveContentLengthLessThanOrEqual: [12],
  toHaveContentLengthCloseTo: [12, 0],
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

Deno.test("expectRabbitMqConsumeResult - method existence check", () => {
  const result = mockRabbitMqConsumeResult();
  const expectation = expectRabbitMqConsumeResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof RabbitMqConsumeResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on RabbitMqConsumeResultExpectation`,
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
    [keyof RabbitMqConsumeResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (null/undefined/nullish values, NaN)
  if (
    methodName === "toHaveMessageNull" ||
    methodName === "toHaveMessageUndefined" ||
    methodName === "toHaveMessageNullish" ||
    methodName === "toHaveContentLengthNaN" ||
    methodName === "toHaveDurationNaN" ||
    // Skip methods with empty args (need special handling like null headers)
    (args.length === 0 && methodName !== "toBeOk" &&
      methodName !== "toHaveMessagePresent")
  ) {
    continue;
  }

  Deno.test(`expectRabbitMqConsumeResult - ${methodName} - success`, () => {
    const result = mockRabbitMqConsumeResult();
    const expectation = expectRabbitMqConsumeResult(result);

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

Deno.test("expectRabbitMqConsumeResult - not property - success", () => {
  const result = mockRabbitMqConsumeResult({ ok: false });
  const expectation = expectRabbitMqConsumeResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveDuration(200);
});

Deno.test("expectRabbitMqConsumeResult - nullish message methods - success", () => {
  // Test null message
  const nullResult = mockRabbitMqConsumeResult({
    message: null,
  });
  const nullExpectation = expectRabbitMqConsumeResult(nullResult);

  nullExpectation.toHaveMessageNull();
  nullExpectation.toHaveMessageNullish();

  // Test present message
  const presentResult = mockRabbitMqConsumeResult();
  const presentExpectation = expectRabbitMqConsumeResult(presentResult);

  presentExpectation.toHaveMessagePresent();
});

Deno.test("expectRabbitMqConsumeResult - chaining - success", () => {
  const result = mockRabbitMqConsumeResult();
  const expectation = expectRabbitMqConsumeResult(result);

  // Chain multiple assertions
  expectation
    .toBeOk()
    .toHaveMessagePresent()
    .toHaveDurationGreaterThan(50)
    .toHaveDurationLessThan(200);
});
