import { assertEquals, assertExists } from "@std/assert";
import {
  type DenoKvDeleteResultExpectation,
  expectDenoKvDeleteResult,
} from "./delete.ts";
import { mockDenoKvDeleteResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof DenoKvDeleteResultExpectation, unknown[]> =
  {
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

Deno.test("expectDenoKvDeleteResult - method existence check", () => {
  const result = mockDenoKvDeleteResult();
  const expectation = expectDenoKvDeleteResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof DenoKvDeleteResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on DenoKvDeleteResultExpectation`,
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
    [keyof DenoKvDeleteResultExpectation, unknown[]]
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

  Deno.test(`expectDenoKvDeleteResult - ${methodName} - success`, () => {
    const result = mockDenoKvDeleteResult();
    const expectation = expectDenoKvDeleteResult(result);

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

Deno.test("expectDenoKvDeleteResult - not property - success", () => {
  const result = mockDenoKvDeleteResult({ ok: false });
  const expectation = expectDenoKvDeleteResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveDuration(200);
});

Deno.test("expectDenoKvDeleteResult - method chaining - success", () => {
  const result = mockDenoKvDeleteResult();
  const expectation = expectDenoKvDeleteResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveDuration(100)
    .toHaveDurationGreaterThan(50)
    .toHaveDurationLessThan(200);
});

Deno.test("expectDenoKvDeleteResult - duration assertions - success", () => {
  const result = mockDenoKvDeleteResult({ duration: 150 });
  const expectation = expectDenoKvDeleteResult(result);

  expectation
    .toBeOk()
    .toHaveDuration(150)
    .toHaveDurationEqual(150)
    .toHaveDurationGreaterThanOrEqual(100)
    .toHaveDurationLessThanOrEqual(200)
    .toHaveDurationCloseTo(150, 0)
    .toHaveDurationSatisfying((v) => {
      assertEquals(v, 150);
    });
});
