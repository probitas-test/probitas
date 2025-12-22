/**
 * Tests for expect.ts module
 *
 * @module
 */

import { assertType, type IsExact } from "@std/testing/types";
import { expect } from "./expect.ts";
import type { AnythingExpectation } from "./anything.ts";
import type { ConnectRpcResponseExpectation } from "./connectrpc.ts";
import type { DenoKvExpectation } from "./deno_kv.ts";
import type { GraphqlResponseExpectation } from "./graphql.ts";
import type { HttpResponseExpectation } from "./http.ts";
import type { MongoExpectation } from "./mongodb.ts";
import type { RabbitMqExpectation } from "./rabbitmq.ts";
import type { RedisExpectation } from "./redis.ts";
import type { SqlQueryResultExpectation } from "./sql.ts";
import type { SqsExpectation } from "./sqs.ts";
import type { ConnectRpcResponse } from "@probitas/client-connectrpc";
import type { DenoKvGetResult } from "@probitas/client-deno-kv";
import type { GraphqlResponse } from "@probitas/client-graphql";
import type { HttpResponse } from "@probitas/client-http";
import type { MongoFindResult } from "@probitas/client-mongodb";
import type { RabbitMqPublishResult } from "@probitas/client-rabbitmq";
import type { RedisGetResult } from "@probitas/client-redis";
import type { SqlQueryResult } from "@probitas/client-sql";
import type { SqsSendResult } from "@probitas/client-sqs";

Deno.test("expect - infers expectation types", async (t) => {
  await t.step("http response", () => {
    const response = {} as HttpResponse;
    const expectation = expect(response);
    type Actual = typeof expectation;
    type Expected = HttpResponseExpectation;
    assertType<IsExact<Actual, Expected>>(true);
  });

  await t.step("connectrpc response", () => {
    const response = {} as ConnectRpcResponse;
    const expectation = expect(response);
    type Actual = typeof expectation;
    type Expected = ConnectRpcResponseExpectation;
    assertType<IsExact<Actual, Expected>>(true);
  });

  await t.step("graphql response", () => {
    const response = {} as GraphqlResponse;
    const expectation = expect(response);
    type Actual = typeof expectation;
    type Expected = GraphqlResponseExpectation;
    assertType<IsExact<Actual, Expected>>(true);
  });

  await t.step("sql response", () => {
    const response = {} as SqlQueryResult;
    const expectation = expect(response);
    type Actual = typeof expectation;
    type Expected = SqlQueryResultExpectation;
    assertType<IsExact<Actual, Expected>>(true);
  });

  await t.step("deno kv get result", () => {
    const result = {} as DenoKvGetResult<{ name: string }>;
    const expectation = expect(result);
    type Actual = typeof expectation;
    type Expected = DenoKvExpectation<typeof result>;
    assertType<IsExact<Actual, Expected>>(true);
  });

  await t.step("redis get result", () => {
    const result = {} as RedisGetResult;
    const expectation = expect(result);
    type Actual = typeof expectation;
    type Expected = RedisExpectation<typeof result>;
    assertType<IsExact<Actual, Expected>>(true);
  });

  await t.step("mongo find result", () => {
    const result = {} as MongoFindResult<{ name: string }>;
    const expectation = expect(result);
    type Actual = typeof expectation;
    type Expected = MongoExpectation<typeof result>;
    assertType<IsExact<Actual, Expected>>(true);
  });

  await t.step("rabbitmq publish result", () => {
    const result = {} as RabbitMqPublishResult;
    const expectation = expect(result);
    type Actual = typeof expectation;
    type Expected = RabbitMqExpectation<typeof result>;
    assertType<IsExact<Actual, Expected>>(true);
  });

  await t.step("sqs send result", () => {
    const result = {} as SqsSendResult;
    const expectation = expect(result);
    type Actual = typeof expectation;
    type Expected = SqsExpectation<typeof result>;
    assertType<IsExact<Actual, Expected>>(true);
  });

  await t.step("fallback to std expect", () => {
    const expectation = expect("value");
    type Actual = typeof expectation;
    type Expected = AnythingExpectation;
    assertType<IsExact<Actual, Expected>>(true);
  });

  await t.step("fallback to std expect (unknown)", () => {
    const expectation = expect("value" as unknown);
    type Actual = typeof expectation;
    type Expected = AnythingExpectation;
    assertType<IsExact<Actual, Expected>>(true);
  });

  await t.step("fallback to std expect (any)", () => {
    // deno-lint-ignore no-explicit-any
    const expectation = expect("value" as any);
    type Actual = typeof expectation;
    type Expected = AnythingExpectation;
    assertType<IsExact<Actual, Expected>>(true);
  });
});
