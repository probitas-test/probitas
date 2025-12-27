/**
 * HTTP Client Failure Examples
 *
 * This file demonstrates failure messages for each HTTP expectation method.
 * All scenarios are expected to fail - they use dummy responses to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import {
  HttpError,
  type HttpResponse,
  type HttpResponseError,
  type HttpResponseSuccess,
} from "jsr:@probitas/client-http@^0";

// Helper to create mock HTTP error response
function createMockErrorResponse(
  overrides: Partial<Omit<HttpResponseError, "kind" | "processed" | "ok">> = {},
): HttpResponseError {
  const bodyBytes = new TextEncoder().encode(
    '{"error":"something went wrong"}',
  );
  const rawResponse = new Response('{"error":"something went wrong"}', {
    status: 500,
    statusText: "Internal Server Error",
    headers: { "content-type": "application/json" },
  });
  const defaultResponse: HttpResponseError = {
    kind: "http",
    processed: true,
    ok: false,
    status: 500,
    statusText: "Internal Server Error",
    headers: new Headers({ "content-type": "application/json" }),
    url: "http://example.com/api",
    body: bodyBytes,
    get arrayBuffer() {
      return bodyBytes.buffer;
    },
    get blob() {
      return new Blob([bodyBytes]);
    },
    get text() {
      return '{"error":"something went wrong"}';
    },
    // deno-lint-ignore no-explicit-any
    get json(): any {
      return { error: "something went wrong" };
    },
    duration: 1500,
    get raw() {
      return rawResponse;
    },
    error: new HttpError(500, "Internal Server Error", {
      headers: new Headers({ "content-type": "application/json" }),
      body: bodyBytes,
    }),
  };
  return { ...defaultResponse, ...overrides };
}

// Helper to create mock HTTP success response
function createMockSuccessResponse(
  overrides: Partial<Omit<HttpResponseSuccess, "kind" | "processed" | "ok">> =
    {},
): HttpResponseSuccess {
  const bodyBytes = new TextEncoder().encode('{"status":"ok"}');
  const rawResponse = new Response('{"status":"ok"}', {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
  });
  const defaultResponse: HttpResponseSuccess = {
    kind: "http",
    processed: true,
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers({ "content-type": "application/json" }),
    url: "http://example.com/api",
    body: bodyBytes,
    get arrayBuffer() {
      return bodyBytes.buffer;
    },
    get blob() {
      return new Blob([bodyBytes]);
    },
    get text() {
      return '{"status":"ok"}';
    },
    // deno-lint-ignore no-explicit-any
    get json(): any {
      return { status: "ok" };
    },
    duration: 100,
    get raw() {
      return rawResponse;
    },
    error: null,
  };
  return { ...defaultResponse, ...overrides };
}

const dummyResponse: HttpResponse = createMockErrorResponse();

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

export const toHaveJsonMatching = scenario(
  "HTTP - toHaveJsonMatching failure",
  {
    tags: ["failure", "http"],
  },
)
  .step("toHaveJsonMatching fails", () => {
    expect(dummyResponse).toHaveJsonMatching({ status: "ok" });
  })
  .build();

export const toHaveJsonProperty = scenario(
  "HTTP - toHaveJsonProperty failure",
  {
    tags: ["failure", "http"],
  },
)
  .step("toHaveJsonProperty fails when property missing", () => {
    expect(dummyResponse).toHaveJsonProperty("success");
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
    const okResponse: HttpResponse = createMockSuccessResponse();
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
  toHaveJsonMatching,
  toHaveJsonProperty,
  toHaveDuration,
  toHaveDurationLessThan,
  notToBeOk,
];
