import type {
  RabbitMqAckResult,
  RabbitMqConsumeResult,
  RabbitMqExchangeResult,
  RabbitMqPublishResult,
  RabbitMqQueueResult,
} from "@probitas/client-rabbitmq";

// Note: These use type assertions because the result types are discriminated
// unions with literal types (ok: true, processed: true). The spread operator
// would widen these to boolean, breaking the type narrowing.

export const mockRabbitMqPublishResult = (
  overrides: Partial<RabbitMqPublishResult> = {},
): RabbitMqPublishResult => {
  const base = {
    kind: "rabbitmq:publish",
    processed: true,
    ok: true,
    error: null,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as RabbitMqPublishResult;
};

export const mockRabbitMqConsumeResult = (
  overrides: Partial<RabbitMqConsumeResult> = {},
): RabbitMqConsumeResult => {
  const base = {
    kind: "rabbitmq:consume",
    processed: true,
    ok: true,
    error: null,
    message: {
      content: new TextEncoder().encode("test message"),
      properties: { contentType: "text/plain" },
      fields: {
        routingKey: "test.key",
        exchange: "test.exchange",
        deliveryTag: 1n,
        redelivered: false,
      },
    },
    duration: 100,
  } as const;
  return { ...base, ...overrides } as RabbitMqConsumeResult;
};

export const mockRabbitMqQueueResult = (
  overrides: Partial<RabbitMqQueueResult> = {},
): RabbitMqQueueResult => {
  const base = {
    kind: "rabbitmq:queue",
    processed: true,
    ok: true,
    error: null,
    queue: "test-queue",
    messageCount: 10,
    consumerCount: 2,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as RabbitMqQueueResult;
};

export const mockRabbitMqAckResult = (
  overrides: Partial<RabbitMqAckResult> = {},
): RabbitMqAckResult => {
  const base = {
    kind: "rabbitmq:ack",
    processed: true,
    ok: true,
    error: null,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as RabbitMqAckResult;
};

export const mockRabbitMqExchangeResult = (
  overrides: Partial<RabbitMqExchangeResult> = {},
): RabbitMqExchangeResult => {
  const base = {
    kind: "rabbitmq:exchange",
    processed: true,
    ok: true,
    error: null,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as RabbitMqExchangeResult;
};
