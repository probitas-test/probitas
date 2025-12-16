import type { RabbitMqConsumeResult } from "@probitas/client-rabbitmq";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

/**
 * Fluent API for RabbitMQ consume result validation.
 *
 * Provides chainable assertions specifically designed for message consumption results
 * including message content, properties, headers, and metadata.
 */
export interface RabbitMqConsumeResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectRabbitMqResult(result).not.toBeOk();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the message equals the expected value.
   * @param expected - The expected message
   */
  toHaveMessage(expected: unknown): this;

  /**
   * Asserts that the message equals the expected value using deep equality.
   * @param expected - The expected message
   */
  toHaveMessageEqual(expected: unknown): this;

  /**
   * Asserts that the message strictly equals the expected value.
   * @param expected - The expected message
   */
  toHaveMessageStrictEqual(expected: unknown): this;

  /**
   * Asserts that the message satisfies the provided matcher function.
   * @param matcher - A function that receives the message and performs assertions
   */
  toHaveMessageSatisfying(matcher: (value: unknown) => void): this;

  /**
   * Asserts that the message is present (not null or undefined).
   */
  toHaveMessagePresent(): this;

  /**
   * Asserts that the message is null (no message received).
   */
  toHaveMessageNull(): this;

  /**
   * Asserts that the message is undefined.
   */
  toHaveMessageUndefined(): this;

  /**
   * Asserts that the message is nullish (null or undefined).
   */
  toHaveMessageNullish(): this;

  /**
   * Asserts that the message matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveMessageMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the message has the specified property.
   * @param keyPath - The key path to check
   * @param value - Optional expected value at the key path
   */
  toHaveMessageProperty(keyPath: string | string[], value?: unknown): this;

  /**
   * Asserts that the message property contains the expected value.
   * @param keyPath - The key path to check
   * @param expected - The expected contained value
   */
  toHaveMessagePropertyContaining(
    keyPath: string | string[],
    expected: unknown,
  ): this;

  /**
   * Asserts that the message property matches the specified subset.
   * @param keyPath - The key path to check
   * @param subset - The subset to match against
   */
  toHaveMessagePropertyMatching(
    keyPath: string | string[],
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the message property satisfies the provided matcher function.
   * @param keyPath - The key path to check
   * @param matcher - A function that receives the property value and performs assertions
   */
  toHaveMessagePropertySatisfying<I>(
    keyPath: string | string[],
    matcher: (value: I) => void,
  ): this;

  /**
   * Asserts that the content equals the expected value.
   * @param expected - The expected content
   */
  toHaveContent(expected: unknown): this;

  /**
   * Asserts that the content equals the expected value using deep equality.
   * @param expected - The expected content
   */
  toHaveContentEqual(expected: unknown): this;

  /**
   * Asserts that the content strictly equals the expected value.
   * @param expected - The expected content
   */
  toHaveContentStrictEqual(expected: unknown): this;

  /**
   * Asserts that the content satisfies the provided matcher function.
   * @param matcher - A function that receives the content and performs assertions
   */
  toHaveContentSatisfying(matcher: (value: unknown) => void): this;

  /**
   * Asserts that the content is present (not null or undefined).
   */
  toHaveContentPresent(): this;

  /**
   * Asserts that the content is null.
   */
  toHaveContentNull(): this;

  /**
   * Asserts that the content is undefined.
   */
  toHaveContentUndefined(): this;

  /**
   * Asserts that the content is nullish (null or undefined).
   */
  toHaveContentNullish(): this;

  /**
   * Asserts that the content length equals the expected value.
   * @param expected - The expected content length
   */
  toHaveContentLength(expected: unknown): this;

  /**
   * Asserts that the content length equals the expected value using deep equality.
   * @param expected - The expected content length
   */
  toHaveContentLengthEqual(expected: unknown): this;

  /**
   * Asserts that the content length strictly equals the expected value.
   * @param expected - The expected content length
   */
  toHaveContentLengthStrictEqual(expected: unknown): this;

  /**
   * Asserts that the content length satisfies the provided matcher function.
   * @param matcher - A function that receives the content length and performs assertions
   */
  toHaveContentLengthSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the content length is NaN.
   */
  toHaveContentLengthNaN(): this;

  /**
   * Asserts that the content length is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveContentLengthGreaterThan(expected: number): this;

  /**
   * Asserts that the content length is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveContentLengthGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the content length is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveContentLengthLessThan(expected: number): this;

  /**
   * Asserts that the content length is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveContentLengthLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the content length is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveContentLengthCloseTo(expected: number, numDigits?: number): this;

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

export function expectRabbitMqConsumeResult(
  result: RabbitMqConsumeResult,
): RabbitMqConsumeResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("consume result")),
      // Message
      mixin.createValueMixin(() => result.message, negate, cfg("message")),
      mixin.createNullishValueMixin(
        () => result.message,
        negate,
        cfg("message"),
      ),
      mixin.createObjectValueMixin(
        () => ensureNonNullish(result.message, "message"),
        negate,
        cfg("message"),
      ),
      // Content
      mixin.createValueMixin(
        () => result.message?.content,
        negate,
        cfg("content"),
      ),
      mixin.createNullishValueMixin(
        () => result.message?.content,
        negate,
        cfg("content"),
      ),
      // Content length
      mixin.createValueMixin(
        () => result.message?.content.length ?? 0,
        negate,
        cfg("content length"),
      ),
      mixin.createNumberValueMixin(
        () => result.message?.content.length ?? 0,
        negate,
        cfg("content length"),
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
