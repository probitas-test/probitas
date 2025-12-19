import { assertEquals, assertExists } from "@std/assert";
import {
  expectRabbitMqPublishResult,
  type RabbitMqPublishResultExpectation,
} from "./publish.ts";
import { mockRabbitMqPublishResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<
  keyof RabbitMqPublishResultExpectation,
  unknown[]
> = {
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

Deno.test("expectRabbitMqPublishResult - method existence check", () => {
  const result = mockRabbitMqPublishResult();
  const expectation = expectRabbitMqPublishResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof RabbitMqPublishResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on RabbitMqPublishResultExpectation`,
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
    [keyof RabbitMqPublishResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip NaN test (needs special value)
  if (methodName === "toHaveDurationNaN") continue;

  Deno.test(`expectRabbitMqPublishResult - ${methodName} - success`, () => {
    const result = mockRabbitMqPublishResult();
    const expectation = expectRabbitMqPublishResult(result);

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

Deno.test("expectRabbitMqPublishResult - not property - success", () => {
  const result = mockRabbitMqPublishResult({ ok: false });
  const expectation = expectRabbitMqPublishResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveDuration(200);
});

Deno.test("expectRabbitMqPublishResult - chaining - success", () => {
  const result = mockRabbitMqPublishResult({ duration: 150 });
  const expectation = expectRabbitMqPublishResult(result);

  // Chain multiple assertions
  expectation
    .toBeOk()
    .toHaveDuration(150)
    .toHaveDurationGreaterThan(100)
    .toHaveDurationLessThan(200);
});
