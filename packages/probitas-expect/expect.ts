/**
 * Unified expect function that dispatches to the appropriate expectation function
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
import { type AnythingExpectation, expectAnything } from "./anything.ts";

import type { ConnectRpcResponse } from "@probitas/client-connectrpc";
import type { DenoKvResult } from "@probitas/client-deno-kv";
import type { GraphqlResponse } from "@probitas/client-graphql";
import type { HttpResponse } from "@probitas/client-http";
import type { MongoResult } from "@probitas/client-mongodb";
import type { RabbitMqResult } from "@probitas/client-rabbitmq";
import type { RedisResult } from "@probitas/client-redis";
import type { SqlQueryResult } from "@probitas/client-sql";
import type { SqsResult } from "@probitas/client-sqs";

/**
 * Extract row type from SqlQueryResult<T>
 */
type ExtractSqlRowType<T> = T extends SqlQueryResult<infer R> ? R : never;

/**
 * Type guard for objects with a `kind` property
 */
function hasKind(value: unknown): value is { kind: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    typeof (value as { kind: unknown }).kind === "string"
  );
}

/**
 * Unified expect function that dispatches to the appropriate expectation function
 * based on the type of the input object.
 *
 * @example
 * ```ts
 * import { expect } from "./expect.ts";
 *
 * // Falls back to expectAnything (chainable @std/expect) for other values
 * expect(42).toBe(42).toBeGreaterThan(40);
 * expect("hello world").toContain("world");
 * expect({ a: 1, b: 2 }).toMatchObject({ a: 1 });
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
): SqlQueryResultExpectation;
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
export function expect(value: unknown): AnythingExpectation;
export function expect(value: unknown): unknown {
  if (hasKind(value)) {
    const { kind } = value;

    // Exact kind matches
    if (kind === "http") {
      return expectHttpResponse(value as unknown as HttpResponse);
    }
    if (kind === "connectrpc") {
      return expectConnectRpcResponse(value as unknown as ConnectRpcResponse);
    }
    if (kind === "graphql") {
      return expectGraphqlResponse(value as unknown as GraphqlResponse);
    }
    if (kind === "sql") {
      return expectSqlQueryResult(value as unknown as SqlQueryResult);
    }

    // Prefix-based kind matches
    if (kind.startsWith("deno-kv:")) {
      return expectDenoKvResult(value as unknown as DenoKvResult);
    }
    if (kind.startsWith("redis:")) {
      return expectRedisResult(value as unknown as RedisResult);
    }
    if (kind.startsWith("mongo:")) {
      return expectMongoResult(value as unknown as MongoResult);
    }
    if (kind.startsWith("rabbitmq:")) {
      return expectRabbitMqResult(value as unknown as RabbitMqResult);
    }
    if (kind.startsWith("sqs:")) {
      return expectSqsResult(value as unknown as SqsResult);
    }
  }

  // Fallback to expectAnything (chainable @std/expect wrapper)
  return expectAnything(value);
}
