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
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectRabbitMqResult(result).not.toBeSuccessful();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result ok is true.
   *
   * @example
   * ```ts
   * expectRabbitMqResult(result).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for RabbitMQ consume result validation.
 */
export interface RabbitMqConsumeResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectRabbitMqResult(result).not.toBeSuccessful();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result ok is true.
   *
   * @example
   * ```ts
   * expectRabbitMqResult(result).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the consumed message is not null.
   *
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveContent();
   * ```
   */
  toHaveContent(): this;

  /**
   * Asserts that the message body contains the given subbody.
   *
   * @param subbody - The expected subbody as a Uint8Array
   * @example
   * ```ts
   * const expectedBody = new TextEncoder().encode("hello");
   * expectRabbitMqResult(result).toHaveBodyContaining(expectedBody);
   * ```
   */
  toHaveBodyContaining(subbody: Uint8Array): this;

  /**
   * Asserts that the message content satisfies the custom matcher function.
   *
   * @param matcher - A custom function to validate the message content
   * @example
   * ```ts
   * expectRabbitMqResult(result).toSatisfy((content) => {
   *   const text = new TextDecoder().decode(content);
   *   if (!text.startsWith("prefix")) {
   *     throw new Error("Expected content to start with 'prefix'");
   *   }
   * });
   * ```
   */
  toSatisfy(matcher: (content: Uint8Array) => void): this;

  /**
   * Asserts that the message properties contain the given subset.
   *
   * @param subset - A partial object of expected message properties
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHavePropertyContaining({
   *   contentType: "application/json",
   *   correlationId: "abc123",
   * });
   * ```
   */
  toHavePropertyContaining(subset: Partial<RabbitMqMessageProperties>): this;

  /**
   * Asserts that the message routing key matches the expected value.
   *
   * @param expected - The expected routing key
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveRoutingKey("orders.created");
   * ```
   */
  toHaveRoutingKey(expected: string): this;

  /**
   * Asserts that the message exchange matches the expected value.
   *
   * @param expected - The expected exchange name
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveExchange("my-exchange");
   * ```
   */
  toHaveExchange(expected: string): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
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
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectRabbitMqResult(result).not.toBeSuccessful();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result ok is true.
   *
   * @example
   * ```ts
   * expectRabbitMqResult(result).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the queue message count equals the expected value.
   *
   * @param count - The expected message count
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveMessageCount(10);
   * ```
   */
  toHaveMessageCount(count: number): this;

  /**
   * Asserts that the queue message count is greater than the specified value.
   *
   * @param count - The value to compare against
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveMessageCountGreaterThan(5);
   * ```
   */
  toHaveMessageCountGreaterThan(count: number): this;

  /**
   * Asserts that the queue message count is greater than or equal to the specified minimum.
   *
   * @param min - The minimum message count
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveMessageCountGreaterThanOrEqual(5);
   * ```
   */
  toHaveMessageCountGreaterThanOrEqual(min: number): this;

  /**
   * Asserts that the queue message count is less than the specified value.
   *
   * @param count - The value to compare against
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveMessageCountLessThan(100);
   * ```
   */
  toHaveMessageCountLessThan(count: number): this;

  /**
   * Asserts that the queue message count is less than or equal to the specified value.
   *
   * @param count - The value to compare against
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveMessageCountLessThanOrEqual(100);
   * ```
   */
  toHaveMessageCountLessThanOrEqual(count: number): this;

  /**
   * Asserts that the queue consumer count equals the expected value.
   *
   * @param count - The expected consumer count
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveConsumerCount(3);
   * ```
   */
  toHaveConsumerCount(count: number): this;

  /**
   * Asserts that the queue consumer count is greater than the specified value.
   *
   * @param count - The value to compare against
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveConsumerCountGreaterThan(1);
   * ```
   */
  toHaveConsumerCountGreaterThan(count: number): this;

  /**
   * Asserts that the queue consumer count is greater than or equal to the specified value.
   *
   * @param count - The value to compare against
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveConsumerCountGreaterThanOrEqual(2);
   * ```
   */
  toHaveConsumerCountGreaterThanOrEqual(count: number): this;

  /**
   * Asserts that the queue consumer count is less than the specified value.
   *
   * @param count - The value to compare against
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveConsumerCountLessThan(10);
   * ```
   */
  toHaveConsumerCountLessThan(count: number): this;

  /**
   * Asserts that the queue consumer count is less than or equal to the specified value.
   *
   * @param count - The value to compare against
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveConsumerCountLessThanOrEqual(10);
   * ```
   */
  toHaveConsumerCountLessThanOrEqual(count: number): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
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
