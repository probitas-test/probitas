import { assertEquals, assertExists } from "@std/assert";
import {
  type DenoKvAtomicResultExpectation,
  expectDenoKvAtomicResult,
} from "./atomic.ts";
import { mockDenoKvAtomicResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof DenoKvAtomicResultExpectation, unknown[]> =
  {
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

Deno.test("expectDenoKvAtomicResult - method existence check", () => {
  const result = mockDenoKvAtomicResult();
  const expectation = expectDenoKvAtomicResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof DenoKvAtomicResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on DenoKvAtomicResultExpectation`,
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
    [keyof DenoKvAtomicResultExpectation, unknown[]]
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

  Deno.test(`expectDenoKvAtomicResult - ${methodName} - success`, () => {
    const result = mockDenoKvAtomicResult();
    const expectation = expectDenoKvAtomicResult(result);

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

Deno.test("expectDenoKvAtomicResult - not property - success", () => {
  const result = mockDenoKvAtomicResult({ ok: false });
  const expectation = expectDenoKvAtomicResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveVersionstamp("v2");
});

Deno.test("expectDenoKvAtomicResult - method chaining - success", () => {
  const result = mockDenoKvAtomicResult();
  const expectation = expectDenoKvAtomicResult(result);

  // Test method chaining
  expectation
    .toBeOk()
    .toHaveVersionstamp("v1")
    .toHaveVersionstampContaining("v")
    .toHaveDuration(100)
    .toHaveDurationLessThan(200);
});

Deno.test("expectDenoKvAtomicResult - versionstamp pattern matching - success", () => {
  const result = mockDenoKvAtomicResult({ versionstamp: "atomic_xyz789" });
  const expectation = expectDenoKvAtomicResult(result);

  expectation
    .toHaveVersionstampMatching(/^atomic_[a-z0-9]+$/)
    .toHaveVersionstampContaining("xyz")
    .toHaveVersionstampSatisfying((v) => {
      assertEquals(v.startsWith("atomic_"), true);
    });
});

Deno.test("expectDenoKvAtomicResult - failed atomic operation - success", () => {
  // Simulate a failed atomic operation (e.g., check failed)
  // Note: When ok is false, versionstamp is always null per the type definition
  const result = mockDenoKvAtomicResult({
    ok: false,
    versionstamp: null,
    duration: 50,
  });
  const expectation = expectDenoKvAtomicResult(result);

  expectation.not.toBeOk();
  expectation.toHaveVersionstamp(null);
  expectation.toHaveDuration(50).toHaveDurationLessThan(100);
});
