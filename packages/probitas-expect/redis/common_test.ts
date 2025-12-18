import { assertEquals, assertExists } from "@std/assert";
import {
  expectRedisCommonResult,
  type RedisCommonResultExpectation,
} from "./common.ts";
import { mockRedisCommonResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof RedisCommonResultExpectation, unknown[]> =
  {
    // Core (special property, not a method)
    not: [],
    // Ok
    toBeOk: [],
    // Value
    toHaveValue: ["test-value"],
    toHaveValueEqual: ["test-value"],
    toHaveValueStrictEqual: ["test-value"],
    toHaveValueSatisfying: [(v: unknown) => assertEquals(v, "test-value")],
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

Deno.test("expectRedisCommonResult - method existence check", () => {
  const result = mockRedisCommonResult<string>({ value: "test-value" });
  const expectation = expectRedisCommonResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof RedisCommonResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on RedisCommonResultExpectation`,
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
    [keyof RedisCommonResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup or have empty args
  if (
    methodName === "toHaveDurationNaN" ||
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectRedisCommonResult - ${methodName} - success`, () => {
    const result = mockRedisCommonResult<string>({ value: "test-value" });
    const expectation = expectRedisCommonResult(result);

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

Deno.test("expectRedisCommonResult - not property - success", () => {
  // Note: When ok: false, value must be null per discriminated union
  const result = mockRedisCommonResult<string>({ ok: false, value: null });
  const expectation = expectRedisCommonResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
});

Deno.test("expectRedisCommonResult - NaN duration methods - success", () => {
  // Test NaN values
  const nanResult = mockRedisCommonResult<string>({
    value: "test",
    duration: NaN,
  });
  const nanExpectation = expectRedisCommonResult(nanResult);

  nanExpectation.toHaveDurationNaN();
});

Deno.test("expectRedisCommonResult - chaining - success", () => {
  const result = mockRedisCommonResult<string>({ value: "test-value" });
  const expectation = expectRedisCommonResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveValue("test-value")
    .toHaveDuration(100)
    .toHaveDurationLessThan(200);
});

Deno.test("expectRedisCommonResult - null value - success", () => {
  const result = mockRedisCommonResult<null>({ value: null });
  const expectation = expectRedisCommonResult(result);

  expectation.toBeOk();
  expectation.toHaveValue(null);
});

Deno.test("expectRedisCommonResult - object value - success", () => {
  const result = mockRedisCommonResult<{ id: number; name: string }>({
    value: { id: 1, name: "test" },
  });
  const expectation = expectRedisCommonResult(result);

  expectation.toBeOk();
});

Deno.test("expectRedisCommonResult - numeric value - success", () => {
  const result = mockRedisCommonResult<number>({ value: 42 });
  const expectation = expectRedisCommonResult(result);

  expectation.toBeOk();
  expectation.toHaveValue(42);
  expectation.toHaveValueStrictEqual(42);
});
