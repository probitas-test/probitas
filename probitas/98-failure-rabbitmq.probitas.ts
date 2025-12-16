/**
 * RabbitMQ Client Failure Examples
 *
 * This file demonstrates failure messages for each RabbitMQ expectation method.
 * All scenarios are expected to fail - they use dummy results to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import type {
  RabbitMqAckResult,
  RabbitMqConsumeResult,
  RabbitMqExchangeResult,
  RabbitMqPublishResult,
  RabbitMqQueueResult,
} from "jsr:@probitas/client-rabbitmq@^0";

// Mock helpers
const mockPublishResult = (
  overrides: Partial<RabbitMqPublishResult> = {},
): RabbitMqPublishResult => ({
  kind: "rabbitmq:publish" as const,
  ok: false,
  duration: 5,
  ...overrides,
});

const mockConsumeResult = (
  overrides: Partial<RabbitMqConsumeResult> = {},
): RabbitMqConsumeResult => ({
  kind: "rabbitmq:consume" as const,
  ok: false,
  message: {
    content: new TextEncoder().encode('{"data": "test message"}'),
    properties: {
      contentType: "application/json",
      messageId: "msg-123",
    },
    fields: {
      routingKey: "test.key",
      exchange: "test-exchange",
      deliveryTag: 1n,
      redelivered: false,
    },
  },
  duration: 10,
  ...overrides,
});

const mockQueueResult = (
  overrides: Partial<RabbitMqQueueResult> = {},
): RabbitMqQueueResult => ({
  kind: "rabbitmq:queue" as const,
  ok: false,
  queue: "test-queue",
  messageCount: 5,
  consumerCount: 2,
  duration: 8,
  ...overrides,
});

const mockExchangeResult = (
  overrides: Partial<RabbitMqExchangeResult> = {},
): RabbitMqExchangeResult => ({
  kind: "rabbitmq:exchange" as const,
  ok: false,
  duration: 6,
  ...overrides,
});

const mockAckResult = (
  overrides: Partial<RabbitMqAckResult> = {},
): RabbitMqAckResult => ({
  kind: "rabbitmq:ack" as const,
  ok: false,
  duration: 2,
  ...overrides,
});

const dummyPublishResult = mockPublishResult();
const dummyConsumeResult = mockConsumeResult();
const dummyQueueResult = mockQueueResult();
const dummyExchangeResult = mockExchangeResult();
const dummyAckResult = mockAckResult();

// Publish result failures
export const publishToBeOk = scenario("RabbitMQ Publish - toBeOk failure", {
  tags: ["failure", "rabbitmq"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyPublishResult).toBeOk();
  })
  .build();

export const publishToHaveDuration = scenario(
  "RabbitMQ Publish - toHaveDuration failure",
  { tags: ["failure", "rabbitmq"] },
)
  .step("toHaveDuration fails with wrong duration", () => {
    expect(dummyPublishResult).toHaveDuration(100);
  })
  .build();

// Consume result failures
export const consumeToBeOk = scenario("RabbitMQ Consume - toBeOk failure", {
  tags: ["failure", "rabbitmq"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyConsumeResult).toBeOk();
  })
  .build();

export const consumeToHaveMessagePresent = scenario(
  "RabbitMQ Consume - toHaveMessagePresent failure",
  { tags: ["failure", "rabbitmq"] },
)
  .step("toHaveMessagePresent fails when message is null", () => {
    const noMessageResult = mockConsumeResult({ message: null });
    expect(noMessageResult).toHaveMessagePresent();
  })
  .build();

export const consumeToHaveMessageNull = scenario(
  "RabbitMQ Consume - toHaveMessageNull failure",
  { tags: ["failure", "rabbitmq"] },
)
  .step("toHaveMessageNull fails when message exists", () => {
    expect(dummyConsumeResult).toHaveMessageNull();
  })
  .build();

export const consumeToHaveMessage = scenario(
  "RabbitMQ Consume - toHaveMessage failure",
  { tags: ["failure", "rabbitmq"] },
)
  .step("toHaveMessage fails with wrong message", () => {
    expect(dummyConsumeResult).toHaveMessage({ content: "different" });
  })
  .build();

export const consumeToHaveContent = scenario(
  "RabbitMQ Consume - toHaveContent failure",
  { tags: ["failure", "rabbitmq"] },
)
  .step("toHaveContent fails with wrong content", () => {
    expect(dummyConsumeResult).toHaveContent("different content");
  })
  .build();

export const consumeToHaveContentLength = scenario(
  "RabbitMQ Consume - toHaveContentLength failure",
  { tags: ["failure", "rabbitmq"] },
)
  .step("toHaveContentLength fails with wrong length", () => {
    expect(dummyConsumeResult).toHaveContentLength(1000);
  })
  .build();

// Queue result failures
export const queueToBeOk = scenario("RabbitMQ Queue - toBeOk failure", {
  tags: ["failure", "rabbitmq"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyQueueResult).toBeOk();
  })
  .build();

export const queueToHaveQueue = scenario(
  "RabbitMQ Queue - toHaveQueue failure",
  { tags: ["failure", "rabbitmq"] },
)
  .step("toHaveQueue fails with wrong queue name", () => {
    expect(dummyQueueResult).toHaveQueue("different-queue");
  })
  .build();

export const queueToHaveMessageCount = scenario(
  "RabbitMQ Queue - toHaveMessageCount failure",
  { tags: ["failure", "rabbitmq"] },
)
  .step("toHaveMessageCount fails with wrong count", () => {
    expect(dummyQueueResult).toHaveMessageCount(100);
  })
  .build();

export const queueToHaveMessageCountGreaterThan = scenario(
  "RabbitMQ Queue - toHaveMessageCountGreaterThan failure",
  { tags: ["failure", "rabbitmq"] },
)
  .step("toHaveMessageCountGreaterThan fails", () => {
    expect(dummyQueueResult).toHaveMessageCountGreaterThan(10);
  })
  .build();

export const queueToHaveConsumerCount = scenario(
  "RabbitMQ Queue - toHaveConsumerCount failure",
  { tags: ["failure", "rabbitmq"] },
)
  .step("toHaveConsumerCount fails with wrong count", () => {
    expect(dummyQueueResult).toHaveConsumerCount(10);
  })
  .build();

// Exchange result failures
export const exchangeToBeOk = scenario("RabbitMQ Exchange - toBeOk failure", {
  tags: ["failure", "rabbitmq"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyExchangeResult).toBeOk();
  })
  .build();

// Ack result failures
export const ackToBeOk = scenario("RabbitMQ Ack - toBeOk failure", {
  tags: ["failure", "rabbitmq"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyAckResult).toBeOk();
  })
  .build();

// Duration failures
export const toHaveDuration = scenario("RabbitMQ - toHaveDuration failure", {
  tags: ["failure", "rabbitmq"],
})
  .step("toHaveDuration fails with wrong duration", () => {
    expect(dummyConsumeResult).toHaveDuration(100);
  })
  .build();

export const toHaveDurationLessThan = scenario(
  "RabbitMQ - toHaveDurationLessThan failure",
  { tags: ["failure", "rabbitmq"] },
)
  .step("toHaveDurationLessThan fails", () => {
    expect(dummyConsumeResult).toHaveDurationLessThan(5);
  })
  .build();

// Negation failures
export const notToBeOk = scenario("RabbitMQ - not.toBeOk failure", {
  tags: ["failure", "rabbitmq"],
})
  .step("not.toBeOk fails when ok is true", () => {
    const okResult = mockPublishResult({ ok: true });
    expect(okResult).not.toBeOk();
  })
  .build();

export default [
  publishToBeOk,
  publishToHaveDuration,
  consumeToBeOk,
  consumeToHaveMessagePresent,
  consumeToHaveMessageNull,
  consumeToHaveMessage,
  consumeToHaveContent,
  consumeToHaveContentLength,
  queueToBeOk,
  queueToHaveQueue,
  queueToHaveMessageCount,
  queueToHaveMessageCountGreaterThan,
  queueToHaveConsumerCount,
  exchangeToBeOk,
  ackToBeOk,
  toHaveDuration,
  toHaveDurationLessThan,
  notToBeOk,
];
