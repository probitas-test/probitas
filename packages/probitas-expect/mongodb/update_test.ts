import { assertEquals, assertExists } from "@std/assert";
import {
  expectMongoUpdateResult,
  type MongoUpdateResultExpectation,
} from "./update.ts";
import { mockMongoUpdateResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof MongoUpdateResultExpectation, unknown[]> =
  {
    // Core (special property, not a method)
    not: [],
    // Ok
    toBeOk: [],
    // Matched count
    toHaveMatchedCount: [1],
    toHaveMatchedCountEqual: [1],
    toHaveMatchedCountStrictEqual: [1],
    toHaveMatchedCountSatisfying: [(v: number) => assertEquals(v, 1)],
    toHaveMatchedCountNaN: [],
    toHaveMatchedCountGreaterThan: [0],
    toHaveMatchedCountGreaterThanOrEqual: [1],
    toHaveMatchedCountLessThan: [2],
    toHaveMatchedCountLessThanOrEqual: [1],
    toHaveMatchedCountCloseTo: [1, 0],
    // Modified count
    toHaveModifiedCount: [1],
    toHaveModifiedCountEqual: [1],
    toHaveModifiedCountStrictEqual: [1],
    toHaveModifiedCountSatisfying: [(v: number) => assertEquals(v, 1)],
    toHaveModifiedCountNaN: [],
    toHaveModifiedCountGreaterThan: [0],
    toHaveModifiedCountGreaterThanOrEqual: [1],
    toHaveModifiedCountLessThan: [2],
    toHaveModifiedCountLessThanOrEqual: [1],
    toHaveModifiedCountCloseTo: [1, 0],
    // Upserted ID
    toHaveUpsertedId: [undefined],
    toHaveUpsertedIdEqual: [undefined],
    toHaveUpsertedIdStrictEqual: [undefined],
    toHaveUpsertedIdSatisfying: [
      (v: string | undefined) => assertEquals(v, undefined),
    ],
    toHaveUpsertedIdPresent: [],
    toHaveUpsertedIdNull: [],
    toHaveUpsertedIdUndefined: [],
    toHaveUpsertedIdNullish: [],
    toHaveUpsertedIdContaining: ["upsert"],
    toHaveUpsertedIdMatching: [/upsert/],
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

Deno.test("expectMongoUpdateResult - method existence check", () => {
  const result = mockMongoUpdateResult();
  const expectation = expectMongoUpdateResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof MongoUpdateResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on MongoUpdateResultExpectation`,
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
    [keyof MongoUpdateResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (NaN values, null/undefined/nullish)
  if (
    methodName === "toHaveMatchedCountNaN" ||
    methodName === "toHaveModifiedCountNaN" ||
    methodName === "toHaveDurationNaN" ||
    methodName === "toHaveUpsertedIdPresent" ||
    methodName === "toHaveUpsertedIdNull" ||
    methodName === "toHaveUpsertedIdContaining" ||
    methodName === "toHaveUpsertedIdMatching"
  ) {
    continue;
  }

  Deno.test(`expectMongoUpdateResult - ${methodName} - success`, () => {
    const result = mockMongoUpdateResult();
    const expectation = expectMongoUpdateResult(result);

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

Deno.test("expectMongoUpdateResult - not property - success", () => {
  const result = mockMongoUpdateResult({ ok: false });
  const expectation = expectMongoUpdateResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveMatchedCount(0);
});

Deno.test("expectMongoUpdateResult - upsert with ID - success", () => {
  const result = mockMongoUpdateResult({
    upsertedId: "upserted-123",
    matchedCount: 0,
    modifiedCount: 0,
  });
  const expectation = expectMongoUpdateResult(result);

  expectation.toHaveUpsertedIdPresent();
  expectation.toHaveUpsertedId("upserted-123");
  expectation.toHaveUpsertedIdContaining("upserted");
  expectation.toHaveUpsertedIdMatching(/^upserted-\d+$/);
  expectation.toHaveMatchedCount(0);
  expectation.toHaveModifiedCount(0);
});

Deno.test("expectMongoUpdateResult - nullish upserted ID - success", () => {
  // Test undefined upsertedId
  const undefinedResult = mockMongoUpdateResult({ upsertedId: undefined });
  const undefinedExpectation = expectMongoUpdateResult(undefinedResult);

  undefinedExpectation.toHaveUpsertedIdUndefined();
  undefinedExpectation.toHaveUpsertedIdNullish();

  // Test null upsertedId (cast to any since the type expects string | undefined)
  // deno-lint-ignore no-explicit-any
  const nullResult = mockMongoUpdateResult({ upsertedId: null as any });
  const nullExpectation = expectMongoUpdateResult(nullResult);

  nullExpectation.toHaveUpsertedIdNull();
  nullExpectation.toHaveUpsertedIdNullish();
});

Deno.test("expectMongoUpdateResult - multiple documents updated - success", () => {
  const result = mockMongoUpdateResult({
    matchedCount: 5,
    modifiedCount: 3,
  });
  const expectation = expectMongoUpdateResult(result);

  expectation.toHaveMatchedCount(5);
  expectation.toHaveModifiedCount(3);
  expectation.toHaveMatchedCountGreaterThan(3);
  expectation.toHaveModifiedCountLessThanOrEqual(5);
});
