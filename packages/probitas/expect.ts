/**
 * Re-export the unified expect function from @probitas/expect.
 *
 * This module provides backward compatibility by re-exporting the expect
 * function and related types from the new @probitas/expect package.
 *
 * @deprecated Use `@probitas/expect` directly instead of this re-export.
 * @module
 */

export { expect } from "@probitas/expect";

// Re-export types for backward compatibility
export type {
  ConnectRpcResponse,
  DenoKvResult,
  GraphqlResponse,
  HttpResponse,
  MongoResult,
  RabbitMqResult,
  RedisResult,
  SqlQueryResult,
  SqsResult,
} from "@probitas/expect";
