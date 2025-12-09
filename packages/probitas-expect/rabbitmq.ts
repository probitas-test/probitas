import {
  buildCountAtLeastError,
  buildCountError,
  buildDurationError,
  containsSubset,
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
  routingKey(expected: string): this;

  /** Assert that exchange matches expected */
  exchange(expected: string): this;

  /** Assert that duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;
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
  messageCount(count: number): this;

  /** Assert that message count is at least min */
  messageCountAtLeast(min: number): this;

  /** Assert that consumer count equals expected */
  consumerCount(count: number): this;

  /** Assert that duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;
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
  readonly #negate: boolean;

  constructor(result: T, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new RabbitMqPublishResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
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
  readonly #negate: boolean;

  constructor(result: RabbitMqConsumeResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new RabbitMqConsumeResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  toHaveContent(): this {
    const hasContent = this.#result.message !== null;
    if (this.#negate ? hasContent : !hasContent) {
      throw new Error(
        this.#negate
          ? "Expected no message, but message exists"
          : "Expected message, but message is null",
      );
    }
    return this;
  }

  toHaveBodyContaining(subbody: Uint8Array): this {
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

  toSatisfy(matcher: (content: Uint8Array) => void): this {
    if (this.#result.message === null) {
      throw new Error("Expected message, but message is null");
    }
    matcher(this.#result.message.content);
    return this;
  }

  toHavePropertyContaining(subset: Partial<RabbitMqMessageProperties>): this {
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

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
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
  readonly #negate: boolean;

  constructor(result: RabbitMqQueueResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new RabbitMqQueueResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  messageCount(count: number): this {
    if (this.#result.messageCount !== count) {
      throw new Error(
        buildCountError(count, this.#result.messageCount, "message count"),
      );
    }
    return this;
  }

  messageCountAtLeast(min: number): this {
    if (this.#result.messageCount < min) {
      throw new Error(
        buildCountAtLeastError(min, this.#result.messageCount, "message count"),
      );
    }
    return this;
  }

  consumerCount(count: number): this {
    if (this.#result.consumerCount !== count) {
      throw new Error(
        buildCountError(count, this.#result.consumerCount, "consumer count"),
      );
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
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
