/**
 * GraphQL Client Failure Examples
 *
 * This file demonstrates failure messages for each GraphQL expectation method.
 * All scenarios are expected to fail - they use dummy responses to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import {
  GraphqlExecutionError,
  type GraphqlResponse,
  type GraphqlResponseError,
  type GraphqlResponseSuccess,
} from "jsr:@probitas/client-graphql@^0";

// Helper to create mock GraphQL error response
function createMockErrorResponse(): GraphqlResponseError {
  const error = new GraphqlExecutionError([
    {
      message: "Field 'user' not found",
      path: ["query", "user"],
      locations: [],
      extensions: {},
    },
    {
      message: "Unauthorized access",
      path: ["query", "admin"],
      locations: [],
      extensions: {},
    },
  ]);
  const response: GraphqlResponseError = {
    kind: "graphql",
    processed: true,
    ok: false,
    error,
    url: "http://example.com/graphql",
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    extensions: { code: "VALIDATION_ERROR" },
    data: null,
    duration: 300,
    raw: new Response('{"errors":[{"message":"Field not found"}]}', {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  };
  return response;
}

// Helper to create mock GraphQL success response
function createMockSuccessResponse(): GraphqlResponseSuccess {
  const response: GraphqlResponseSuccess = {
    kind: "graphql",
    processed: true,
    ok: true,
    error: null,
    url: "http://example.com/graphql",
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    extensions: null,
    data: { user: { name: "Alice" } },
    duration: 100,
    raw: new Response('{"data":{"user":{"name":"Alice"}}}', {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  };
  return response;
}

const dummyResponse: GraphqlResponse = createMockErrorResponse();

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

export const toHaveErrorNull = scenario(
  "GraphQL - toHaveErrorNull failure",
  { tags: ["failure", "graphql"] },
)
  .step("toHaveErrorNull fails when error exists", () => {
    expect(dummyResponse).toHaveErrorNull();
  })
  .build();

export const toHaveErrorPresent = scenario(
  "GraphQL - toHaveErrorPresent failure",
  { tags: ["failure", "graphql"] },
)
  .step("toHaveErrorPresent fails when no error", () => {
    const okResponse: GraphqlResponse = createMockSuccessResponse();
    expect(okResponse).toHaveErrorPresent();
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
    const okResponse: GraphqlResponse = createMockSuccessResponse();
    expect(okResponse).not.toBeOk();
  })
  .build();

export const notToHaveErrorNull = scenario(
  "GraphQL - not.toHaveErrorNull failure",
  { tags: ["failure", "graphql"] },
)
  .step("not.toHaveErrorNull fails when no error", () => {
    const okResponse: GraphqlResponse = createMockSuccessResponse();
    expect(okResponse).not.toHaveErrorNull();
  })
  .build();

export default [
  toBeOk,
  toHaveStatus,
  toHaveHeadersMatching,
  toHaveHeadersProperty,
  toHaveDataProperty,
  toHaveErrorNull,
  toHaveErrorPresent,
  toHaveExtensionsMatching,
  toHaveExtensionsProperty,
  toHaveDuration,
  toHaveDurationLessThan,
  notToBeOk,
  notToHaveErrorNull,
];
