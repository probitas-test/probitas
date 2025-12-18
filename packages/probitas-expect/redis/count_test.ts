import { assertEquals, assertExists } from "@std/assert";
import {
  expectRedisCountResult,
  type RedisCountResultExpectation,
} from "./count.ts";
import { mockRedisCountResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof RedisCountResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Value
  toHaveValue: [5],
  toHaveValueEqual: [5],
  toHaveValueStrictEqual: [5],
  toHaveValueSatisfying: [(v: number) => assertEquals(v, 5)],
  toHaveValueNaN: [],
  toHaveValueGreaterThan: [4],
  toHaveValueGreaterThanOrEqual: [5],
  toHaveValueLessThan: [6],
  toHaveValueLessThanOrEqual: [5],
  toHaveValueCloseTo: [5, 0],
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

Deno.test("expectRedisCountResult - method existence check", () => {
  const result = mockRedisCountResult();
  const expectation = expectRedisCountResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof RedisCountResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on RedisCountResultExpectation`,
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
    [keyof RedisCountResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (NaN values)
  if (methodName === "toHaveValueNaN" || methodName === "toHaveDurationNaN") {
    continue;
  }

  Deno.test(`expectRedisCountResult - ${methodName} - success`, () => {
    const result = mockRedisCountResult();
    const expectation = expectRedisCountResult(result);

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

Deno.test("expectRedisCountResult - not property - success", () => {
  // Note: When ok: false, value must be null per discriminated union
  const result = mockRedisCountResult({ ok: false, value: null });
  const expectation = expectRedisCountResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
});

Deno.test("expectRedisCountResult - NaN value methods - success", () => {
  // Test NaN values
  const nanResult = mockRedisCountResult({
    value: NaN,
    duration: NaN,
  });
  const nanExpectation = expectRedisCountResult(nanResult);

  nanExpectation.toHaveValueNaN();
  nanExpectation.toHaveDurationNaN();
});

Deno.test("expectRedisCountResult - chaining - success", () => {
  const result = mockRedisCountResult();
  const expectation = expectRedisCountResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveValue(5)
    .toHaveValueGreaterThan(4)
    .toHaveDuration(100)
    .toHaveDurationLessThan(200);
});
