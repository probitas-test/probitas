import { assertEquals, assertExists } from "@std/assert";
import {
  expectMongoFindOneResult,
  type MongoFindOneResultExpectation,
} from "./find_one.ts";
import { mockMongoFindOneResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<
  keyof MongoFindOneResultExpectation,
  unknown[]
> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Doc (objects - can't test with strict equality)
  toHaveDoc: [],
  toHaveDocEqual: [],
  toHaveDocStrictEqual: [],
  toHaveDocSatisfying: [
    (v: Record<string, unknown> | undefined) =>
      assertEquals(v, { id: "1", name: "Alice" }),
  ],
  toHaveDocPresent: [],
  toHaveDocNull: [],
  toHaveDocUndefined: [],
  toHaveDocNullish: [],
  toHaveDocMatching: [],
  toHaveDocProperty: [],
  toHaveDocPropertyContaining: [],
  toHaveDocPropertyMatching: [],
  toHaveDocPropertySatisfying: [],
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

Deno.test("expectMongoFindOneResult - method existence check", () => {
  const result = mockMongoFindOneResult();
  const expectation = expectMongoFindOneResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof MongoFindOneResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on MongoFindOneResultExpectation`,
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
    [keyof MongoFindOneResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup or have empty args
  if (
    methodName === "toHaveDocNull" ||
    methodName === "toHaveDocUndefined" ||
    methodName === "toHaveDocNullish" ||
    methodName === "toHaveDurationNaN" ||
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectMongoFindOneResult - ${methodName} - success`, () => {
    const result = mockMongoFindOneResult();
    const expectation = expectMongoFindOneResult(result);

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

Deno.test("expectMongoFindOneResult - not property - success", () => {
  const result = mockMongoFindOneResult({ ok: false });
  const expectation = expectMongoFindOneResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
});

Deno.test("expectMongoFindOneResult - nullish value methods - success", () => {
  // Test null values
  const nullResult = mockMongoFindOneResult({ doc: null });
  const nullExpectation = expectMongoFindOneResult(nullResult);

  nullExpectation.toHaveDocNull();
  nullExpectation.toHaveDocNullish();

  // Test undefined values
  const undefinedResult = mockMongoFindOneResult({ doc: undefined });
  const undefinedExpectation = expectMongoFindOneResult(undefinedResult);

  undefinedExpectation.toHaveDocUndefined();
  undefinedExpectation.toHaveDocNullish();

  // Test present values
  const presentResult = mockMongoFindOneResult();
  const presentExpectation = expectMongoFindOneResult(presentResult);

  presentExpectation.toHaveDocPresent();
});
