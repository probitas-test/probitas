import { assertEquals, assertExists } from "@std/assert";
import {
  type DenoKvSetResultExpectation,
  expectDenoKvSetResult,
} from "./set.ts";
import { mockDenoKvSetResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof DenoKvSetResultExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Versionstamp
  toHaveVersionstamp: ["v1"],
  toHaveVersionstampEqual: ["v1"],
  toHaveVersionstampStrictEqual: ["v1"],
  toHaveVersionstampSatisfying: [(v: string) => assertEquals(v, "v1")],
  toHaveVersionstampContaining: ["v1"],
  toHaveVersionstampMatching: [/v1/],
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

Deno.test("expectDenoKvSetResult - method existence check", () => {
  const result = mockDenoKvSetResult();
  const expectation = expectDenoKvSetResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof DenoKvSetResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on DenoKvSetResultExpectation`,
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
    [keyof DenoKvSetResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (NaN)
  if (
    methodName === "toHaveDurationNaN" ||
    // Skip methods with empty args (need special handling)
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectDenoKvSetResult - ${methodName} - success`, () => {
    const result = mockDenoKvSetResult();
    const expectation = expectDenoKvSetResult(result);

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

Deno.test("expectDenoKvSetResult - not property - success", () => {
  const result = mockDenoKvSetResult({ ok: false });
  const expectation = expectDenoKvSetResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveVersionstamp("v2");
});

Deno.test("expectDenoKvSetResult - method chaining - success", () => {
  const result = mockDenoKvSetResult();
  const expectation = expectDenoKvSetResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveVersionstamp("v1")
    .toHaveVersionstampContaining("v")
    .toHaveDuration(100)
    .toHaveDurationLessThan(200);
});

Deno.test("expectDenoKvSetResult - versionstamp pattern matching - success", () => {
  const result = mockDenoKvSetResult({ versionstamp: "abc123def456" });
  const expectation = expectDenoKvSetResult(result);

  expectation
    .toHaveVersionstampMatching(/^[a-z0-9]+$/)
    .toHaveVersionstampContaining("123")
    .toHaveVersionstampSatisfying((v) => {
      assertEquals(v.length, 12);
    });
});
