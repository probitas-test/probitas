import { assertEquals, assertExists } from "@std/assert";
import { expectRedisGetResult, type RedisGetResultExpectation } from "./get.ts";
import { mockRedisGetResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof RedisGetResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Value
  toHaveValue: ["test-value"],
  toHaveValueEqual: ["test-value"],
  toHaveValueStrictEqual: ["test-value"],
  toHaveValueSatisfying: [(v: string) => assertEquals(v, "test-value")],
  toHaveValueContaining: ["test"],
  toHaveValueMatching: [/test/],
  toHaveValuePresent: [],
  toHaveValueNull: [],
  toHaveValueUndefined: [],
  toHaveValueNullish: [],
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

Deno.test("expectRedisGetResult - method existence check", () => {
  const result = mockRedisGetResult();
  const expectation = expectRedisGetResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof RedisGetResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on RedisGetResultExpectation`,
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
    [keyof RedisGetResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (NaN values, null/undefined values)
  if (
    methodName === "toHaveDurationNaN" ||
    methodName === "toHaveValueNull" ||
    methodName === "toHaveValueUndefined" ||
    methodName === "toHaveValueNullish"
  ) {
    continue;
  }

  Deno.test(`expectRedisGetResult - ${methodName} - success`, () => {
    const result = mockRedisGetResult();
    const expectation = expectRedisGetResult(result);

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

Deno.test("expectRedisGetResult - not property - success", () => {
  // Note: When ok: false, value must be null per discriminated union
  const result = mockRedisGetResult({ ok: false, value: null });
  const expectation = expectRedisGetResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
});

Deno.test("expectRedisGetResult - NaN duration methods - success", () => {
  // Test NaN values
  const nanResult = mockRedisGetResult({
    duration: NaN,
  });
  const nanExpectation = expectRedisGetResult(nanResult);

  nanExpectation.toHaveDurationNaN();
});

Deno.test("expectRedisGetResult - chaining - success", () => {
  const result = mockRedisGetResult();
  const expectation = expectRedisGetResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveValue("test-value")
    .toHaveValueContaining("test")
    .toHaveValueMatching(/value/)
    .toHaveDuration(100)
    .toHaveDurationLessThan(200);
});

Deno.test("expectRedisGetResult - null value - success", () => {
  const result = mockRedisGetResult({ value: null });
  const expectation = expectRedisGetResult(result);

  expectation.toBeOk();
  expectation.toHaveValue(null);
});
