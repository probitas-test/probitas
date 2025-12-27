/**
 * ConnectRPC Client Failure Examples
 *
 * This file demonstrates failure messages for each ConnectRPC expectation method.
 * All scenarios are expected to fail - they use dummy responses to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import {
  ConnectRpcError,
  type ConnectRpcResponse,
  type ConnectRpcResponseError,
  type ConnectRpcResponseSuccess,
} from "jsr:@probitas/client-connectrpc@^0";

// Helper to create mock ConnectRPC error response
function createMockErrorResponse(): ConnectRpcResponse {
  const error = new ConnectRpcError(
    "Invalid argument provided",
    3,
    "INVALID_ARGUMENT",
  );
  const response: ConnectRpcResponseError = {
    kind: "connectrpc",
    processed: true,
    ok: false,
    error,
    statusCode: 3,
    statusMessage: "Invalid argument provided",
    headers: new Headers({ "content-type": "application/proto" }),
    trailers: new Headers(),
    data: null,
    duration: 150,
    // deno-lint-ignore no-explicit-any
    raw: error as any,
  };
  return response;
}

// Helper to create mock ConnectRPC success response
function createMockSuccessResponse(): ConnectRpcResponse {
  const response: ConnectRpcResponseSuccess = {
    kind: "connectrpc",
    processed: true,
    ok: true,
    error: null,
    statusCode: 0,
    statusMessage: null,
    headers: new Headers(),
    trailers: new Headers(),
    // deno-lint-ignore no-explicit-any
    data: <T = any>(): T | null => ({ message: "ok" }) as T,
    duration: 50,
    raw: () => ({}),
  };
  return response;
}

const dummyResponse: ConnectRpcResponse = createMockErrorResponse();

export const toBeOk = scenario("ConnectRPC - toBeOk failure", {
  tags: ["failure", "connectrpc"],
})
  .step("toBeOk fails when statusCode is not 0", () => {
    expect(dummyResponse).toBeOk();
  })
  .build();

export const toHaveStatusCode = scenario(
  "ConnectRPC - toHaveStatusCode failure",
  { tags: ["failure", "connectrpc"] },
)
  .step("toHaveStatusCode fails with wrong code", () => {
    expect(dummyResponse).toHaveStatusCode(0);
  })
  .build();

export const toHaveStatusCodeGreaterThan = scenario(
  "ConnectRPC - toHaveStatusCodeGreaterThan failure",
  { tags: ["failure", "connectrpc"] },
)
  .step("toHaveStatusCodeGreaterThan fails", () => {
    expect(dummyResponse).toHaveStatusCodeGreaterThan(5);
  })
  .build();

export const toHaveStatusCodeLessThan = scenario(
  "ConnectRPC - toHaveStatusCodeLessThan failure",
  { tags: ["failure", "connectrpc"] },
)
  .step("toHaveStatusCodeLessThan fails", () => {
    expect(dummyResponse).toHaveStatusCodeLessThan(3);
  })
  .build();

export const toHaveStatusMessage = scenario(
  "ConnectRPC - toHaveStatusMessage failure",
  { tags: ["failure", "connectrpc"] },
)
  .step("toHaveStatusMessage fails with wrong message", () => {
    expect(dummyResponse).toHaveStatusMessage("OK");
  })
  .build();

export const toHaveStatusMessageContaining = scenario(
  "ConnectRPC - toHaveStatusMessageContaining failure",
  { tags: ["failure", "connectrpc"] },
)
  .step("toHaveStatusMessageContaining fails", () => {
    expect(dummyResponse).toHaveStatusMessageContaining("success");
  })
  .build();

export const toHaveHeadersMatching = scenario(
  "ConnectRPC - toHaveHeadersMatching failure",
  { tags: ["failure", "connectrpc"] },
)
  .step("toHaveHeadersMatching fails with wrong headers", () => {
    expect(dummyResponse).toHaveHeadersMatching({ "x-custom": "value" });
  })
  .build();

export const toHaveHeadersProperty = scenario(
  "ConnectRPC - toHaveHeadersProperty failure",
  { tags: ["failure", "connectrpc"] },
)
  .step("toHaveHeadersProperty fails when property missing", () => {
    expect(dummyResponse).toHaveHeadersProperty("x-missing");
  })
  .build();

export const toHaveTrailersMatching = scenario(
  "ConnectRPC - toHaveTrailersMatching failure",
  { tags: ["failure", "connectrpc"] },
)
  .step("toHaveTrailersMatching fails with wrong trailers", () => {
    expect(dummyResponse).toHaveTrailersMatching({ "custom-trailer": "value" });
  })
  .build();

export const toHaveTrailersProperty = scenario(
  "ConnectRPC - toHaveTrailersProperty failure",
  { tags: ["failure", "connectrpc"] },
)
  .step("toHaveTrailersProperty fails when property missing", () => {
    expect(dummyResponse).toHaveTrailersProperty("missing-trailer");
  })
  .build();

export const toHaveDataMatching = scenario(
  "ConnectRPC - toHaveDataMatching failure",
  { tags: ["failure", "connectrpc"] },
)
  .step("toHaveDataMatching fails", () => {
    expect(dummyResponse).toHaveDataMatching({ id: 1 });
  })
  .build();

export const toHaveDataProperty = scenario(
  "ConnectRPC - toHaveDataProperty failure",
  { tags: ["failure", "connectrpc"] },
)
  .step("toHaveDataProperty fails when data is null", () => {
    expect(dummyResponse).toHaveDataProperty("message");
  })
  .build();

export const toHaveDuration = scenario("ConnectRPC - toHaveDuration failure", {
  tags: ["failure", "connectrpc"],
})
  .step("toHaveDuration fails with wrong duration", () => {
    expect(dummyResponse).toHaveDuration(50);
  })
  .build();

export const toHaveDurationLessThan = scenario(
  "ConnectRPC - toHaveDurationLessThan failure",
  { tags: ["failure", "connectrpc"] },
)
  .step("toHaveDurationLessThan fails", () => {
    expect(dummyResponse).toHaveDurationLessThan(100);
  })
  .build();

export const notToBeOk = scenario("ConnectRPC - not.toBeOk failure", {
  tags: ["failure", "connectrpc"],
})
  .step("not.toBeOk fails when statusCode is 0", () => {
    const okResponse: ConnectRpcResponse = createMockSuccessResponse();
    expect(okResponse).not.toBeOk();
  })
  .build();

export default [
  toBeOk,
  toHaveStatusCode,
  toHaveStatusCodeGreaterThan,
  toHaveStatusCodeLessThan,
  toHaveStatusMessage,
  toHaveStatusMessageContaining,
  toHaveHeadersMatching,
  toHaveHeadersProperty,
  toHaveTrailersMatching,
  toHaveTrailersProperty,
  toHaveDataMatching,
  toHaveDataProperty,
  toHaveDuration,
  toHaveDurationLessThan,
  notToBeOk,
];
