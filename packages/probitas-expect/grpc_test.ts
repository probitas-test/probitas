import { assertEquals, assertExists } from "@std/assert";
import type { GrpcResponse } from "@probitas/client-grpc";
import { expectGrpcResponse, type GrpcResponseExpectation } from "./grpc.ts";

// Mock GrpcResponse for testing
function createMockResponse(
  overrides: Partial<GrpcResponse> = {},
): GrpcResponse {
  const defaultResponse: GrpcResponse = {
    kind: "connectrpc",
    processed: true,
    ok: true,
    error: null,
    statusCode: 0,
    statusMessage: null,
    headers: new Headers({
      "grpc-accept-encoding": "identity,deflate,gzip",
      "content-type": "application/grpc",
    }),
    trailers: new Headers({
      "grpc-status": "0",
      "grpc-message": "",
    }),
    data: { id: 1, name: "test" },
    duration: 45,
    raw: {},
  };
  return { ...defaultResponse, ...overrides } as GrpcResponse;
}

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof GrpcResponseExpectation, unknown[]> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Code
  toHaveStatusCode: [0],
  toHaveStatusCodeEqual: [0],
  toHaveStatusCodeStrictEqual: [0],
  toHaveStatusCodeSatisfying: [(v: number) => assertEquals(v, 0)],
  toHaveStatusCodeNaN: [],
  toHaveStatusCodeGreaterThan: [-1],
  toHaveStatusCodeGreaterThanOrEqual: [0],
  toHaveStatusCodeLessThan: [1],
  toHaveStatusCodeLessThanOrEqual: [0],
  toHaveStatusCodeCloseTo: [0, 0],
  toHaveStatusCodeOneOf: [[0, 1, 2]],
  // Message (statusMessage is null for success responses)
  toHaveStatusMessage: [null],
  toHaveStatusMessageEqual: [null],
  toHaveStatusMessageStrictEqual: [null],
  toHaveStatusMessageSatisfying: [(v: string | null) => assertEquals(v, null)],
  toHaveStatusMessageContaining: [],
  toHaveStatusMessageMatching: [],
  toHaveStatusMessagePresent: [],
  toHaveStatusMessageNull: [],
  toHaveStatusMessageUndefined: [],
  toHaveStatusMessageNullish: [],
  // Headers
  toHaveHeaders: [],
  toHaveHeadersEqual: [],
  toHaveHeadersStrictEqual: [],
  toHaveHeadersSatisfying: [
    (v: Record<string, unknown>) => assertExists(v),
  ],
  toHaveHeadersMatching: [{ "content-type": "application/grpc" }],
  toHaveHeadersProperty: ["content-type"],
  toHaveHeadersPropertyContaining: [],
  toHaveHeadersPropertyMatching: [],
  toHaveHeadersPropertySatisfying: [
    "content-type",
    (v: unknown) => assertEquals(v, "application/grpc"),
  ],
  // Trailers
  toHaveTrailers: [],
  toHaveTrailersEqual: [],
  toHaveTrailersStrictEqual: [],
  toHaveTrailersSatisfying: [
    // deno-lint-ignore no-explicit-any
    (v: Record<string, any>) => assertExists(v),
  ],
  toHaveTrailersMatching: [{ "grpc-status": "0" }],
  toHaveTrailersProperty: ["grpc-status"],
  toHaveTrailersPropertyContaining: [],
  toHaveTrailersPropertyMatching: [],
  toHaveTrailersPropertySatisfying: [
    "grpc-status",
    (v: unknown) => assertEquals(v, "0"),
  ],
  // Data
  toHaveData: [],
  toHaveDataEqual: [],
  toHaveDataStrictEqual: [],
  toHaveDataSatisfying: [
    // deno-lint-ignore no-explicit-any
    (v: Record<string, any> | null) => assertExists(v),
  ],
  toHaveDataPresent: [],
  toHaveDataNull: [],
  toHaveDataUndefined: [],
  toHaveDataNullish: [],
  toHaveDataMatching: [{ id: 1 }],
  toHaveDataProperty: ["name"],
  toHaveDataPropertyContaining: [],
  toHaveDataPropertyMatching: [],
  toHaveDataPropertySatisfying: [
    "name",
    (v: unknown) => assertEquals(v, "test"),
  ],
  // Duration
  toHaveDuration: [45],
  toHaveDurationEqual: [45],
  toHaveDurationStrictEqual: [45],
  toHaveDurationSatisfying: [(v: number) => assertEquals(v, 45)],
  toHaveDurationNaN: [],
  toHaveDurationGreaterThan: [40],
  toHaveDurationGreaterThanOrEqual: [45],
  toHaveDurationLessThan: [50],
  toHaveDurationLessThanOrEqual: [45],
  toHaveDurationCloseTo: [45, 0],
};

Deno.test("expectGrpcResponse - method existence check", () => {
  const response = createMockResponse();
  const expectation = expectGrpcResponse(response);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof GrpcResponseExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on GrpcResponseExpectation`,
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
    [keyof GrpcResponseExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (null/undefined/nullish values, NaN)
  if (
    methodName === "toHaveDataPresent" ||
    methodName === "toHaveDataNull" ||
    methodName === "toHaveDataUndefined" ||
    methodName === "toHaveDataNullish" ||
    methodName === "toHaveStatusCodeNaN" ||
    methodName === "toHaveDurationNaN" ||
    // Skip methods with empty args (need special handling)
    (args.length === 0 &&
      methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectGrpcResponse - ${methodName} - success`, () => {
    const response = createMockResponse();
    const expectation = expectGrpcResponse(response);

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

Deno.test("expectGrpcResponse - not property - success", () => {
  const response = createMockResponse({
    ok: false,
    statusCode: 2,
    statusMessage: "UNKNOWN",
  });
  const expectation = expectGrpcResponse(response);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveStatusCode(0);
});

Deno.test("expectGrpcResponse - nullish value methods - success", () => {
  // Test null values (data can be null)
  const nullResponse = createMockResponse({
    data: null,
  });
  const nullExpectation = expectGrpcResponse(nullResponse);

  nullExpectation.toHaveDataNull();
  nullExpectation.toHaveDataNullish();

  // Test present values
  const presentResponse = createMockResponse();
  const presentExpectation = expectGrpcResponse(presentResponse);

  presentExpectation.toHaveDataPresent();
});
