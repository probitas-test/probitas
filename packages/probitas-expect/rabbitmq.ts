import {
  buildCountAtLeastError,
  buildCountError,
  containsSubset,
  createDurationMethods,
} from "./common.ts";
import type {
  RabbitMqAckResult,
  RabbitMqConsumeResult,
  RabbitMqExchangeResult,
  RabbitMqMessageProperties,
  RabbitMqPublishResult,
  RabbitMqQueueResult,
  RabbitMqResult,
} from "@probitas/client-rabbitmq";

/**
 * Fluent API for RabbitMQ publish result validation.
 */
export interface RabbitMqPublishResultExpectation {
  /** Negates the next assertion */
  readonly not: this;

  /** Assert that result ok is true */
  toBeSuccessful(): this;

  /** Assert that duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for RabbitMQ consume result validation.
 */
export interface RabbitMqConsumeResultExpectation {
  /** Negates the next assertion */
  readonly not: this;

  /** Assert that result ok is true */
  toBeSuccessful(): this;

  /** Assert that message is not null */
  toHaveContent(): this;

  /** Assert that data contains the given subbody */
  toHaveBodyContaining(subbody: Uint8Array): this;

  /** Assert data using custom matcher function */
  toSatisfy(matcher: (content: Uint8Array) => void): this;

  /** Assert that properties contain the given subset */
  toHavePropertyContaining(subset: Partial<RabbitMqMessageProperties>): this;

  /** Assert that routing key matches expected */
  toHaveRoutingKey(expected: string): this;

  /** Assert that exchange matches expected */
  toHaveExchange(expected: string): this;

  /** Assert that duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for RabbitMQ exchange result validation.
 * Same interface as publish result (ok, duration only).
 */
export type RabbitMqExchangeResultExpectation =
  RabbitMqPublishResultExpectation;

/**
 * Fluent API for RabbitMQ ack result validation.
 * Same interface as publish result (ok, duration only).
 */
export type RabbitMqAckResultExpectation = RabbitMqPublishResultExpectation;

/**
 * Fluent API for RabbitMQ queue result validation.
 */
export interface RabbitMqQueueResultExpectation {
  /** Negates the next assertion */
  readonly not: this;

  /** Assert that result ok is true */
  toBeSuccessful(): this;

  /** Assert that message count equals expected */
  toHaveMessageCount(count: number): this;

  /** Assert that message count is greater than specified value */
  toHaveMessageCountGreaterThan(count: number): this;

  /** Assert that message count is at least min */
  toHaveMessageCountGreaterThanOrEqual(min: number): this;

  /** Assert that message count is less than specified value */
  toHaveMessageCountLessThan(count: number): this;

  /** Assert that message count is less than or equal to specified value */
  toHaveMessageCountLessThanOrEqual(count: number): this;

  /** Assert that consumer count equals expected */
  toHaveConsumerCount(count: number): this;

  /** Assert that consumer count is greater than specified value */
  toHaveConsumerCountGreaterThan(count: number): this;

  /** Assert that consumer count is greater than or equal to specified value */
  toHaveConsumerCountGreaterThanOrEqual(count: number): this;

  /** Assert that consumer count is less than specified value */
  toHaveConsumerCountLessThan(count: number): this;

  /** Assert that consumer count is less than or equal to specified value */
  toHaveConsumerCountLessThanOrEqual(count: number): this;

