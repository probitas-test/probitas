/**
 * Unified expect function that dispatches to the appropriate expectXXXXX function
 * based on the type of the input object.
 *
 * @module
 */

import { expectConnectRpcResponse } from "./connectrpc.ts";
import { expectDenoKvResult } from "./deno_kv.ts";
import { expectGraphqlResponse } from "./graphql.ts";
import { expectHttpResponse } from "./http.ts";
import { expectMongoResult } from "./mongodb.ts";
import { expectRabbitMqResult } from "./rabbitmq.ts";
import { expectRedisResult } from "./redis.ts";
import { expectSqlQueryResult, type SqlQueryResultExpectation } from "./sql.ts";
import { expectSqsResult } from "./sqs.ts";

import type { ConnectRpcResponse } from "@probitas/client-connectrpc";
import type { DenoKvResult } from "@probitas/client-deno-kv";
import type { GraphqlResponse } from "@probitas/client-graphql";
import type { HttpResponse } from "@probitas/client-http";
import type { MongoResult } from "@probitas/client-mongodb";
import type { RabbitMqResult } from "@probitas/client-rabbitmq";
import type { RedisResult } from "@probitas/client-redis";
import type { SqlQueryResult } from "@probitas/client-sql";
import type { SqsResult } from "@probitas/client-sqs";

import { expect as expectStd } from "@std/expect";

/**
 * Extract row type from SqlQueryResult<T>
 */
type ExtractSqlRowType<T> = T extends SqlQueryResult<infer R> ? R : never;

/**
 * Type guard for objects with a `type` property
 */
function hasType(value: unknown): value is { type: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string"
  );
}

/**
 * Unified expect function that dispatches to the appropriate expectXXXXX function
 * based on the type of the input object.
 *
 * @example
 * ```ts
 * // HTTP response
 * const httpRes = await http.get("/users");
 * expect(httpRes).ok().dataContains({ users: [] });
 *
 * // GraphQL response
 * const gqlRes = await graphql.query("{ users { id name } }");
 * expect(gqlRes).ok().hasContent();
 *
 * // SQL query result
 * const sqlRes = await db.query("SELECT * FROM users");
 * expect(sqlRes).ok().count(10);
 *
 * // MongoDB result
 * const mongoRes = await mongo.find({ status: "active" });
 * expect(mongoRes).ok().count(10);
 *
 * // Falls back to @std/expect for other values
 * expect(42).toBe(42);
 * ```
 */
export function expect<T extends HttpResponse>(
  value: T,
): ReturnType<typeof expectHttpResponse>;
export function expect<T extends ConnectRpcResponse>(
  value: T,
): ReturnType<typeof expectConnectRpcResponse>;
export function expect<T extends GraphqlResponse>(
  value: T,
): ReturnType<typeof expectGraphqlResponse>;
export function expect<T extends SqlQueryResult>(
  value: T,
): SqlQueryResultExpectation<ExtractSqlRowType<T>>;
export function expect<T extends DenoKvResult>(
  value: T,
): ReturnType<typeof expectDenoKvResult<T>>;
export function expect<T extends RedisResult>(
  value: T,
): ReturnType<typeof expectRedisResult<T>>;
export function expect<T extends MongoResult>(
  value: T,
): ReturnType<typeof expectMongoResult<T>>;
export function expect<T extends RabbitMqResult>(
  value: T,
): ReturnType<typeof expectRabbitMqResult<T>>;
export function expect<T extends SqsResult>(
  value: T,
): ReturnType<typeof expectSqsResult<T>>;
export function expect<T>(value: T): ReturnType<typeof expectStd>;
export function expect(value: unknown): unknown {
  if (hasType(value)) {
    const { type } = value;

    // Exact type matches
    if (type === "http") {
      return expectHttpResponse(value as unknown as HttpResponse);
    }
    if (type === "connectrpc") {
      return expectConnectRpcResponse(value as unknown as ConnectRpcResponse);
    }
    if (type === "graphql") {
      return expectGraphqlResponse(value as unknown as GraphqlResponse);
    }
    if (type === "sql") {
      return expectSqlQueryResult(value as unknown as SqlQueryResult);
    }

    // Prefix-based type matches
    if (type.startsWith("deno-kv:")) {
      return expectDenoKvResult(value as unknown as DenoKvResult);
    }
    if (type.startsWith("redis:")) {
      return expectRedisResult(value as unknown as RedisResult);
    }
    if (type.startsWith("mongo:")) {
      return expectMongoResult(value as unknown as MongoResult);
    }
    if (type.startsWith("rabbitmq:")) {
      return expectRabbitMqResult(value as unknown as RabbitMqResult);
    }
    if (type.startsWith("sqs:")) {
      return expectSqsResult(value as unknown as SqsResult);
    }
  }

  // Fallback to @std/expect
  return expectStd(value);
}
