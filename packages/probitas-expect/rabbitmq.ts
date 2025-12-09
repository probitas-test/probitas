import { containsSubset } from "./common.ts";
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
  /** Assert that result ok is true */
  ok(): this;

  /** Assert that result ok is false */
  notOk(): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for RabbitMQ consume result validation.
 */
export interface RabbitMqConsumeResultExpectation {
  /** Assert that result ok is true */
  ok(): this;

  /** Assert that result ok is false */
  notOk(): this;

  /** Assert that message is null (empty queue) */
  noContent(): this;

  /** Assert that message is not null */
  hasContent(): this;

  /** Assert that data contains the given subbody */
  dataContains(subbody: Uint8Array): this;

  /** Assert data using custom matcher function */
  dataMatch(matcher: (content: Uint8Array) => void): this;

  /** Assert that properties contain the given subset */
  propertyContains(subset: Partial<RabbitMqMessageProperties>): this;

  /** Assert that routing key matches expected */
  routingKey(expected: string): this;

  /** Assert that exchange matches expected */
  exchange(expected: string): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
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
  /** Assert that result ok is true */
  ok(): this;

  /** Assert that result ok is false */
  notOk(): this;

  /** Assert that message count equals expected */
  messageCount(count: number): this;

  /** Assert that message count is at least min */
  messageCountAtLeast(min: number): this;

  /** Assert that consumer count equals expected */
  consumerCount(count: number): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Base result type for simple ok/duration results.
 */
interface SimpleResult {
  readonly ok: boolean;
  readonly duration: number;
}

/**
 * Implementation for RabbitMQ publish result expectations.
 */
class RabbitMqPublishResultExpectationImpl<T extends SimpleResult>
  implements RabbitMqPublishResultExpectation {
  readonly #result: T;

  constructor(result: T) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Implementation for RabbitMQ consume result expectations.
 */
class RabbitMqConsumeResultExpectationImpl
  implements RabbitMqConsumeResultExpectation {
  readonly #result: RabbitMqConsumeResult;

  constructor(result: RabbitMqConsumeResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  noContent(): this {
    if (this.#result.message !== null) {
      throw new Error("Expected no message, but message exists");
    }
    return this;
  }

  hasContent(): this {
    if (this.#result.message === null) {
      throw new Error("Expected message, but message is null");
    }
    return this;
  }

  dataContains(subbody: Uint8Array): this {
    if (this.#result.message === null) {
      throw new Error("Expected message, but message is null");
    }

    const content = this.#result.message.content;
    const subbodyStr = new TextDecoder().decode(subbody);
    const contentStr = new TextDecoder().decode(content);

    if (!contentStr.includes(subbodyStr)) {
      throw new Error(
        `Expected data to contain ${subbodyStr}, but got ${contentStr}`,
      );
    }
    return this;
  }

  dataMatch(matcher: (content: Uint8Array) => void): this {
    if (this.#result.message === null) {
      throw new Error("Expected message, but message is null");
    }
    matcher(this.#result.message.content);
    return this;
  }

  propertyContains(subset: Partial<RabbitMqMessageProperties>): this {
    if (this.#result.message === null) {
      throw new Error("Expected message, but message is null");
    }

    const props = this.#result.message.properties;
    if (!containsSubset(props, subset)) {
      throw new Error(
        `Expected properties to contain ${JSON.stringify(subset)}, got ${
          JSON.stringify(props)
        }`,
      );
    }
    return this;
  }

  routingKey(expected: string): this {
    if (this.#result.message === null) {
      throw new Error("Expected message, but message is null");
    }

    if (this.#result.message.fields.routingKey !== expected) {
      throw new Error(
        `Expected routing key ${expected}, got ${this.#result.message.fields.routingKey}`,
      );
    }
    return this;
  }

  exchange(expected: string): this {
    if (this.#result.message === null) {
      throw new Error("Expected message, but message is null");
    }

    if (this.#result.message.fields.exchange !== expected) {
      throw new Error(
        `Expected exchange ${expected}, got ${this.#result.message.fields.exchange}`,
      );
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Implementation for RabbitMQ queue result expectations.
 */
class RabbitMqQueueResultExpectationImpl
  implements RabbitMqQueueResultExpectation {
  readonly #result: RabbitMqQueueResult;

  constructor(result: RabbitMqQueueResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  messageCount(count: number): this {
    if (this.#result.messageCount !== count) {
      throw new Error(
        `Expected message count ${count}, got ${this.#result.messageCount}`,
      );
    }
    return this;
  }

  messageCountAtLeast(min: number): this {
    if (this.#result.messageCount < min) {
      throw new Error(
        `Expected message count >= ${min}, got ${this.#result.messageCount}`,
      );
    }
    return this;
  }

  consumerCount(count: number): this {
    if (this.#result.consumerCount !== count) {
      throw new Error(
        `Expected consumer count ${count}, got ${this.#result.consumerCount}`,
      );
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
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
 * expectRabbitMqResult(publishResult).ok();
 *
 * // For consume result - returns RabbitMqConsumeResultExpectation
 * const consumeResult = await channel.get(queue);
 * expectRabbitMqResult(consumeResult).ok().hasContent().routingKey("key");
 *
 * // For queue result - returns RabbitMqQueueResultExpectation
 * const queueResult = await channel.assertQueue("my-queue");
 * expectRabbitMqResult(queueResult).ok().messageCount(0);
 *
 * // For exchange result - returns RabbitMqExchangeResultExpectation
 * const exchangeResult = await channel.assertExchange("my-exchange", "direct");
 * expectRabbitMqResult(exchangeResult).ok();
 *
 * // For ack result - returns RabbitMqAckResultExpectation
 * const ackResult = await channel.ack(message);
 * expectRabbitMqResult(ackResult).ok();
 * ```
 */
export function expectRabbitMqResult<R extends RabbitMqResult>(
  result: R,
): RabbitMqExpectation<R> {
  switch (result.type) {
    case "rabbitmq:consume":
      return new RabbitMqConsumeResultExpectationImpl(
        result as unknown as RabbitMqConsumeResult,
      ) as unknown as RabbitMqExpectation<R>;
    case "rabbitmq:queue":
      return new RabbitMqQueueResultExpectationImpl(
        result as unknown as RabbitMqQueueResult,
      ) as unknown as RabbitMqExpectation<R>;
    case "rabbitmq:publish":
      return new RabbitMqPublishResultExpectationImpl<RabbitMqPublishResult>(
        result as unknown as RabbitMqPublishResult,
      ) as unknown as RabbitMqExpectation<R>;
    case "rabbitmq:exchange":
      return new RabbitMqPublishResultExpectationImpl<RabbitMqExchangeResult>(
        result as unknown as RabbitMqExchangeResult,
      ) as unknown as RabbitMqExpectation<R>;
    case "rabbitmq:ack":
      return new RabbitMqPublishResultExpectationImpl<RabbitMqAckResult>(
        result as unknown as RabbitMqAckResult,
      ) as unknown as RabbitMqExpectation<R>;
    default:
      throw new Error(
        `Unknown RabbitMQ result type: ${(result as { type: string }).type}`,
      );
  }
}
