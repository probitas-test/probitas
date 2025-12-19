import { assertEquals, assertExists } from "@std/assert";
import {
  type DenoKvGetResultExpectation,
  expectDenoKvGetResult,
} from "./get.ts";
import { mockDenoKvGetResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof DenoKvGetResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Key (arrays - can't test with strict equality)
  toHaveKey: [],
  toHaveKeyEqual: [],
  toHaveKeyStrictEqual: [],
  toHaveKeySatisfying: [(v: unknown[]) => assertEquals(v, ["users", "1"])],
  toHaveKeyContaining: [],
  toHaveKeyContainingEqual: [],
  toHaveKeyMatching: [],
  toHaveKeyEmpty: [],
  // Value (objects - can't test with strict equality)
  toHaveValue: [],
  toHaveValueEqual: [],
  toHaveValueStrictEqual: [],
  toHaveValueSatisfying: [(v: unknown) => assertEquals(v, { name: "Alice" })],
  toHaveValuePresent: [],
  toHaveValueNull: [],
  toHaveValueUndefined: [],
  toHaveValueNullish: [],
  toHaveValueMatching: [],
  toHaveValueProperty: ["name"],
  toHaveValuePropertyContaining: [],
  toHaveValuePropertyMatching: [],
  toHaveValuePropertySatisfying: [
    "name",
    (v: unknown) => assertEquals(v, "Alice"),
  ],
  // Versionstamp
  toHaveVersionstamp: ["v1"],
  toHaveVersionstampEqual: ["v1"],
  toHaveVersionstampStrictEqual: ["v1"],
  toHaveVersionstampSatisfying: [(v: string) => assertEquals(v, "v1")],
  toHaveVersionstampContaining: ["v1"],
  toHaveVersionstampMatching: [/v1/],
  toHaveVersionstampPresent: [],
  toHaveVersionstampNull: [],
  toHaveVersionstampUndefined: [],
  toHaveVersionstampNullish: [],
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

Deno.test("expectDenoKvGetResult - method existence check", () => {
  const result = mockDenoKvGetResult();
  const expectation = expectDenoKvGetResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof DenoKvGetResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on DenoKvGetResultExpectation`,
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
    [keyof DenoKvGetResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (null/undefined/nullish values, NaN, empty)
  if (
    methodName === "toHaveValuePresent" ||
    methodName === "toHaveValueNull" ||
    methodName === "toHaveValueUndefined" ||
    methodName === "toHaveValueNullish" ||
    methodName === "toHaveKeyEmpty" ||
    methodName === "toHaveDurationNaN" ||
    // Skip methods with empty args (need special handling)
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectDenoKvGetResult - ${methodName} - success`, () => {
    const result = mockDenoKvGetResult();
    const expectation = expectDenoKvGetResult(result);

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

Deno.test("expectDenoKvGetResult - not property - success", () => {
  const result = mockDenoKvGetResult({ ok: false });
  const expectation = expectDenoKvGetResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveValue({ name: "Bob" });
});

Deno.test("expectDenoKvGetResult - nullish value methods - success", () => {
  // Test null value
  const nullResult = mockDenoKvGetResult({ value: null });
  const nullExpectation = expectDenoKvGetResult(nullResult);

  nullExpectation.toHaveValueNull();
  nullExpectation.toHaveValueNullish();

  // Test present value
  const presentResult = mockDenoKvGetResult();
  const presentExpectation = expectDenoKvGetResult(presentResult);

  presentExpectation.toHaveValuePresent();
});

Deno.test("expectDenoKvGetResult - empty key methods - success", () => {
  const emptyKeyResult = mockDenoKvGetResult({ key: [] });
  const emptyKeyExpectation = expectDenoKvGetResult(emptyKeyResult);

  emptyKeyExpectation.toHaveKeyEmpty();
});

Deno.test("expectDenoKvGetResult - method chaining - success", () => {
  const result = mockDenoKvGetResult();
  const expectation = expectDenoKvGetResult(result);

  // Test method chaining (avoiding array/object equality issues)
  expectation
    .toBeOk()
    .toHaveKeyContaining("users")
    .toHaveValueProperty("name")
    .toHaveVersionstamp("v1")
    .toHaveDuration(100);
});
