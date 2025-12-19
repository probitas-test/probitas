import { assertExists, assertThrows } from "@std/assert";
import type {
  RabbitMqAckResult,
  RabbitMqConsumeResult,
  RabbitMqExchangeResult,
  RabbitMqPublishResult,
  RabbitMqQueueResult,
} from "@probitas/client-rabbitmq";
import { expectRabbitMqResult } from "./rabbitmq.ts";
import {
  mockRabbitMqAckResult,
  mockRabbitMqConsumeResult,
  mockRabbitMqExchangeResult,
  mockRabbitMqPublishResult,
  mockRabbitMqQueueResult,
} from "./rabbitmq/_testutils.ts";

Deno.test("expectRabbitMqResult - dispatches to publish expectation", () => {
  const result: RabbitMqPublishResult = mockRabbitMqPublishResult();
  const expectation = expectRabbitMqResult(result);

  // Verify it returns publish expectation with correct methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveDuration);

  // Verify chaining works
  expectation.toBeOk().toHaveDuration(100);
});

Deno.test("expectRabbitMqResult - dispatches to consume expectation", () => {
  const result: RabbitMqConsumeResult = mockRabbitMqConsumeResult();
  const expectation = expectRabbitMqResult(result);

  // Verify it returns consume expectation with correct methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveMessage);
  assertExists(expectation.toHaveContent);
  assertExists(expectation.toHaveDuration);

  // Verify chaining works
  expectation.toBeOk().toHaveMessagePresent();
});

Deno.test("expectRabbitMqResult - dispatches to queue expectation", () => {
  const result: RabbitMqQueueResult = mockRabbitMqQueueResult();
  const expectation = expectRabbitMqResult(result);

  // Verify it returns queue expectation with correct methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveQueue);
  assertExists(expectation.toHaveMessageCount);
  assertExists(expectation.toHaveConsumerCount);
  assertExists(expectation.toHaveDuration);

  // Verify chaining works
  expectation.toBeOk().toHaveQueue("test-queue").toHaveMessageCount(10);
});

Deno.test("expectRabbitMqResult - dispatches to ack expectation", () => {
  const result: RabbitMqAckResult = mockRabbitMqAckResult();
  const expectation = expectRabbitMqResult(result);

  // Verify it returns ack expectation with correct methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveDuration);

  // Verify chaining works
  expectation.toBeOk().toHaveDuration(100);
});

Deno.test("expectRabbitMqResult - dispatches to exchange expectation", () => {
  const result: RabbitMqExchangeResult = mockRabbitMqExchangeResult();
  const expectation = expectRabbitMqResult(result);

  // Verify it returns exchange expectation with correct methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveDuration);

  // Verify chaining works
  expectation.toBeOk().toHaveDuration(100);
});

Deno.test("expectRabbitMqResult - throws for unknown result type", () => {
  const unknownResult = {
    kind: "rabbitmq:unknown" as const,
    ok: true,
    duration: 100,
  };

  assertThrows(
    // deno-lint-ignore no-explicit-any
    () => expectRabbitMqResult(unknownResult as any),
    Error,
    "Unknown RabbitMQ result kind: rabbitmq:unknown",
  );
});

Deno.test("expectRabbitMqResult - type inference works correctly", () => {
  // These tests verify that TypeScript correctly infers the return type
  // based on the input result type

  // Publish result type inference
  const publishResult = mockRabbitMqPublishResult();
  const publishExpectation = expectRabbitMqResult(publishResult);
  // toHaveDuration should be available on publish expectation
  publishExpectation.toHaveDuration(100);

  // Consume result type inference
  const consumeResult = mockRabbitMqConsumeResult();
  const consumeExpectation = expectRabbitMqResult(consumeResult);
  // toHaveMessage should be available on consume expectation
  consumeExpectation.toHaveMessagePresent();

  // Queue result type inference
  const queueResult = mockRabbitMqQueueResult();
  const queueExpectation = expectRabbitMqResult(queueResult);
  // toHaveQueue should be available on queue expectation
  queueExpectation.toHaveQueue("test-queue");

  // Ack result type inference
  const ackResult = mockRabbitMqAckResult();
  const ackExpectation = expectRabbitMqResult(ackResult);
  // toHaveDuration should be available on ack expectation
  ackExpectation.toHaveDuration(100);

  // Exchange result type inference
  const exchangeResult = mockRabbitMqExchangeResult();
  const exchangeExpectation = expectRabbitMqResult(exchangeResult);
  // toHaveDuration should be available on exchange expectation
  exchangeExpectation.toHaveDuration(100);
});

Deno.test("expectRabbitMqResult - all result types support .not", () => {
  // Publish
  const publishResult = mockRabbitMqPublishResult({ ok: false });
  expectRabbitMqResult(publishResult).not.toBeOk();

  // Consume
  const consumeResult = mockRabbitMqConsumeResult({ ok: false });
  expectRabbitMqResult(consumeResult).not.toBeOk();

  // Queue
  const queueResult = mockRabbitMqQueueResult({ ok: false });
  expectRabbitMqResult(queueResult).not.toBeOk();

  // Ack
  const ackResult = mockRabbitMqAckResult({ ok: false });
  expectRabbitMqResult(ackResult).not.toBeOk();

  // Exchange
  const exchangeResult = mockRabbitMqExchangeResult({ ok: false });
  expectRabbitMqResult(exchangeResult).not.toBeOk();
});
