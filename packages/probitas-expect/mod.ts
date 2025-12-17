/**
 * Type-safe expectation library for Probitas scenario testing with specialized assertions for various client types.
 *
 * This module provides a unified `expect()` function that automatically dispatches to the appropriate
 * expectation based on the input type, along with specialized expectations for each client type.
 *
 * ## Features
 *
 * - **Type-safe expectations**: Compile-time safety with TypeScript
 * - **Unified API**: Single `expect()` function that dispatches to specialized expectations
 * - **Client-specific assertions**: Tailored expectations for HTTP, GraphQL, SQL, Redis, MongoDB, and more
 * - **Method chaining**: Fluent API for readable test assertions
 * - **Consistent naming**: All methods follow `toBeXxx` or `toHaveXxx` patterns
 * - **Generic fallback**: Chainable wrapper for @std/expect matchers
 *
 * ## Usage
 *
 * ### Unified expect Function
 *
 * The `expect()` function automatically dispatches to the appropriate expectation based on the input type:
 *
 * @example HTTP Response expectations
 * ```typescript
 * import type { HttpResponse } from "@probitas/client-http";
 * import { expectHttpResponse } from "./mod.ts";
 *
 * // Mock HTTP response for example
 * const response = {
 *   kind: "http",
 *   ok: true,
 *   status: 200,
 *   statusText: "OK",
 *   headers: new Headers({ "content-type": "application/json" }),
 *   url: "http://example.com/api/users",
 *   body: null,
 *   duration: 100,
 *   text: () => null,
 *   data: () => ({ users: [] }),
 * } as unknown as HttpResponse;
 *
 * expectHttpResponse(response)
 *   .toBeOk()                        // Status 2xx
 *   .toHaveStatus(200);              // Specific status code
 * ```
 *
 * @example GraphQL Response expectations
 * ```typescript
 * import type { GraphqlResponse } from "@probitas/client-graphql";
 * import { expectGraphqlResponse } from "./mod.ts";
 *
 * // Mock GraphQL response for example
 * const response = {
 *   kind: "graphql",
 *   ok: true,
 *   status: 200,
 *   headers: {},
 *   raw: { data: { user: { name: "Alice" } } },
 *   data: () => ({ user: { name: "Alice" } }),
 *   errors: () => [],
 *   duration: 50,
 * } as unknown as GraphqlResponse;
 *
 * expectGraphqlResponse(response)
 *   .toBeOk()
 *   .toHaveDataPresent()
 *   .toHaveErrorCount(0);
 * ```
 *
 * @example SQL Query Result expectations
 * ```typescript
 * import type { SqlQueryResult } from "@probitas/client-sql";
 * import { expectSqlQueryResult } from "./mod.ts";
 *
 * // Mock SQL query result for example
 * const result = {
 *   kind: "sql",
 *   ok: true,
 *   rows: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` })),
 *   rowCount: 10,
 *   duration: 25,
 *   map: <U>(_fn: (row: Record<string, unknown>) => U) => [],
 *   as: <U>() => ({ rows: [] as U[], rowCount: 0 }),
 * } as unknown as SqlQueryResult;
 *
 * expectSqlQueryResult(result)
 *   .toBeOk()
 *   .toHaveRowCount(10);
 * ```
 *
 * @example Generic value expectations (chainable @std/expect)
 * ```typescript
 * import { expect } from "./mod.ts";
 *
 * // All @std/expect matchers are supported
 * expect(42)
 *   .toBe(42)
 *   .toBeGreaterThan(40)
 *   .toBeLessThan(50);
 *
 * // .not modifier works correctly
 * expect("hello")
 *   .not.toBe("world")
 *   .not.toBeNull()
 *   .toContain("ello");
 * ```
 *
 * ## Supported Client Types
 *
 * - **HTTP** - {@linkcode expectHttpResponse} for REST API testing
 * - **GraphQL** - {@linkcode expectGraphqlResponse} for GraphQL queries
 * - **ConnectRPC** - {@linkcode expectConnectRpcResponse} for RPC calls
 * - **gRPC** - {@linkcode expectGrpcResponse} for gRPC calls
 * - **SQL** - {@linkcode expectSqlQueryResult} for database queries
 * - **Redis** - {@linkcode expectRedisResult} for Redis operations
 * - **MongoDB** - {@linkcode expectMongoResult} for MongoDB operations
 * - **Deno KV** - {@linkcode expectDenoKvResult} for Deno KV operations
 * - **RabbitMQ** - {@linkcode expectRabbitMqResult} for message queue operations
 * - **SQS** - {@linkcode expectSqsResult} for AWS SQS operations
 *
 * All expectation methods follow a consistent naming pattern (`toBeXxx`, `toHaveXxx`) and support method chaining for fluent assertions.
 *
 * ## Method Naming Convention
 *
 * All expectation methods follow these patterns:
 *
 * - `toBeXxx()` - Assertions about the state (e.g., `toBeOk()`, `toBeNull()`)
 * - `toHaveXxx()` - Assertions about properties (e.g., `toHaveStatus()`, `toHaveLength()`)
 * - `toMatchXxx()` - Pattern matching (e.g., `toMatchObject()`)
 * - Comparison methods use full names (e.g., `toBeGreaterThan()`, `toBeLessThanOrEqual()`)
 *
 * ## Negation with .not
 *
 * All expectation types support the `.not` modifier to negate assertions:
 *
 * @example Using .not modifier
 * ```typescript
 * import type { HttpResponse } from "@probitas/client-http";
 * import { expect, expectHttpResponse } from "./mod.ts";
 *
 * // Mock HTTP response for example
 * const response = {
 *   kind: "http",
 *   ok: true,
 *   status: 200,
 *   statusText: "OK",
 *   headers: new Headers(),
 *   url: "http://example.com",
 *   body: null,
 *   duration: 50,
 *   text: () => null,
 *   data: () => ({}),
 * } as unknown as HttpResponse;
 *
 * expectHttpResponse(response)
 *   .not.toHaveStatus(404)
 *   .toHaveStatus(200);
 *
 * expect(42)
 *   .not.toBe(43)
 *   .not.toBeNull();
 * ```
 *
 * The `.not` modifier only affects the immediately following assertion, then resets to non-negated state:
 *
 * @example .not scoping
 * ```typescript
 * import { expect } from "./mod.ts";
 *
 * expect(42)
 *   .not.toBe(43)         // Negated
 *   .toBeGreaterThan(40); // Not negated
 * ```
 *
 * ## Chainable Expectations for Generic Values
 *
 * For values that don't match any specific client type, `expect()` falls back to {@linkcode expectAnything},
 * a chainable wrapper around @std/expect:
 *
 * @example Chaining generic expectations
 * ```typescript
 * import { expect } from "./mod.ts";
 *
 * // All @std/expect matchers are supported
 * expect(42)
 *   .toBe(42)
 *   .toBeGreaterThan(40)
 *   .toBeLessThan(50);
 *
 * // .not modifier works correctly
 * expect("hello")
 *   .not.toBe("world")
 *   .not.toBeNull()
 *   .toContain("ello");
 *
 * // Complex assertions
 * expect({ a: 1, b: 2, c: 3 })
 *   .toMatchObject({ a: 1 })
 *   .toHaveProperty("b", 2)
 *   .not.toBeNull();
 * ```
 *
 * **Note:** `.resolves` and `.rejects` are intentionally not supported as they require `.then()` chaining,
 * which degrades the UX compared to synchronous method chaining.
 *
 * ## Migration from 0.3.x
 *
 * If you're upgrading from Probitas 0.3.x, see the [Migration Guide](../../docs/migration-from-0.3.6.md)
 * for detailed information about breaking changes.
 *
 * Key changes in 0.4.0:
 * - Method names updated to follow `toBeXxx` / `toHaveXxx` patterns
 * - `ok()` → `toBeOk()`
 * - `data()` → `toHaveContent()`
 * - `dataContains()` → `toHaveContentContaining()`
 *
 * @module
 */

