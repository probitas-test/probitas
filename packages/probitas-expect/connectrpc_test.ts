import { assertEquals, assertExists } from "@std/assert";
import type { ConnectRpcResponse } from "@probitas/client-connectrpc";
import {
  type ConnectRpcResponseExpectation,
  expectConnectRpcResponse,
} from "./connectrpc.ts";

// Mock ConnectRpcResponse for testing
function createMockResponse(
  overrides: Partial<ConnectRpcResponse> = {},
): ConnectRpcResponse {
  const defaultResponse: ConnectRpcResponse = {
    kind: "connectrpc",
    processed: true,
    ok: true,
    error: null,
    statusCode: 0,
    statusMessage: null,
    headers: new Headers({
      "content-type": "application/grpc",
      "x-custom": "value",
    }),
    trailers: new Headers({
      "grpc-status": "0",
      "grpc-message": "OK",
    }),
    data: { result: "success" },
    duration: 123,
    raw: {},
  };
  return { ...defaultResponse, ...overrides } as ConnectRpcResponse;
}

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof ConnectRpcResponseExpectation, unknown[]> =
  {
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
    toHaveStatusMessageSatisfying: [
      (v: string | null) => assertEquals(v, null),
    ],
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
      (v: Record<string, unknown>) => assertExists(v),
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
      (v: Record<string, unknown> | null) => assertExists(v),
    ],
    toHaveDataPresent: [],
    toHaveDataNull: [],
    toHaveDataUndefined: [],
    toHaveDataNullish: [],
    toHaveDataMatching: [{ result: "success" }],
    toHaveDataProperty: ["result"],
    toHaveDataPropertyContaining: [],
    toHaveDataPropertyMatching: [],
    toHaveDataPropertySatisfying: [
      "result",
      (v: unknown) => assertEquals(v, "success"),
    ],
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

Deno.test("expectConnectRpcResponse - method existence check", () => {
  const response = createMockResponse();
  const expectation = expectConnectRpcResponse(response);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof ConnectRpcResponseExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on ConnectRpcResponseExpectation`,
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
    [keyof ConnectRpcResponseExpectation, unknown[]]
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
    (args.length === 0 && methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectConnectRpcResponse - ${methodName} - success`, () => {
    const response = createMockResponse();
    const expectation = expectConnectRpcResponse(response);

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

Deno.test("expectConnectRpcResponse - not property - success", () => {
  const response = createMockResponse({ ok: false, statusCode: 1 });
  const expectation = expectConnectRpcResponse(response);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveStatusCode(0);
});

Deno.test("expectConnectRpcResponse - nullish value methods - success", () => {
  // Test null values
  const nullResponse = createMockResponse({
    data: null,
  });
  const nullExpectation = expectConnectRpcResponse(nullResponse);

  nullExpectation.toHaveDataNull();
  nullExpectation.toHaveDataNullish();

  // Test present values
  const presentResponse = createMockResponse();
  const presentExpectation = expectConnectRpcResponse(presentResponse);

  presentExpectation.toHaveDataPresent();
});
