/**
 * gRPC Client Failure Examples
 *
 * This file demonstrates failure messages for each gRPC expectation method.
 * All scenarios are expected to fail - they use dummy responses to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import type { GrpcResponse } from "jsr:@probitas/client-grpc@^0";

// Helper to create mock gRPC response
function createMockResponse(
  overrides: Partial<GrpcResponse> = {},
): GrpcResponse {
  const defaultResponse: GrpcResponse = {
    kind: "connectrpc",
    ok: false,
    statusCode: 5, // NOT_FOUND
    statusMessage: "Resource not found",
    headers: new Headers({ "grpc-status": "5" }),
    trailers: new Headers({ "grpc-message": "not found" }),
    // deno-lint-ignore no-explicit-any
    data: <T = any>(): T | null => null,
    duration: 250,
    raw: () => ({}),
  };
  return { ...defaultResponse, ...overrides };
}

const dummyResponse = createMockResponse();

export const toBeOk = scenario("gRPC - toBeOk failure", {
  tags: ["failure", "grpc"],
})
  .step("toBeOk fails when statusCode is not 0", () => {
    expect(dummyResponse).toBeOk();
  })
  .build();

export const toHaveStatusCode = scenario("gRPC - toHaveStatusCode failure", {
  tags: ["failure", "grpc"],
})
  .step("toHaveStatusCode fails with wrong code", () => {
    expect(dummyResponse).toHaveStatusCode(0);
  })
  .build();

export const toHaveStatusCodeGreaterThan = scenario(
  "gRPC - toHaveStatusCodeGreaterThan failure",
  { tags: ["failure", "grpc"] },
)
  .step("toHaveStatusCodeGreaterThan fails", () => {
    expect(dummyResponse).toHaveStatusCodeGreaterThan(10);
  })
  .build();

export const toHaveStatusCodeLessThan = scenario(
  "gRPC - toHaveStatusCodeLessThan failure",
  { tags: ["failure", "grpc"] },
)
  .step("toHaveStatusCodeLessThan fails", () => {
    expect(dummyResponse).toHaveStatusCodeLessThan(5);
  })
  .build();

export const toHaveStatusMessage = scenario(
  "gRPC - toHaveStatusMessage failure",
  { tags: ["failure", "grpc"] },
)
  .step("toHaveStatusMessage fails with wrong message", () => {
    expect(dummyResponse).toHaveStatusMessage("OK");
  })
  .build();

export const toHaveStatusMessageContaining = scenario(
  "gRPC - toHaveStatusMessageContaining failure",
  { tags: ["failure", "grpc"] },
)
  .step("toHaveStatusMessageContaining fails", () => {
    expect(dummyResponse).toHaveStatusMessageContaining("success");
  })
  .build();

export const toHaveHeadersMatching = scenario(
  "gRPC - toHaveHeadersMatching failure",
  { tags: ["failure", "grpc"] },
)
  .step("toHaveHeadersMatching fails with wrong headers", () => {
    expect(dummyResponse).toHaveHeadersMatching({ "x-custom": "value" });
  })
  .build();

export const toHaveHeadersProperty = scenario(
  "gRPC - toHaveHeadersProperty failure",
  { tags: ["failure", "grpc"] },
)
  .step("toHaveHeadersProperty fails when property missing", () => {
    expect(dummyResponse).toHaveHeadersProperty("x-missing");
  })
  .build();

export const toHaveTrailersMatching = scenario(
  "gRPC - toHaveTrailersMatching failure",
  { tags: ["failure", "grpc"] },
)
  .step("toHaveTrailersMatching fails with wrong trailers", () => {
    expect(dummyResponse).toHaveTrailersMatching({ "custom-trailer": "value" });
  })
  .build();

export const toHaveTrailersProperty = scenario(
  "gRPC - toHaveTrailersProperty failure",
  { tags: ["failure", "grpc"] },
)
  .step("toHaveTrailersProperty fails when property missing", () => {
    expect(dummyResponse).toHaveTrailersProperty("missing-trailer");
  })
  .build();

export const toHaveDataMatching = scenario(
  "gRPC - toHaveDataMatching failure",
  { tags: ["failure", "grpc"] },
)
  .step("toHaveDataMatching fails", () => {
    expect(dummyResponse).toHaveDataMatching({ id: 1 });
  })
  .build();

export const toHaveDataProperty = scenario(
  "gRPC - toHaveDataProperty failure",
  { tags: ["failure", "grpc"] },
)
  .step("toHaveDataProperty fails when data is null", () => {
    expect(dummyResponse).toHaveDataProperty("message");
  })
  .build();

export const toHaveDuration = scenario("gRPC - toHaveDuration failure", {
  tags: ["failure", "grpc"],
})
  .step("toHaveDuration fails with wrong duration", () => {
    expect(dummyResponse).toHaveDuration(100);
  })
  .build();

export const toHaveDurationLessThan = scenario(
  "gRPC - toHaveDurationLessThan failure",
  { tags: ["failure", "grpc"] },
)
  .step("toHaveDurationLessThan fails", () => {
    expect(dummyResponse).toHaveDurationLessThan(200);
  })
  .build();

export const notToBeOk = scenario("gRPC - not.toBeOk failure", {
  tags: ["failure", "grpc"],
})
  .step("not.toBeOk fails when statusCode is 0", () => {
    const okResponse = createMockResponse({
      ok: true,
      statusCode: 0,
      statusMessage: "OK",
    });
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
