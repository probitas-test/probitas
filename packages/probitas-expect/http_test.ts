import { assertEquals, assertExists } from "@std/assert";
import type { HttpResponse } from "@probitas/client-http";
import { expectHttpResponse, type HttpResponseExpectation } from "./http.ts";

// Mock HttpResponse for testing
function createMockResponse(
  overrides: Partial<HttpResponse> = {},
): HttpResponse {
  const bodyBytes = new TextEncoder().encode('{"message":"success"}');
  const defaultResponse: HttpResponse = {
    kind: "http",
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers({
      "content-type": "application/json",
      "x-custom": "value",
    }),
    url: "https://example.com/api/test",
    body: bodyBytes,
    arrayBuffer: () => bodyBytes.buffer,
    blob: () => new Blob([bodyBytes]),
    text: () => '{"message":"success"}',
    // deno-lint-ignore no-explicit-any
    json: <T = any>(): T | null => ({ message: "success" }) as T,
    duration: 123,
    raw: () =>
      new Response('{"message":"success"}', {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
      }),
  };
  return { ...defaultResponse, ...overrides };
}

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<keyof HttpResponseExpectation, unknown[]> = {
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
  // Status Text
  toHaveStatusText: ["OK"],
  toHaveStatusTextEqual: ["OK"],
  toHaveStatusTextStrictEqual: ["OK"],
  toHaveStatusTextSatisfying: [(v: string) => assertEquals(v, "OK")],
  toHaveStatusTextContaining: ["OK"],
  toHaveStatusTextMatching: [/OK/],
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
  // URL
  toHaveUrl: ["https://example.com/api/test"],
  toHaveUrlEqual: ["https://example.com/api/test"],
  toHaveUrlStrictEqual: ["https://example.com/api/test"],
  toHaveUrlSatisfying: [
    (v: string) => assertEquals(v, "https://example.com/api/test"),
  ],
  toHaveUrlContaining: ["example.com"],
  toHaveUrlMatching: [/example\.com/],
  // Body
  toHaveBody: [],
  toHaveBodyEqual: [],
  toHaveBodyStrictEqual: [],
  toHaveBodySatisfying: [(v: Uint8Array | null) => assertExists(v)],
  toHaveBodyPresent: [],
  toHaveBodyNull: [],
  toHaveBodyUndefined: [],
  toHaveBodyNullish: [],
  // Body Length
  toHaveBodyLength: [21],
  toHaveBodyLengthEqual: [21],
  toHaveBodyLengthStrictEqual: [21],
  toHaveBodyLengthSatisfying: [(v: number) => assertEquals(v, 21)],
  toHaveBodyLengthNaN: [],
  toHaveBodyLengthGreaterThan: [20],
  toHaveBodyLengthGreaterThanOrEqual: [21],
  toHaveBodyLengthLessThan: [30],
  toHaveBodyLengthLessThanOrEqual: [21],
  toHaveBodyLengthCloseTo: [21, 0],
  // Text
  toHaveText: ['{"message":"success"}'],
  toHaveTextEqual: ['{"message":"success"}'],
  toHaveTextStrictEqual: ['{"message":"success"}'],
  toHaveTextSatisfying: [
    (v: string) => assertEquals(v, '{"message":"success"}'),
  ],
  toHaveTextContaining: ["success"],
  toHaveTextMatching: [/success/],
  toHaveTextPresent: [],
  toHaveTextNull: [],
  toHaveTextUndefined: [],
  toHaveTextNullish: [],
  // Text Length
  toHaveTextLength: [21],
  toHaveTextLengthEqual: [21],
  toHaveTextLengthStrictEqual: [21],
  toHaveTextLengthSatisfying: [(v: number) => assertEquals(v, 21)],
  toHaveTextLengthNaN: [],
  toHaveTextLengthGreaterThan: [20],
  toHaveTextLengthGreaterThanOrEqual: [21],
  toHaveTextLengthLessThan: [30],
  toHaveTextLengthLessThanOrEqual: [21],
  toHaveTextLengthCloseTo: [21, 0],
  // Data
  toHaveJson: [],
  toHaveJsonEqual: [],
  toHaveJsonStrictEqual: [],
  toHaveJsonSatisfying: [
    (v: Record<string, unknown> | null) => assertExists(v),
  ],
  toHaveJsonPresent: [],
  toHaveJsonNull: [],
  toHaveJsonUndefined: [],
  toHaveJsonNullish: [],
  toHaveJsonMatching: [{ message: "success" }],
  toHaveJsonProperty: ["message"],
  toHaveJsonPropertyContaining: [],
  toHaveJsonPropertyMatching: [],
  toHaveJsonPropertySatisfying: [
    "message",
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

Deno.test("expectHttpResponse - method existence check", () => {
  const response = createMockResponse();
  const expectation = expectHttpResponse(response);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof HttpResponseExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on HttpResponseExpectation`,
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
    [keyof HttpResponseExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip methods that require special setup (null/undefined/nullish values, NaN)
  if (
    methodName === "toHaveBodyPresent" ||
    methodName === "toHaveBodyNull" ||
    methodName === "toHaveBodyUndefined" ||
    methodName === "toHaveBodyNullish" ||
    methodName === "toHaveJsonPresent" ||
    methodName === "toHaveJsonNull" ||
    methodName === "toHaveJsonUndefined" ||
    methodName === "toHaveJsonNullish" ||
    methodName === "toHaveStatusNaN" ||
    methodName === "toHaveBodyLengthNaN" ||
    methodName === "toHaveTextLengthNaN" ||
    methodName === "toHaveDurationNaN" ||
    // Skip methods with empty args (need special handling)
    (args.length === 0 &&
      methodName !== "toBeOk")
  ) {
    continue;
  }

  Deno.test(`expectHttpResponse - ${methodName} - success`, () => {
    const response = createMockResponse();
    const expectation = expectHttpResponse(response);

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

Deno.test("expectHttpResponse - not property - success", () => {
  const response = createMockResponse({ ok: false, status: 404 });
  const expectation = expectHttpResponse(response);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveStatus(200);
});

Deno.test("expectHttpResponse - nullish value methods - success", () => {
  // Test null values
  const nullResponse = createMockResponse({
    body: null,
    headers: new Headers(),
    json: () => null,
  });
  const nullExpectation = expectHttpResponse(nullResponse);

  nullExpectation.toHaveBodyNull();
  nullExpectation.toHaveJsonNull();
  nullExpectation.toHaveBodyNullish();
  nullExpectation.toHaveJsonNullish();

  // Test present values
  const presentResponse = createMockResponse();
  const presentExpectation = expectHttpResponse(presentResponse);

  presentExpectation.toHaveBodyPresent();
  presentExpectation.toHaveJsonPresent();
});
