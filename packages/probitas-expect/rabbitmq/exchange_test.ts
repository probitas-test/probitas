import { assertEquals, assertExists } from "@std/assert";
import {
  expectRabbitMqExchangeResult,
  type RabbitMqExchangeResultExpectation,
} from "./exchange.ts";
import { mockRabbitMqExchangeResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<
  keyof RabbitMqExchangeResultExpectation,
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

Deno.test("expectRabbitMqExchangeResult - method existence check", () => {
  const result = mockRabbitMqExchangeResult();
  const expectation = expectRabbitMqExchangeResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof RabbitMqExchangeResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on RabbitMqExchangeResultExpectation`,
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
    [keyof RabbitMqExchangeResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip NaN test (needs special value)
  if (methodName === "toHaveDurationNaN") continue;

  Deno.test(`expectRabbitMqExchangeResult - ${methodName} - success`, () => {
    const result = mockRabbitMqExchangeResult();
    const expectation = expectRabbitMqExchangeResult(result);

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

Deno.test("expectRabbitMqExchangeResult - not property - success", () => {
  const result = mockRabbitMqExchangeResult({ ok: false });
  const expectation = expectRabbitMqExchangeResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveDuration(200);
});

Deno.test("expectRabbitMqExchangeResult - chaining - success", () => {
  const result = mockRabbitMqExchangeResult({ duration: 150 });
  const expectation = expectRabbitMqExchangeResult(result);

  // Chain multiple assertions
  expectation
    .toBeOk()
    .toHaveDuration(150)
    .toHaveDurationGreaterThan(100)
    .toHaveDurationLessThan(200);
});