  /** Assert that duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Base result type for simple ok/duration results.
 */
interface SimpleResult {
  readonly ok: boolean;
  readonly duration: number;
}

/**
 * Create expectation for RabbitMQ publish/exchange/ack result.
 */
function expectSimpleResult<T extends SimpleResult>(
  result: T,
  negate = false,
): RabbitMqPublishResultExpectation {
  const self: RabbitMqPublishResultExpectation = {
    get not(): RabbitMqPublishResultExpectation {
      return expectSimpleResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? "Expected not ok result, but ok is true"
            : "Expected ok result, but ok is false",
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create expectation for RabbitMQ consume result.
 */
function expectRabbitMqConsumeResult(
  result: RabbitMqConsumeResult,
  negate = false,
): RabbitMqConsumeResultExpectation {
  const self: RabbitMqConsumeResultExpectation = {
    get not(): RabbitMqConsumeResultExpectation {
      return expectRabbitMqConsumeResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? "Expected not ok result, but ok is true"
            : "Expected ok result, but ok is false",
        );
      }
      return this;
    },

    toHaveContent() {
      const hasContent = result.message !== null;
      if (negate ? hasContent : !hasContent) {
        throw new Error(
          negate
            ? "Expected no message, but message exists"
            : "Expected message, but message is null",
        );
      }
      return this;
    },

    toHaveBodyContaining(subbody: Uint8Array) {
      if (result.message === null) {
        throw new Error("Expected message, but message is null");
      }

      const content = result.message.content;
      const subbodyStr = new TextDecoder().decode(subbody);
      const contentStr = new TextDecoder().decode(content);

      const contains = contentStr.includes(subbodyStr);
      if (negate ? contains : !contains) {
        throw new Error(
          negate
            ? `Expected data to not contain ${subbodyStr}, but it did`
            : `Expected data to contain ${subbodyStr}, but got ${contentStr}`,
        );
      }
      return this;
    },

    toSatisfy(matcher: (content: Uint8Array) => void) {
      if (result.message === null) {
        throw new Error("Expected message, but message is null");
      }
      matcher(result.message.content);
      return this;
    },

    toHavePropertyContaining(subset: Partial<RabbitMqMessageProperties>) {
      if (result.message === null) {
        throw new Error("Expected message, but message is null");
      }

      const props = result.message.properties;
      const matches = containsSubset(props, subset);
      if (negate ? matches : !matches) {
        throw new Error(
          negate
            ? `Expected properties to not contain ${
              JSON.stringify(subset)
            }, got ${JSON.stringify(props)}`
            : `Expected properties to contain ${JSON.stringify(subset)}, got ${
              JSON.stringify(props)
            }`,
        );
      }
      return this;
    },

    toHaveRoutingKey(expected: string) {
      if (result.message === null) {
        throw new Error("Expected message, but message is null");
      }

      const match = result.message.fields.routingKey === expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected routing key to not be ${expected}, got ${result.message.fields.routingKey}`
            : `Expected routing key ${expected}, got ${result.message.fields.routingKey}`,
        );
      }
      return this;
    },

    toHaveExchange(expected: string) {
      if (result.message === null) {
        throw new Error("Expected message, but message is null");
      }

      const match = result.message.fields.exchange === expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected exchange to not be ${expected}, got ${result.message.fields.exchange}`
            : `Expected exchange ${expected}, got ${result.message.fields.exchange}`,
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create expectation for RabbitMQ queue result.
 */
function expectRabbitMqQueueResult(
  result: RabbitMqQueueResult,
  negate = false,
): RabbitMqQueueResultExpectation {
  const self: RabbitMqQueueResultExpectation = {
    get not(): RabbitMqQueueResultExpectation {
      return expectRabbitMqQueueResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? "Expected not ok result, but ok is true"
            : "Expected ok result, but ok is false",
        );
      }
      return this;
    },

    toHaveMessageCount(count: number) {
      const match = result.messageCount === count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected message count to not be ${count}, got ${result.messageCount}`
            : buildCountError(count, result.messageCount, "message count"),
        );
      }
      return this;
    },

    toHaveMessageCountGreaterThan(count: number) {
      const match = result.messageCount > count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected message count to not be > ${count}, got ${result.messageCount}`
            : `Expected message count > ${count}, but got ${result.messageCount}`,
        );
      }
      return this;
    },

    toHaveMessageCountGreaterThanOrEqual(min: number) {
      const match = result.messageCount >= min;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected message count to not be >= ${min}, got ${result.messageCount}`
            : buildCountAtLeastError(min, result.messageCount, "message count"),
        );
      }
      return this;
    },

    toHaveMessageCountLessThan(count: number) {
      const match = result.messageCount < count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected message count to not be < ${count}, got ${result.messageCount}`
            : `Expected message count < ${count}, but got ${result.messageCount}`,
        );
      }
      return this;
    },

    toHaveMessageCountLessThanOrEqual(count: number) {
      const match = result.messageCount <= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected message count to not be <= ${count}, got ${result.messageCount}`
            : `Expected message count <= ${count}, but got ${result.messageCount}`,
        );
      }
      return this;
    },

    toHaveConsumerCount(count: number) {
      const match = result.consumerCount === count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected consumer count to not be ${count}, got ${result.consumerCount}`
            : buildCountError(count, result.consumerCount, "consumer count"),
        );
      }
      return this;
    },

