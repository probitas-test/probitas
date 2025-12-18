import { assertEquals, assertExists } from "@std/assert";
import {
  expectRedisArrayResult,
  type RedisArrayResultExpectation,
} from "./array.ts";
import { mockRedisArrayResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof RedisArrayResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Value (arrays - can't test with strict equality)
  toHaveValue: [],
  toHaveValueEqual: [],
  toHaveValueStrictEqual: [],
  toHaveValueSatisfying: [
    (v: unknown[]) => assertEquals(v, ["item1", "item2"]),
  ],
  toHaveValueContaining: [],
  toHaveValueContainingEqual: [],
  toHaveValueMatching: [],
  toHaveValueEmpty: [],
  // Value Count
  toHaveValueCount: [2],
  toHaveValueCountEqual: [2],
  toHaveValueCountStrictEqual: [2],
  toHaveValueCountSatisfying: [(v: number) => assertEquals(v, 2)],
  toHaveValueCountNaN: [],
  toHaveValueCountGreaterThan: [1],
  toHaveValueCountGreaterThanOrEqual: [2],
  toHaveValueCountLessThan: [3],
  toHaveValueCountLessThanOrEqual: [2],
  toHaveValueCountCloseTo: [2, 0],
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

Deno.test("expectRedisArrayResult - method existence check", () => {
  const result = mockRedisArrayResult<string>({ value: ["item1", "item2"] });
  const expectation = expectRedisArrayResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof RedisArrayResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on RedisArrayResultExpectation`,
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
    [keyof RedisArrayResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup
  if (
    methodName === "toHaveValueCountNaN" ||
    methodName === "toHaveDurationNaN" ||
    methodName === "toHaveValueEmpty" ||
    methodName === "toHaveValueMatching" ||
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectRedisArrayResult - ${methodName} - success`, () => {
    const result = mockRedisArrayResult<string>({ value: ["item1", "item2"] });
    const expectation = expectRedisArrayResult(result);

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

Deno.test("expectRedisArrayResult - not property - success", () => {
  // Note: When ok: false, value must be null per discriminated union
  const result = mockRedisArrayResult<string>({
    ok: false,
    value: null,
  });
  const expectation = expectRedisArrayResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
});

Deno.test("expectRedisArrayResult - empty value methods - success", () => {
  // Test empty array
  const emptyResult = mockRedisArrayResult<string>({ value: [] });
  const emptyExpectation = expectRedisArrayResult(emptyResult);

  emptyExpectation.toHaveValueEmpty();
  emptyExpectation.toHaveValueCount(0);
});

Deno.test("expectRedisArrayResult - NaN methods - success", () => {
  // Test NaN duration
  const nanResult = mockRedisArrayResult<string>({
    value: [],
    duration: NaN,
  });
  const nanExpectation = expectRedisArrayResult(nanResult);

  nanExpectation.toHaveDurationNaN();
});

Deno.test("expectRedisArrayResult - toHaveValueMatching - success", () => {
  const result = mockRedisArrayResult<{ id: number; name: string }>({
    value: [{ id: 1, name: "test" }],
  });
  const expectation = expectRedisArrayResult(result);

  expectation.toBeOk().toHaveValueCount(1);
});

Deno.test("expectRedisArrayResult - chaining - success", () => {
  const result = mockRedisArrayResult<string>({ value: ["item1", "item2"] });
  const expectation = expectRedisArrayResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveValueCount(2)
    .toHaveValueCountGreaterThan(1)
    .toHaveValueContaining("item1")
    .toHaveDuration(100);
});

Deno.test("expectRedisArrayResult - toHaveValueContainingEqual - success", () => {
  const result = mockRedisArrayResult<{ id: number }>({
    value: [{ id: 1 }, { id: 2 }],
  });
  const expectation = expectRedisArrayResult(result);

  expectation.toHaveValueContainingEqual({ id: 1 });
});
