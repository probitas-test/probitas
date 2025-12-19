import type { RabbitMqQueueResult } from "@probitas/client-rabbitmq";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

/**
 * Fluent API for RabbitMQ queue result validation.
 *
 * Provides chainable assertions specifically designed for queue declaration results
 * (e.g., assertQueue, checkQueue operations).
 */
export interface RabbitMqQueueResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { RabbitMqQueueResult } from "@probitas/client-rabbitmq";
   * import { expectRabbitMqQueueResult } from "./queue.ts";
   * const result = {
   *   kind: "rabbitmq:queue",
   *   ok: false,
   *   queue: "test-queue",
   *   messageCount: 0,
   *   consumerCount: 0,
   *   duration: 0,
   * } as unknown as RabbitMqQueueResult;
   *
   * expectRabbitMqQueueResult(result).not.toBeOk();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the queue name equals the expected value.
   * @param expected - The expected queue name
   */
  toHaveQueue(expected: unknown): this;

  /**
   * Asserts that the queue name equals the expected value using deep equality.
   * @param expected - The expected queue name
   */
  toHaveQueueEqual(expected: unknown): this;

  /**
   * Asserts that the queue name strictly equals the expected value.
   * @param expected - The expected queue name
   */
  toHaveQueueStrictEqual(expected: unknown): this;

  /**
   * Asserts that the queue name satisfies the provided matcher function.
   * @param matcher - A function that receives the queue name and performs assertions
   */
  toHaveQueueSatisfying(matcher: (value: string) => void): this;

  /**
   * Asserts that the queue name contains the specified substring.
   * @param substr - The substring to search for
   */
  toHaveQueueContaining(substr: string): this;

  /**
   * Asserts that the queue name matches the specified regular expression.
   * @param expected - The regular expression to match against
   */
  toHaveQueueMatching(expected: RegExp): this;

  /**
   * Asserts that the message count equals the expected value.
   * @param expected - The expected message count
   */
  toHaveMessageCount(expected: unknown): this;

  /**
   * Asserts that the message count equals the expected value using deep equality.
   * @param expected - The expected message count
   */
  toHaveMessageCountEqual(expected: unknown): this;

  /**
   * Asserts that the message count strictly equals the expected value.
   * @param expected - The expected message count
   */
  toHaveMessageCountStrictEqual(expected: unknown): this;

  /**
   * Asserts that the message count satisfies the provided matcher function.
   * @param matcher - A function that receives the message count and performs assertions
   */
  toHaveMessageCountSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the message count is NaN.
   */
  toHaveMessageCountNaN(): this;

  /**
   * Asserts that the message count is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveMessageCountGreaterThan(expected: number): this;

  /**
   * Asserts that the message count is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveMessageCountGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the message count is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveMessageCountLessThan(expected: number): this;

  /**
   * Asserts that the message count is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveMessageCountLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the message count is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveMessageCountCloseTo(expected: number, numDigits?: number): this;

  /**
   * Asserts that the consumer count equals the expected value.
   * @param expected - The expected consumer count
   */
  toHaveConsumerCount(expected: unknown): this;

  /**
   * Asserts that the consumer count equals the expected value using deep equality.
   * @param expected - The expected consumer count
   */
  toHaveConsumerCountEqual(expected: unknown): this;

  /**
   * Asserts that the consumer count strictly equals the expected value.
   * @param expected - The expected consumer count
   */
  toHaveConsumerCountStrictEqual(expected: unknown): this;

  /**
   * Asserts that the consumer count satisfies the provided matcher function.
   * @param matcher - A function that receives the consumer count and performs assertions
   */
  toHaveConsumerCountSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the consumer count is NaN.
   */
  toHaveConsumerCountNaN(): this;

  /**
   * Asserts that the consumer count is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveConsumerCountGreaterThan(expected: number): this;

  /**
   * Asserts that the consumer count is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveConsumerCountGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the consumer count is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveConsumerCountLessThan(expected: number): this;

  /**
   * Asserts that the consumer count is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveConsumerCountLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the consumer count is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveConsumerCountCloseTo(expected: number, numDigits?: number): this;

  /**
   * Asserts that the duration equals the expected value.
   * @param expected - The expected duration value
   */
  toHaveDuration(expected: unknown): this;

  /**
   * Asserts that the duration equals the expected value using deep equality.
   * @param expected - The expected duration value
   */
  toHaveDurationEqual(expected: unknown): this;

  /**
   * Asserts that the duration strictly equals the expected value.
   * @param expected - The expected duration value
   */
  toHaveDurationStrictEqual(expected: unknown): this;

  /**
   * Asserts that the duration satisfies the provided matcher function.
   * @param matcher - A function that receives the duration and performs assertions
   */
  toHaveDurationSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the duration is NaN.
   */
  toHaveDurationNaN(): this;

  /**
   * Asserts that the duration is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveDurationGreaterThan(expected: number): this;

  /**
   * Asserts that the duration is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveDurationGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the duration is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveDurationLessThan(expected: number): this;

  /**
   * Asserts that the duration is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveDurationLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the duration is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveDurationCloseTo(expected: number, numDigits?: number): this;
}

export function expectRabbitMqQueueResult(
  result: RabbitMqQueueResult,
): RabbitMqQueueResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("queue result")),
      // Queue
      mixin.createValueMixin(() => result.queue, negate, cfg("queue")),
      mixin.createStringValueMixin(
        () => ensureNonNullish(result.queue, "queue"),
        negate,
        cfg("queue"),
      ),
      // Message count
      mixin.createValueMixin(
        () => result.messageCount,
        negate,
        cfg("message count"),
      ),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.messageCount, "messageCount"),
        negate,
        cfg("message count"),
      ),
      // Consumer count
      mixin.createValueMixin(
        () => result.consumerCount,
        negate,
        cfg("consumer count"),
      ),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.consumerCount, "consumerCount"),
        negate,
        cfg("consumer count"),
      ),
      // Duration
      mixin.createValueMixin(() => result.duration, negate, cfg("duration")),
      mixin.createNumberValueMixin(
        () => result.duration,
        negate,
        cfg("duration"),
      ),
    ] as const;
  });
}
