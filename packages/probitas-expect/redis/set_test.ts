import { assertEquals, assertExists } from "@std/assert";
import { expectRedisSetResult, type RedisSetResultExpectation } from "./set.ts";
import { mockRedisSetResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof RedisSetResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Value
  toHaveValue: ["OK"],
  toHaveValueEqual: ["OK"],
  toHaveValueStrictEqual: ["OK"],
  toHaveValueSatisfying: [(v: string) => assertEquals(v, "OK")],
  toHaveValueContaining: ["OK"],
  toHaveValueMatching: [/OK/],
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

Deno.test("expectRedisSetResult - method existence check", () => {
  const result = mockRedisSetResult();
  const expectation = expectRedisSetResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof RedisSetResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on RedisSetResultExpectation`,
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
    [keyof RedisSetResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (NaN values)
  if (methodName === "toHaveDurationNaN") {
    continue;
  }

  Deno.test(`expectRedisSetResult - ${methodName} - success`, () => {
    const result = mockRedisSetResult();
    const expectation = expectRedisSetResult(result);

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

Deno.test("expectRedisSetResult - not property - success", () => {
  const result = mockRedisSetResult({ ok: false, value: undefined });
  const expectation = expectRedisSetResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveValue("OK");
});

Deno.test("expectRedisSetResult - NaN duration methods - success", () => {
  // Test NaN values
  const nanResult = mockRedisSetResult({
    duration: NaN,
  });
  const nanExpectation = expectRedisSetResult(nanResult);

  nanExpectation.toHaveDurationNaN();
});

Deno.test("expectRedisSetResult - chaining - success", () => {
  const result = mockRedisSetResult();
  const expectation = expectRedisSetResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveValue("OK")
    .toHaveValueContaining("OK")
    .toHaveValueMatching(/OK/)
    .toHaveDuration(100)
    .toHaveDurationLessThan(200);
});

Deno.test("expectRedisSetResult - undefined value (NX/XX condition not met) - success", () => {
  const result = mockRedisSetResult({ value: undefined });
  const expectation = expectRedisSetResult(result);

  expectation.toBeOk();
  expectation.toHaveValue(undefined);
});
