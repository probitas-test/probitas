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
 * import { client, expect, scenario } from "@probitas/probitas";
 *
 * export default scenario("API Test")
 *   .resource("http", () =>
 *     client.http.createHttpClient({ url: "http://localhost:3000" }))
 *   .step("GET /api/users", async (ctx) => {
 *     const { http } = ctx.resources;
 *     const response = await http.get("/api/users");
 *
 *     expect(response)
 *       .toBeSuccessful()                    // Status 2xx
 *       .toHaveStatus(200)                   // Specific status code
 *       .toHaveContentType(/application\/json/)
 *       .toMatchObject({ users: [] });
 *   })
 *   .build();
 * ```
 *
 * @example GraphQL Response expectations
 * ```typescript
 * import { client, expect, scenario } from "@probitas/probitas";
 *
 * export default scenario("GraphQL Test")
 *   .resource("gql", () =>
 *     client.graphql.createGraphQLClient({
 *       endpoint: "http://localhost:4000/graphql",
 *     }))
 *   .step("Query user", async (ctx) => {
 *     const { gql } = ctx.resources;
 *     const response = await gql.query("{ user(id: 1) { name } }");
 *
 *     expect(response)
 *       .toBeSuccessful()
 *       .toHaveContent()
 *       .toMatchObject({ user: { name: "Alice" } })
 *       .toHaveErrorCount(0);
 *   })
 *   .build();
 * ```
 *
 * @example SQL Query Result expectations
 * ```typescript
 * import { client, expect, scenario } from "@probitas/probitas";
 *
 * export default scenario("Database Test")
 *   .resource("db", () =>
 *     client.sql.postgres.createPostgresClient({
 *       url: "postgres://localhost/testdb",
 *     }))
 *   .step("Query users", async (ctx) => {
 *     const { db } = ctx.resources;
 *     const result = await db.query("SELECT * FROM users");
 *
 *     expect(result)
 *       .toBeSuccessful()
 *       .toHaveLength(10)
 *       .toMatchObject({ name: "Alice" });
 *   })
 *   .build();
 * ```
 *
 * @example Generic value expectations (chainable @std/expect)
 * ```typescript
 * import { expect, scenario } from "@probitas/probitas";
 *
 * export default scenario("Value Test")
 *   .step("Validate number", () => {
 *     // All @std/expect matchers are supported
 *     expect(42)
 *       .toBe(42)
 *       .toBeGreaterThan(40)
 *       .toBeLessThan(50);
 *   })
 *   .step("Validate string", () => {
 *     // .not modifier works correctly
 *     expect("hello")
 *       .not.toBe("world")
 *       .not.toBeNull()
 *       .toContain("ello");
 *   })
 *   .build();
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
 * - `toBeXxx()` - Assertions about the state (e.g., `toBeSuccessful()`, `toBeNull()`)
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
 * import { client, expect, scenario } from "@probitas/probitas";
 *
 * export default scenario("Negation Test")
 *   .resource("http", () =>
 *     client.http.createHttpClient({ url: "http://localhost:3000" }))
 *   .step("Check response", async (ctx) => {
 *     const { http } = ctx.resources;
 *     const response = await http.get("/api/data");
 *
 *     expect(response)
 *       .not.toHaveStatus(404)
 *       .not.toHaveHeader("x-custom-header");
 *   })
 *   .step("Check value", () => {
 *     expect(42)
 *       .not.toBe(43)
 *       .not.toBeNull();
 *   })
 *   .build();
 * ```
 *
 * The `.not` modifier only affects the immediately following assertion, then resets to non-negated state:
 *
 * @example .not scoping
 * ```typescript
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
 * import { expect, scenario } from "@probitas/probitas";
 *
 * export default scenario("Generic Value Test")
 *   .step("Validate number", () => {
 *     // All @std/expect matchers are supported
 *     expect(42)
 *       .toBe(42)
 *       .toBeGreaterThan(40)
 *       .toBeLessThan(50);
 *   })
 *   .step("Validate string", () => {
 *     // .not modifier works correctly
 *     expect("hello")
 *       .not.toBe("world")
 *       .not.toBeNull()
 *       .toContain("ello");
 *   })
 *   .step("Validate object", () => {
 *     // Complex assertions
 *     expect({ a: 1, b: 2, c: 3 })
 *       .toMatchObject({ a: 1 })
 *       .toHaveProperty("b", 2)
 *       .not.toBeNull();
 *   })
 *   .build();
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
 * - `ok()` → `toBeSuccessful()`
 * - `data()` → `toHaveContent()`
 * - `dataContains()` → `toHaveContentContaining()`
 *
 * @module
 */

// Unified expect function (recommended)
export { expect } from "./expect.ts";

// Chainable wrapper for @std/expect
export { type AnythingExpectation, expectAnything } from "./anything.ts";

// Common utilities
export {
  buildErrorMessage,
  containsSubarray,
  containsSubset,
  formatDifferences,
  formatValue,
  stripAnsi,
} from "./common.ts";

// HTTP
export { expectHttpResponse } from "./http.ts";
export type { HttpResponse } from "@probitas/client-http";

// GraphQL
export { expectGraphqlResponse } from "./graphql.ts";
export type { GraphqlResponse } from "@probitas/client-graphql";

// ConnectRPC
export { expectConnectRpcResponse } from "./connectrpc.ts";
export type { ConnectRpcResponse } from "@probitas/client-connectrpc";

// gRPC
export { expectGrpcResponse } from "./grpc.ts";
export type { GrpcResponse } from "@probitas/client-grpc";

// Redis
export { expectRedisResult } from "./redis.ts";
export type { RedisResult } from "@probitas/client-redis";

// MongoDB
export { expectMongoResult } from "./mongodb.ts";
export type { MongoResult } from "@probitas/client-mongodb";

// Deno KV
export { expectDenoKvResult } from "./deno_kv.ts";
export type { DenoKvResult } from "@probitas/client-deno-kv";

// SQS
export { expectSqsMessage, expectSqsResult } from "./sqs.ts";
export type { SqsResult } from "@probitas/client-sqs";

// RabbitMQ
export { expectRabbitMqResult } from "./rabbitmq.ts";
export type { RabbitMqResult } from "@probitas/client-rabbitmq";

// SQL
export { expectSqlQueryResult, type SqlQueryResultExpectation } from "./sql.ts";
export type { SqlQueryResult } from "@probitas/client-sql";
