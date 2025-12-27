/**
 * RabbitMQ Client Failure Examples
 *
 * This file demonstrates failure messages for each RabbitMQ expectation method.
 * All scenarios are expected to fail - they use dummy results to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import {
  type RabbitMqAckResult,
  RabbitMqConnectionError,
  type RabbitMqConsumeResult,
  type RabbitMqExchangeResult,
  type RabbitMqMessage,
  type RabbitMqPublishResult,
  type RabbitMqQueueResult,
} from "jsr:@probitas/client-rabbitmq@^0";

// Helper functions - separate functions for ok:true and ok:false states

function createSuccessPublishResult(): RabbitMqPublishResult {
  return {
    kind: "rabbitmq:publish" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    duration: 5,
  };
}

function createFailurePublishResult(): RabbitMqPublishResult {
  return {
    kind: "rabbitmq:publish" as const,
    processed: false as const,
    ok: false as const,
    error: new RabbitMqConnectionError("Connection failed"),
    duration: 0,
  };
}

function createSuccessConsumeResult(
  message: RabbitMqMessage | null,
): RabbitMqConsumeResult {
  return {
    kind: "rabbitmq:consume" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    message,
    duration: 10,
  };
}

function createFailureConsumeResult(): RabbitMqConsumeResult {
  return {
    kind: "rabbitmq:consume" as const,
    processed: false as const,
    ok: false as const,
    error: new RabbitMqConnectionError("Connection failed"),
    message: null,
    duration: 0,
  };
}

function createSuccessQueueResult(
  queue: string,
  messageCount: number,
  consumerCount: number,
): RabbitMqQueueResult {
  return {
    kind: "rabbitmq:queue" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    queue,
    messageCount,
    consumerCount,
    duration: 8,
  };
}

function createFailureQueueResult(): RabbitMqQueueResult {
  return {
    kind: "rabbitmq:queue" as const,
    processed: false as const,
    ok: false as const,
    error: new RabbitMqConnectionError("Connection failed"),
    queue: null,
    messageCount: null,
    consumerCount: null,
    duration: 0,
  };
}

function createSuccessExchangeResult(): RabbitMqExchangeResult {
  return {
    kind: "rabbitmq:exchange" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    duration: 6,
  };
}

function createFailureExchangeResult(): RabbitMqExchangeResult {
  return {
    kind: "rabbitmq:exchange" as const,
    processed: false as const,
    ok: false as const,
    error: new RabbitMqConnectionError("Connection failed"),
    duration: 0,
  };
}

function createSuccessAckResult(): RabbitMqAckResult {
  return {
    kind: "rabbitmq:ack" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    duration: 2,
  };
}

function createFailureAckResult(): RabbitMqAckResult {
  return {
    kind: "rabbitmq:ack" as const,
    processed: false as const,
    ok: false as const,
    error: new RabbitMqConnectionError("Connection failed"),
    duration: 0,
  };
}

const testMessage: RabbitMqMessage = {
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
};

const dummyPublishResult = createSuccessPublishResult();
const dummyConsumeResult = createSuccessConsumeResult(testMessage);
const dummyQueueResult = createSuccessQueueResult("test-queue", 5, 2);
const _dummyExchangeResult = createSuccessExchangeResult();
const _dummyAckResult = createSuccessAckResult();

// Publish result failures
export const publishToBeOk = scenario("RabbitMQ Publish - toBeOk failure", {
  tags: ["failure", "rabbitmq"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(createFailurePublishResult()).toBeOk();
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
    expect(createFailureConsumeResult()).toBeOk();
  })
  .build();

export const consumeToHaveMessagePresent = scenario(
  "RabbitMQ Consume - toHaveMessagePresent failure",
  { tags: ["failure", "rabbitmq"] },
)
  .step("toHaveMessagePresent fails when message is null", () => {
    const noMessageResult = createSuccessConsumeResult(null);
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
    expect(createFailureQueueResult()).toBeOk();
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
    expect(createFailureExchangeResult()).toBeOk();
  })
  .build();

// Ack result failures
export const ackToBeOk = scenario("RabbitMQ Ack - toBeOk failure", {
  tags: ["failure", "rabbitmq"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(createFailureAckResult()).toBeOk();
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
    expect(dummyPublishResult).not.toBeOk();
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