// Unified expect function (recommended)
export { expect } from "./expect.ts";

// Error types
export { ExpectationError, isExpectationError } from "./error.ts";

// Chainable wrapper for @std/expect
export { type AnythingExpectation, expectAnything } from "./anything.ts";

// HTTP
export { expectHttpResponse } from "./http.ts";
export type * from "@probitas/client-http";

// GraphQL
export { expectGraphqlResponse } from "./graphql.ts";
export type * from "@probitas/client-graphql";

// ConnectRPC
export { expectConnectRpcResponse } from "./connectrpc.ts";
export type * from "@probitas/client-connectrpc";

// gRPC
export { expectGrpcResponse } from "./grpc.ts";
export type * from "@probitas/client-grpc";

// Redis
export { expectRedisResult } from "./redis.ts";
export type * from "@probitas/client-redis";

// MongoDB
export { expectMongoResult } from "./mongodb.ts";
export type * from "@probitas/client-mongodb";

// Deno KV
export { expectDenoKvResult } from "./deno_kv.ts";
export type * from "@probitas/client-deno-kv";

// SQS
export { expectSqsResult } from "./sqs.ts";
export type * from "@probitas/client-sqs";

// RabbitMQ
export { expectRabbitMqResult } from "./rabbitmq.ts";
export type * from "@probitas/client-rabbitmq";

// SQL
export { expectSqlQueryResult, type SqlQueryResultExpectation } from "./sql.ts";
export type * from "@probitas/client-sql";
