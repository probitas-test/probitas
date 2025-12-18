/**
 * Tests for unified expect function
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  type ConnectRpcResponse,
  expect,
  type GraphqlResponse,
  type HttpResponse,
} from "./expect.ts";
import type {
  DenoKvGetResult,
  DenoKvSetResult,
} from "@probitas/client-deno-kv";
import type {
  MongoFindResult,
  MongoInsertOneResult,
} from "@probitas/client-mongodb";
import type {
  RabbitMqConsumeResult,
  RabbitMqPublishResult,
} from "@probitas/client-rabbitmq";
import type { RedisGetResult, RedisSetResult } from "@probitas/client-redis";
import type { SqlQueryResult } from "@probitas/client-sql";
import type { SqsReceiveResult, SqsSendResult } from "@probitas/client-sqs";

describe("expect", () => {
  describe("type dispatch", () => {
    it("dispatches HttpResponse to expectHttpResponse", () => {
      const httpResponse: HttpResponse = {
        kind: "http" as const,
        processed: true,
        ok: true,
        error: null,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        url: "http://example.com",
        body: null,
        duration: 100,
        raw: () => new Response(),
        arrayBuffer: () => null,
        blob: () => null,
        text: () => null,
        json: () => null,
      };

      const result = expect(httpResponse);
      // HttpResponseExpectation has toBeOk() method that returns this
      assertEquals(typeof result.toBeOk, "function");
      assertEquals(typeof result.toHaveStatus, "function");
      assertEquals(typeof result.toHaveJsonMatching, "function");
    });

    it("dispatches ConnectRpcResponse to expectConnectRpcResponse", () => {
      const connectRpcResponse: ConnectRpcResponse = {
        kind: "connectrpc" as const,
        processed: true,
        ok: true,
        error: null,
        statusCode: 0,
        statusMessage: null,
        headers: new Headers(),
        trailers: new Headers(),
        duration: 100,
        data: <T = unknown>() => ({} as T | null),
        raw: () => ({} as Response),
      };

      const result = expect(connectRpcResponse);
      assertEquals(typeof result.toBeOk, "function");
      assertEquals(typeof result.toHaveStatusCode, "function");
    });

    it("dispatches GraphqlResponse to expectGraphqlResponse", () => {
      const graphqlResponse: GraphqlResponse = {
        kind: "graphql" as const,
        processed: true,
        ok: true,
        error: null,
        duration: 100,
        status: 200,
        headers: new Headers(),
        url: "http://localhost:4000/graphql",
        raw: () => new Response(),
        data: <T = unknown>() => ({} as T | null),
      };

      const result = expect(graphqlResponse);
      assertEquals(typeof result.toBeOk, "function");
      assertEquals(typeof result.toHaveData, "function");
    });

    it("dispatches SqlQueryResult to expectSqlQueryResult", () => {
      const sqlResult: SqlQueryResult = {
        kind: "sql" as const,
        processed: true,
        ok: true,
        error: null,
        rows: [],
        rowCount: 0,
        duration: 100,
        lastInsertId: null,
        warnings: null,
        map: () => [],
        as: () => [],
      };

      const result = expect(sqlResult);
      assertEquals(typeof result.toBeOk, "function");
      assertEquals(typeof result.toHaveRowCount, "function");
    });

    it("dispatches DenoKvResult (deno-kv:get) to expectDenoKvResult", () => {
      const denoKvResult: DenoKvGetResult<unknown> = {
        kind: "deno-kv:get" as const,
        processed: true,
        ok: true,
        error: null,
        key: ["test"],
        value: null,
        versionstamp: null,
        duration: 100,
      };

      const result = expect(denoKvResult);
      assertEquals(typeof result.toBeOk, "function");
      assertEquals(typeof result.toHaveValue, "function");
    });

    it("dispatches DenoKvResult (deno-kv:set) to expectDenoKvResult", () => {
      const denoKvResult: DenoKvSetResult = {
        kind: "deno-kv:set" as const,
        processed: true,
        ok: true,
        error: null,
        versionstamp: "00000000",
        duration: 100,
      };

      const result = expect(denoKvResult);
      assertEquals(typeof result.toBeOk, "function");
    });

    it("dispatches RedisResult (redis:get) to expectRedisResult", () => {
      const redisResult: RedisGetResult = {
        kind: "redis:get" as const,
        processed: true,
        ok: true,
        error: null,
        value: "test",
        duration: 100,
      };

      const result = expect(redisResult);
      assertEquals(typeof result.toBeOk, "function");
    });

    it("dispatches RedisResult (redis:set) to expectRedisResult", () => {
      const redisResult: RedisSetResult = {
        kind: "redis:set" as const,
        processed: true,
        ok: true,
        error: null,
        value: "OK" as const,
        duration: 100,
      };

      const result = expect(redisResult);
      assertEquals(typeof result.toBeOk, "function");
    });

    it("dispatches MongoResult (mongo:find) to expectMongoResult", () => {
      const mongoResult: MongoFindResult = {
        kind: "mongo:find" as const,
        processed: true,
        ok: true,
        error: null,
        docs: [] as unknown as MongoFindResult["docs"],
        duration: 100,
      };

      const result = expect(mongoResult);
      assertEquals(typeof result.toBeOk, "function");
    });

    it("dispatches MongoResult (mongo:insert-one) to expectMongoResult", () => {
      const mongoResult: MongoInsertOneResult = {
        kind: "mongo:insert-one" as const,
        processed: true,
        ok: true,
        error: null,
        insertedId: "123",
        duration: 100,
      };

      const result = expect(mongoResult);
      assertEquals(typeof result.toBeOk, "function");
    });

    it("dispatches RabbitMqResult (rabbitmq:publish) to expectRabbitMqResult", () => {
      const rabbitmqResult: RabbitMqPublishResult = {
        kind: "rabbitmq:publish" as const,
        processed: true,
        ok: true,
        error: null,
        duration: 100,
      };

      const result = expect(rabbitmqResult);
      assertEquals(typeof result.toBeOk, "function");
    });

    it("dispatches RabbitMqResult (rabbitmq:consume) to expectRabbitMqResult", () => {
      const rabbitmqResult: RabbitMqConsumeResult = {
        kind: "rabbitmq:consume" as const,
        processed: true,
        ok: true,
        error: null,
        message: null,
        duration: 100,
      };

      const result = expect(rabbitmqResult);
      assertEquals(typeof result.toBeOk, "function");
    });

    it("dispatches SqsResult (sqs:send) to expectSqsResult", () => {
      const sqsResult: SqsSendResult = {
        kind: "sqs:send" as const,
        processed: true,
        ok: true,
        error: null,
        messageId: "123",
        md5OfBody: "md5hash",
        sequenceNumber: null,
        duration: 100,
      };

      const result = expect(sqsResult);
      assertEquals(typeof result.toBeOk, "function");
    });

    it("dispatches SqsResult (sqs:receive) to expectSqsResult", () => {
      const sqsResult: SqsReceiveResult = {
        kind: "sqs:receive" as const,
        processed: true,
        ok: true,
        error: null,
        messages: [],
        duration: 100,
      };

      const result = expect(sqsResult);
      assertEquals(typeof result.toBeOk, "function");
    });
  });

  describe("fallback to @std/expect", () => {
    it("falls back for primitive values", () => {
      const result = expect(42);
      assertEquals(typeof result.toBe, "function");
      assertEquals(typeof result.toEqual, "function");
    });

    it("falls back for objects without type property", () => {
      const result = expect({ name: "test" });
      assertEquals(typeof result.toEqual, "function");
    });

    it("falls back for objects with non-string type property", () => {
      const result = expect({ type: 123 });
      assertEquals(typeof result.toEqual, "function");
    });

    it("falls back for objects with unknown type value", () => {
      const result = expect({ type: "unknown-type" });
      assertEquals(typeof result.toEqual, "function");
    });

    it("falls back for null", () => {
      const result = expect(null);
      assertEquals(typeof result.toBe, "function");
    });

    it("falls back for undefined", () => {
      const result = expect(undefined);
      assertEquals(typeof result.toBe, "function");
    });

    it("falls back for arrays", () => {
      const result = expect([1, 2, 3]);
      assertEquals(typeof result.toEqual, "function");
      assertEquals(typeof result.toContain, "function");
    });

    it("works with @std/expect assertions", () => {
      // These should not throw
      expect(42).toBe(42);
      expect("hello").toBe("hello");
      expect({ a: 1 }).toEqual({ a: 1 });
      expect([1, 2, 3]).toContain(2);
      expect(true).toBeTruthy();
      expect(false).toBeFalsy();
    });
  });

  describe("type inference", () => {
    it("infers correct return type for HttpResponse", () => {
      const httpResponse: HttpResponse = {
        kind: "http" as const,
        processed: true,
        ok: true,
        error: null,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        url: "http://example.com",
        body: null,
        duration: 100,
        raw: () => new Response(),
        arrayBuffer: () => null,
        blob: () => null,
        text: () => null,
        json: () => null,
      };

      // This should compile and have HttpResponseExpectation methods
      const expectation = expect(httpResponse);
      // Chain should return same type (fluent API)
      const chained = expectation.toBeOk();
      assertEquals(typeof chained.toHaveStatus, "function");
    });

    it("infers correct return type for primitive values", () => {
      // This should compile and have @std/expect methods
      const expectation = expect(42);
      assertEquals(typeof expectation.toBe, "function");
      assertEquals(typeof expectation.toEqual, "function");
    });
  });
});
