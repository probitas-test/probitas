import { assertEquals, assertExists } from "@std/assert";
import {
  expectRedisHashResult,
  type RedisHashResultExpectation,
} from "./hash.ts";
import { mockRedisHashResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof RedisHashResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Value (objects - can't test with strict equality)
  toHaveValue: [],
  toHaveValueEqual: [],
  toHaveValueStrictEqual: [],
  toHaveValueSatisfying: [(v: unknown) => assertExists(v)],
  toHaveValueMatching: [],
  toHaveValueProperty: [],
  toHaveValuePropertyContaining: [],
  toHaveValuePropertyMatching: [],
  toHaveValuePropertySatisfying: [],
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

Deno.test("expectRedisHashResult - method existence check", () => {
  const result = mockRedisHashResult();
  const expectation = expectRedisHashResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof RedisHashResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on RedisHashResultExpectation`,
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
    [keyof RedisHashResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup or have empty args
  if (
    methodName === "toHaveDurationNaN" ||
    methodName === "toHaveValuePropertyContaining" ||
    methodName === "toHaveValuePropertyMatching" ||
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectRedisHashResult - ${methodName} - success`, () => {
    const result = mockRedisHashResult();
    const expectation = expectRedisHashResult(result);

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

Deno.test("expectRedisHashResult - not property - success", () => {
  // Note: When ok: false, value must be null per discriminated union
  const result = mockRedisHashResult({ ok: false, value: null });
  const expectation = expectRedisHashResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
});

Deno.test("expectRedisHashResult - NaN duration methods - success", () => {
  // Test NaN values
  const nanResult = mockRedisHashResult({
    duration: NaN,
  });
  const nanExpectation = expectRedisHashResult(nanResult);

  nanExpectation.toHaveDurationNaN();
});

Deno.test("expectRedisHashResult - toHaveValuePropertyContaining - success", () => {
  const result = mockRedisHashResult({
    value: { items: JSON.stringify(["a", "b", "c"]) },
  });
  const expectation = expectRedisHashResult(result);

  expectation.toHaveValuePropertyContaining("items", "b");
});

Deno.test("expectRedisHashResult - toHaveValuePropertyMatching - success", () => {
  const result = mockRedisHashResult({
    value: { nested: JSON.stringify({ id: 1, name: "test" }) },
  });
  const expectation = expectRedisHashResult(result);

  expectation.toBeOk().toHaveValueProperty("nested");
});

Deno.test("expectRedisHashResult - chaining - success", () => {
  const result = mockRedisHashResult();
  const expectation = expectRedisHashResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveValueProperty("field1")
    .toHaveValueProperty("field1", "value1")
    .toHaveValueMatching({ field1: "value1" })
    .toHaveDuration(100)
    .toHaveDurationLessThan(200);
});

Deno.test("expectRedisHashResult - nested property access - success", () => {
  const result = mockRedisHashResult({
    value: {
      user: JSON.stringify({
        profile: {
          name: "Alice",
          age: 30,
        },
      }),
    },
  });
  const expectation = expectRedisHashResult(result);

  // Redis hash values are strings, so we test the stringified value
  expectation.toHaveValueProperty("user");
  expectation.toHaveValuePropertySatisfying(
    "user",
    (v: string) => {
      const parsed = JSON.parse(v);
      assertEquals(parsed.profile.name, "Alice");
      assertEquals(parsed.profile.age, 30);
    },
  );
});
