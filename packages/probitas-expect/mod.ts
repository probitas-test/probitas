/**
 * Expectation utilities for Probitas client responses.
 *
 * @module
 */

// Unified expect function (recommended)
export { expect } from "./expect.ts";

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
