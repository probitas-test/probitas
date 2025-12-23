import { assertEquals, assertExists } from "@std/assert";
import type { GraphqlResponse } from "@probitas/client-graphql";
import {
  expectGraphqlResponse,
  type GraphqlResponseExpectation,
} from "./graphql.ts";

// Mock GraphqlResponse for testing
function createMockResponse(
  overrides: Partial<GraphqlResponse> = {},
): GraphqlResponse {
  const defaultResponse: GraphqlResponse = {
    kind: "graphql",
    processed: true,
    ok: true,
    status: 200,
    headers: new Headers({
      "content-type": "application/json",
      "x-request-id": "test-123",
    }),
    error: null,
    extensions: { tracing: { version: 1, startTime: "2024-01-01T00:00:00Z" } },
    data: { user: { id: "1", name: "Test" } },
    duration: 123,
    url: "http://localhost:4000/graphql",
    raw: new Response('{"data":{"user":{"id":"1","name":"Test"}}}', {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  };
  return { ...defaultResponse, ...overrides } as GraphqlResponse;
}

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof GraphqlResponseExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Status
  toHaveStatus: [200],
  toHaveStatusEqual: [200],
  toHaveStatusStrictEqual: [200],
  toHaveStatusSatisfying: [(v: number) => assertEquals(v, 200)],
  toHaveStatusNaN: [],
  toHaveStatusGreaterThan: [100],
  toHaveStatusGreaterThanOrEqual: [200],
  toHaveStatusLessThan: [300],
  toHaveStatusLessThanOrEqual: [200],
  toHaveStatusCloseTo: [200, 0],
  toHaveStatusOneOf: [[200, 201, 204]],
  // Headers
  toHaveHeaders: [],
  toHaveHeadersEqual: [],
  toHaveHeadersStrictEqual: [],
  toHaveHeadersSatisfying: [(v: Record<string, string>) => assertExists(v)],
  toHaveHeadersMatching: [{ "content-type": "application/json" }],
  toHaveHeadersProperty: ["content-type"],
  toHaveHeadersPropertyContaining: [],
  toHaveHeadersPropertyMatching: [],
  toHaveHeadersPropertySatisfying: [
    "content-type",
    (v: unknown) => assertEquals(v, "application/json"),
  ],
  // Error (single object - default mock has null)
  toHaveError: [],
  toHaveErrorEqual: [],
  toHaveErrorStrictEqual: [],
  toHaveErrorSatisfying: [],
  toHaveErrorPresent: [],
  toHaveErrorNull: [],
  toHaveErrorUndefined: [],
  toHaveErrorNullish: [],
  // Extensions
  toHaveExtensions: [],
  toHaveExtensionsEqual: [],
  toHaveExtensionsStrictEqual: [],
  toHaveExtensionsSatisfying: [
    (v: Record<string, unknown>) => assertExists(v),
  ],
  toHaveExtensionsMatching: [{ tracing: { version: 1 } }],
  toHaveExtensionsProperty: ["tracing"],
  toHaveExtensionsPropertyContaining: [],
  toHaveExtensionsPropertyMatching: [],
  toHaveExtensionsPropertySatisfying: [
    "tracing",
    (v: unknown) => assertExists(v),
  ],
  toHaveExtensionsPresent: [],
  toHaveExtensionsNull: [],
  toHaveExtensionsUndefined: [],
  toHaveExtensionsNullish: [],
  // Data (objects - can't test with strict equality)
  toHaveData: [],
  toHaveDataEqual: [],
  toHaveDataStrictEqual: [],
  toHaveDataSatisfying: [(v: unknown) => assertExists(v)],
  toHaveDataMatching: [],
  toHaveDataProperty: [],
  toHaveDataPropertyContaining: [],
  toHaveDataPropertyMatching: [],
  toHaveDataPropertySatisfying: [],
  toHaveDataPresent: [],
  toHaveDataNull: [],
  toHaveDataUndefined: [],
  toHaveDataNullish: [],
  // Duration
  toHaveDuration: [123],
  toHaveDurationEqual: [123],
  toHaveDurationStrictEqual: [123],
  toHaveDurationSatisfying: [(v: number) => assertEquals(v, 123)],
  toHaveDurationNaN: [],
  toHaveDurationGreaterThan: [100],
  toHaveDurationGreaterThanOrEqual: [123],
  toHaveDurationLessThan: [200],
  toHaveDurationLessThanOrEqual: [123],
  toHaveDurationCloseTo: [123, 0],
};

Deno.test("expectGraphqlResponse - method existence check", () => {
  const response = createMockResponse();
  const expectation = expectGraphqlResponse(response);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof GraphqlResponseExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on GraphqlResponseExpectation`,
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
    [keyof GraphqlResponseExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (null/undefined/nullish values, NaN)
  if (
    methodName === "toHaveStatusNaN" ||
    methodName === "toHaveDurationNaN" ||
    // Skip methods with empty args (need special handling)
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectGraphqlResponse - ${methodName} - success`, () => {
    const response = createMockResponse();
    const expectation = expectGraphqlResponse(response);

    // Call the method with provided arguments
    // deno-lint-ignore no-explicit-any
    const method = expectation[methodName] as (...args: any[]) => any;
    const result = method.call(expectation, ...args);

    // Verify method returns an expectation object (for chaining)
    assertExists(result);
    assertExists(
      result.toBeOk,
      "Result should have toBeOk method for chaining",
    );
  });
}

Deno.test("expectGraphqlResponse - not property - success", () => {
  const response = createMockResponse({ ok: false, status: 500 });
  const expectation = expectGraphqlResponse(response);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveStatus(200);
});

Deno.test("expectGraphqlResponse - error methods - success", () => {
  // Test with error present
  const errorResponse = createMockResponse({
    ok: false,
    // deno-lint-ignore no-explicit-any
    error: { message: "Not found" } as any,
  });
  const errorExpectation = expectGraphqlResponse(errorResponse);

  errorExpectation.toHaveErrorPresent();

  // Test with no error
  const successResponse = createMockResponse({
    ok: true,
    error: null,
  });
  const successExpectation = expectGraphqlResponse(successResponse);

  successExpectation.toHaveErrorNull();
});