    toHaveConsumerCountGreaterThan(count: number) {
      const match = result.consumerCount > count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected consumer count to not be > ${count}, got ${result.consumerCount}`
            : `Expected consumer count > ${count}, but got ${result.consumerCount}`,
        );
      }
      return this;
    },

    toHaveConsumerCountGreaterThanOrEqual(count: number) {
      const match = result.consumerCount >= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected consumer count to not be >= ${count}, got ${result.consumerCount}`
            : `Expected consumer count >= ${count}, but got ${result.consumerCount}`,
        );
      }
      return this;
    },

    toHaveConsumerCountLessThan(count: number) {
      const match = result.consumerCount < count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected consumer count to not be < ${count}, got ${result.consumerCount}`
            : `Expected consumer count < ${count}, but got ${result.consumerCount}`,
        );
      }
      return this;
    },

    toHaveConsumerCountLessThanOrEqual(count: number) {
      const match = result.consumerCount <= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected consumer count to not be <= ${count}, got ${result.consumerCount}`
            : `Expected consumer count <= ${count}, but got ${result.consumerCount}`,
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Expectation type returned by expectRabbitMqResult based on the result type.
 */
export type RabbitMqExpectation<R extends RabbitMqResult> = R extends
  RabbitMqConsumeResult ? RabbitMqConsumeResultExpectation
  : R extends RabbitMqQueueResult ? RabbitMqQueueResultExpectation
  : R extends RabbitMqPublishResult ? RabbitMqPublishResultExpectation
  : R extends RabbitMqExchangeResult ? RabbitMqExchangeResultExpectation
  : R extends RabbitMqAckResult ? RabbitMqAckResultExpectation
  : never;

/**
 * Create a fluent expectation chain for any RabbitMQ result validation.
 *
 * This unified function accepts any RabbitMQ result type and returns
 * the appropriate expectation interface based on the result's type discriminator.
 *
 * @example
 * ```ts
 * // For publish result - returns RabbitMqPublishResultExpectation
 * const publishResult = await channel.sendToQueue(queue, content);
 * expectRabbitMqResult(publishResult).toBeSuccessful();
 *
 * // For consume result - returns RabbitMqConsumeResultExpectation
 * const consumeResult = await channel.get(queue);
 * expectRabbitMqResult(consumeResult).toBeSuccessful().toHaveContent().routingKey("key");
 *
 * // For queue result - returns RabbitMqQueueResultExpectation
 * const queueResult = await channel.assertQueue("my-queue");
 * expectRabbitMqResult(queueResult).toBeSuccessful().messageCount(0);
 *
 * // For exchange result - returns RabbitMqExchangeResultExpectation
 * const exchangeResult = await channel.assertExchange("my-exchange", "direct");
 * expectRabbitMqResult(exchangeResult).toBeSuccessful();
 *
 * // For ack result - returns RabbitMqAckResultExpectation
 * const ackResult = await channel.ack(message);
 * expectRabbitMqResult(ackResult).toBeSuccessful();
 * ```
 */
export function expectRabbitMqResult<R extends RabbitMqResult>(
  result: R,
): RabbitMqExpectation<R> {
  switch (result.type) {
    case "rabbitmq:consume":
      return expectRabbitMqConsumeResult(
        result as unknown as RabbitMqConsumeResult,
      ) as unknown as RabbitMqExpectation<R>;
    case "rabbitmq:queue":
      return expectRabbitMqQueueResult(
        result as unknown as RabbitMqQueueResult,
      ) as unknown as RabbitMqExpectation<R>;
    case "rabbitmq:publish":
      return expectSimpleResult(
        result as unknown as RabbitMqPublishResult,
      ) as unknown as RabbitMqExpectation<R>;
    case "rabbitmq:exchange":
      return expectSimpleResult(
        result as unknown as RabbitMqExchangeResult,
      ) as unknown as RabbitMqExpectation<R>;
    case "rabbitmq:ack":
      return expectSimpleResult(
        result as unknown as RabbitMqAckResult,
      ) as unknown as RabbitMqExpectation<R>;
    default:
      throw new Error(
        `Unknown RabbitMQ result type: ${(result as { type: string }).type}`,
      );
  }
}
