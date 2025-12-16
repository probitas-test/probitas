/**
 * GraphQL Client Failure Examples
 *
 * This file demonstrates failure messages for each GraphQL expectation method.
 * All scenarios are expected to fail - they use dummy responses to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import type { GraphqlResponse } from "jsr:@probitas/client-graphql@^0";

// Helper to create mock GraphQL response
function createMockResponse(
  overrides: Partial<GraphqlResponse> = {},
): GraphqlResponse {
  const defaultResponse: GraphqlResponse = {
    kind: "graphql",
    ok: false,
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    errors: [
      { message: "Field 'user' not found", path: ["query", "user"] },
      { message: "Unauthorized access", path: ["query", "admin"] },
    ],
    extensions: { code: "VALIDATION_ERROR" },
    // deno-lint-ignore no-explicit-any
    data: <T = any>(): T | null => null,
    duration: 300,
    raw: () =>
      new Response('{"errors":[{"message":"Field not found"}]}', {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  };
  return { ...defaultResponse, ...overrides };
}

const dummyResponse = createMockResponse();

export const toBeOk = scenario("GraphQL - toBeOk failure", {
  tags: ["failure", "graphql"],
})
  .step("toBeOk fails when errors exist", () => {
    expect(dummyResponse).toBeOk();
  })
  .build();

export const toHaveStatus = scenario("GraphQL - toHaveStatus failure", {
  tags: ["failure", "graphql"],
})
  .step("toHaveStatus fails with wrong status", () => {
    expect(dummyResponse).toHaveStatus(201);
  })
  .build();

export const toHaveHeadersMatching = scenario(
  "GraphQL - toHaveHeadersMatching failure",
  { tags: ["failure", "graphql"] },
)
  .step("toHaveHeadersMatching fails with wrong headers", () => {
    expect(dummyResponse).toHaveHeadersMatching({ "x-custom": "value" });
  })
  .build();

export const toHaveHeadersProperty = scenario(
  "GraphQL - toHaveHeadersProperty failure",
  { tags: ["failure", "graphql"] },
)
  .step("toHaveHeadersProperty fails when property missing", () => {
    expect(dummyResponse).toHaveHeadersProperty("x-missing");
  })
  .build();

export const toHaveDataProperty = scenario(
  "GraphQL - toHaveDataProperty failure",
  { tags: ["failure", "graphql"] },
)
  .step("toHaveDataProperty fails when data is null", () => {
    expect(dummyResponse).toHaveDataProperty("user");
  })
  .build();

export const toHaveErrorsEmpty = scenario(
  "GraphQL - toHaveErrorsEmpty failure",
  { tags: ["failure", "graphql"] },
)
  .step("toHaveErrorsEmpty fails when errors exist", () => {
    expect(dummyResponse).toHaveErrorsEmpty();
  })
  .build();

export const toHaveErrorCount = scenario("GraphQL - toHaveErrorCount failure", {
  tags: ["failure", "graphql"],
})
  .step("toHaveErrorCount fails with wrong count", () => {
    expect(dummyResponse).toHaveErrorCount(5);
  })
  .build();

export const toHaveErrorCountLessThan = scenario(
  "GraphQL - toHaveErrorCountLessThan failure",
  { tags: ["failure", "graphql"] },
)
  .step("toHaveErrorCountLessThan fails", () => {
    expect(dummyResponse).toHaveErrorCountLessThan(2);
  })
  .build();

export const toHaveExtensionsMatching = scenario(
  "GraphQL - toHaveExtensionsMatching failure",
  { tags: ["failure", "graphql"] },
)
  .step("toHaveExtensionsMatching fails with wrong extensions", () => {
    expect(dummyResponse).toHaveExtensionsMatching({ code: "DIFFERENT_CODE" });
  })
  .build();

export const toHaveExtensionsProperty = scenario(
  "GraphQL - toHaveExtensionsProperty failure",
  { tags: ["failure", "graphql"] },
)
  .step("toHaveExtensionsProperty fails when property missing", () => {
    expect(dummyResponse).toHaveExtensionsProperty("missingKey");
  })
  .build();

export const toHaveDuration = scenario("GraphQL - toHaveDuration failure", {
  tags: ["failure", "graphql"],
})
  .step("toHaveDuration fails with wrong duration", () => {
    expect(dummyResponse).toHaveDuration(100);
  })
  .build();

export const toHaveDurationLessThan = scenario(
  "GraphQL - toHaveDurationLessThan failure",
  { tags: ["failure", "graphql"] },
)
  .step("toHaveDurationLessThan fails", () => {
    expect(dummyResponse).toHaveDurationLessThan(200);
  })
  .build();

export const notToBeOk = scenario("GraphQL - not.toBeOk failure", {
  tags: ["failure", "graphql"],
})
  .step("not.toBeOk fails when no errors", () => {
    const okResponse = createMockResponse({
      ok: true,
      errors: null,
      // deno-lint-ignore no-explicit-any
      data: <T = any>(): T | null => ({ user: { name: "Alice" } }) as T,
    });
    expect(okResponse).not.toBeOk();
  })
  .build();

export const notToHaveErrorsEmpty = scenario(
  "GraphQL - not.toHaveErrorsEmpty failure",
  { tags: ["failure", "graphql"] },
)
  .step("not.toHaveErrorsEmpty fails when no errors", () => {
    const okResponse = createMockResponse({
      ok: true,
      errors: null,
    });
    expect(okResponse).not.toHaveErrorsEmpty();
  })
  .build();

export default [
  toBeOk,
  toHaveStatus,
  toHaveHeadersMatching,
  toHaveHeadersProperty,
  toHaveDataProperty,
  toHaveErrorsEmpty,
  toHaveErrorCount,
  toHaveErrorCountLessThan,
  toHaveExtensionsMatching,
  toHaveExtensionsProperty,
  toHaveDuration,
  toHaveDurationLessThan,
  notToBeOk,
  notToHaveErrorsEmpty,
];
