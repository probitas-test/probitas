import {
  buildCountAtLeastError,
  buildCountError,
  createDurationMethods,
} from "../common.ts";
import type { RabbitMqQueueResult } from "@probitas/client-rabbitmq";

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

export function expectRabbitMqQueueResult(
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
