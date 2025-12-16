/**
 * HTTP Client Failure Examples
 *
 * This file demonstrates failure messages for each HTTP expectation method.
 * All scenarios are expected to fail - they use dummy responses to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import type { HttpResponse } from "jsr:@probitas/client-http@^0";

// Helper to create mock HTTP response
function createMockResponse(
  overrides: Partial<HttpResponse> = {},
): HttpResponse {
  const bodyBytes = new TextEncoder().encode(
    '{"error":"something went wrong"}',
  );
  const defaultResponse: HttpResponse = {
    kind: "http",
    ok: false,
    status: 500,
    statusText: "Internal Server Error",
    headers: new Headers({ "content-type": "application/json" }),
    url: "http://example.com/api",
    body: bodyBytes,
    arrayBuffer: () => bodyBytes.buffer,
    blob: () => new Blob([bodyBytes]),
    text: () => '{"error":"something went wrong"}',
    // deno-lint-ignore no-explicit-any
    data: <T = any>(): T | null => ({ error: "something went wrong" }) as T,
    duration: 1500,
    raw: () =>
      new Response('{"error":"something went wrong"}', {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "content-type": "application/json" },
      }),
  };
  return { ...defaultResponse, ...overrides };
}

const dummyResponse = createMockResponse();

export const toBeOk = scenario("HTTP - toBeOk failure", {
  tags: ["failure", "http"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyResponse).toBeOk();
  })
  .build();

export const toHaveStatus = scenario("HTTP - toHaveStatus failure", {
  tags: ["failure", "http"],
})
  .step("toHaveStatus fails with wrong status", () => {
    expect(dummyResponse).toHaveStatus(200);
  })
  .build();

export const toHaveStatusGreaterThan = scenario(
  "HTTP - toHaveStatusGreaterThan failure",
  { tags: ["failure", "http"] },
)
  .step("toHaveStatusGreaterThan fails", () => {
    expect(dummyResponse).toHaveStatusGreaterThan(500);
  })
  .build();

export const toHaveStatusLessThan = scenario(
  "HTTP - toHaveStatusLessThan failure",
  { tags: ["failure", "http"] },
)
  .step("toHaveStatusLessThan fails", () => {
    expect(dummyResponse).toHaveStatusLessThan(500);
  })
  .build();

export const toHaveStatusText = scenario("HTTP - toHaveStatusText failure", {
  tags: ["failure", "http"],
})
  .step("toHaveStatusText fails with wrong text", () => {
    expect(dummyResponse).toHaveStatusText("OK");
  })
  .build();

export const toHaveStatusTextContaining = scenario(
  "HTTP - toHaveStatusTextContaining failure",
  { tags: ["failure", "http"] },
)
  .step("toHaveStatusTextContaining fails", () => {
    expect(dummyResponse).toHaveStatusTextContaining("OK");
  })
  .build();

export const toHaveHeaders = scenario("HTTP - toHaveHeaders failure", {
  tags: ["failure", "http"],
})
  .step("toHaveHeaders fails with wrong headers", () => {
    expect(dummyResponse).toHaveHeadersMatching({ "x-custom": "value" });
  })
  .build();

export const toHaveHeadersProperty = scenario(
  "HTTP - toHaveHeadersProperty failure",
  { tags: ["failure", "http"] },
)
  .step("toHaveHeadersProperty fails when property missing", () => {
    expect(dummyResponse).toHaveHeadersProperty("x-missing-header");
  })
  .build();

export const toHaveUrl = scenario("HTTP - toHaveUrl failure", {
  tags: ["failure", "http"],
})
  .step("toHaveUrl fails with wrong URL", () => {
    expect(dummyResponse).toHaveUrl("http://different.com/path");
  })
  .build();

export const toHaveUrlContaining = scenario(
  "HTTP - toHaveUrlContaining failure",
  { tags: ["failure", "http"] },
)
  .step("toHaveUrlContaining fails", () => {
    expect(dummyResponse).toHaveUrlContaining("different.com");
  })
  .build();

export const toHaveBodyLength = scenario("HTTP - toHaveBodyLength failure", {
  tags: ["failure", "http"],
})
  .step("toHaveBodyLength fails with wrong length", () => {
    expect(dummyResponse).toHaveBodyLength(100);
  })
  .build();

export const toHaveTextContaining = scenario(
  "HTTP - toHaveTextContaining failure",
  { tags: ["failure", "http"] },
)
  .step("toHaveTextContaining fails", () => {
    expect(dummyResponse).toHaveTextContaining("success");
  })
  .build();

export const toHaveDataMatching = scenario(
  "HTTP - toHaveDataMatching failure",
  {
    tags: ["failure", "http"],
  },
)
  .step("toHaveDataMatching fails", () => {
    expect(dummyResponse).toHaveDataMatching({ status: "ok" });
  })
  .build();

export const toHaveDataProperty = scenario(
  "HTTP - toHaveDataProperty failure",
  {
    tags: ["failure", "http"],
  },
)
  .step("toHaveDataProperty fails when property missing", () => {
    expect(dummyResponse).toHaveDataProperty("success");
  })
  .build();

export const toHaveDuration = scenario("HTTP - toHaveDuration failure", {
  tags: ["failure", "http"],
})
  .step("toHaveDuration fails with wrong duration", () => {
    expect(dummyResponse).toHaveDuration(100);
  })
  .build();

export const toHaveDurationLessThan = scenario(
  "HTTP - toHaveDurationLessThan failure",
  { tags: ["failure", "http"] },
)
  .step("toHaveDurationLessThan fails", () => {
    expect(dummyResponse).toHaveDurationLessThan(1000);
  })
  .build();

export const notToBeOk = scenario("HTTP - not.toBeOk failure", {
  tags: ["failure", "http"],
})
  .step("not.toBeOk fails when ok is true", () => {
    const okResponse = createMockResponse({ ok: true, status: 200 });
    expect(okResponse).not.toBeOk();
  })
  .build();

export default [
  toBeOk,
  toHaveStatus,
  toHaveStatusGreaterThan,
  toHaveStatusLessThan,
  toHaveStatusText,
  toHaveStatusTextContaining,
  toHaveHeaders,
  toHaveHeadersProperty,
  toHaveUrl,
  toHaveUrlContaining,
  toHaveBodyLength,
  toHaveTextContaining,
  toHaveDataMatching,
  toHaveDataProperty,
  toHaveDuration,
  toHaveDurationLessThan,
  notToBeOk,
];
