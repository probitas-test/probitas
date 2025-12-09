/**
 * Tests for unified expect function
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { expect } from "./expect.ts";

describe("expect", () => {
  describe("type dispatch", () => {
    it("dispatches HttpResponse to expectHttpResponse", () => {
      const httpResponse = {
        type: "http" as const,
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        url: "http://example.com",
        body: null,
        duration: 100,
        raw: new Response(),
        arrayBuffer: () => null,
        blob: () => null,
        text: () => null,
        data: () => null,
      };

      const result = expect(httpResponse);
      // HttpResponseExpectation has ok() method that returns this
      assertEquals(typeof result.ok, "function");
      assertEquals(typeof result.status, "function");
      assertEquals(typeof result.dataContains, "function");
    });

    it("dispatches ConnectRpcResponse to expectConnectRpcResponse", () => {
      const connectRpcResponse = {
        type: "connectrpc" as const,
        ok: true,
        code: 0,
        message: "",
        headers: {},
        trailers: {},
        duration: 100,
        data: () => ({}),
      };

      const result = expect(connectRpcResponse);
      assertEquals(typeof result.ok, "function");
      assertEquals(typeof result.code, "function");
    });

    it("dispatches GraphqlResponse to expectGraphqlResponse", () => {
      const graphqlResponse = {
        type: "graphql" as const,
        ok: true,
        errors: null,
        duration: 100,
        status: 200,
        headers: new Headers(),
        raw: new Response(),
        data: () => ({}),
      };

      const result = expect(graphqlResponse);
      assertEquals(typeof result.ok, "function");
      assertEquals(typeof result.hasContent, "function");
      assertEquals(typeof result.dataContains, "function");
    });

    it("dispatches SqlQueryResult to expectSqlQueryResult", () => {
      const sqlResult = {
        type: "sql" as const,
        ok: true,
        rows: [],
        rowCount: 0,
        duration: 100,
        affectedRows: 0,
        columns: [],
        first: () => undefined,
      };

      const result = expect(sqlResult);
      assertEquals(typeof result.ok, "function");
      assertEquals(typeof result.rowCount, "function");
    });

    it("dispatches DenoKvResult (deno-kv:get) to expectDenoKvResult", () => {
      const denoKvResult = {
        type: "deno-kv:get" as const,
        ok: true,
        key: ["test"],
        value: null,
        versionstamp: null,
        duration: 100,
      };

      const result = expect(denoKvResult);
      assertEquals(typeof result.ok, "function");
    });

    it("dispatches DenoKvResult (deno-kv:set) to expectDenoKvResult", () => {
      const denoKvResult = {
        type: "deno-kv:set" as const,
        ok: true,
        versionstamp: "00000000",
        duration: 100,
      };

      const result = expect(denoKvResult);
      assertEquals(typeof result.ok, "function");
    });

    it("dispatches RedisResult (redis:get) to expectRedisResult", () => {
      const redisResult = {
        type: "redis:get" as const,
        ok: true,
        value: "test",
        duration: 100,
      };

      const result = expect(redisResult);
      assertEquals(typeof result.ok, "function");
    });

    it("dispatches RedisResult (redis:set) to expectRedisResult", () => {
      const redisResult = {
        type: "redis:set" as const,
        ok: true,
        value: "OK" as const,
        duration: 100,
      };

      const result = expect(redisResult);
      assertEquals(typeof result.ok, "function");
    });

    it("dispatches MongoResult (mongo:find) to expectMongoResult", () => {
      const mongoResult = {
        type: "mongo:find" as const,
        ok: true,
        docs: [],
        duration: 100,
      };

      const result = expect(mongoResult);
      assertEquals(typeof result.ok, "function");
    });

    it("dispatches MongoResult (mongo:insert) to expectMongoResult", () => {
      const mongoResult = {
        type: "mongo:insert" as const,
        ok: true,
        insertedId: "123",
        duration: 100,
      };

      const result = expect(mongoResult);
      assertEquals(typeof result.ok, "function");
    });

    it("dispatches RabbitMqResult (rabbitmq:publish) to expectRabbitMqResult", () => {
      const rabbitmqResult = {
        type: "rabbitmq:publish" as const,
        ok: true,
        duration: 100,
      };

      const result = expect(rabbitmqResult);
      assertEquals(typeof result.ok, "function");
    });

    it("dispatches RabbitMqResult (rabbitmq:consume) to expectRabbitMqResult", () => {
      const rabbitmqResult = {
        type: "rabbitmq:consume" as const,
        ok: true,
        message: null,
        duration: 100,
      };

      const result = expect(rabbitmqResult);
      assertEquals(typeof result.ok, "function");
    });

    it("dispatches SqsResult (sqs:send) to expectSqsResult", () => {
      const sqsResult = {
        type: "sqs:send" as const,
        ok: true,
        messageId: "123",
        duration: 100,
      };

      const result = expect(sqsResult);
      assertEquals(typeof result.ok, "function");
    });

    it("dispatches SqsResult (sqs:receive) to expectSqsResult", () => {
      const sqsResult = {
        type: "sqs:receive" as const,
        ok: true,
        messages: [],
        duration: 100,
      };

      const result = expect(sqsResult);
      assertEquals(typeof result.ok, "function");
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
      const httpResponse = {
        type: "http" as const,
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        url: "http://example.com",
        body: null,
        duration: 100,
        raw: new Response(),
        arrayBuffer: () => null,
        blob: () => null,
        text: () => null,
        data: () => null,
      };

      // This should compile and have HttpResponseExpectation methods
      const expectation = expect(httpResponse);
      // Chain should return same type (fluent API)
      const chained = expectation.ok();
      assertEquals(typeof chained.status, "function");
    });

    it("infers correct return type for primitive values", () => {
      // This should compile and have @std/expect methods
      const expectation = expect(42);
      assertEquals(typeof expectation.toBe, "function");
      assertEquals(typeof expectation.toEqual, "function");
    });
  });
});
