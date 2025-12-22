import type { SqsReceiveResult } from "@probitas/client-sqs";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

type SqsMessages = SqsReceiveResult["messages"];

/**
 * Fluent API for SQS receive result validation.
 *
 * Provides chainable assertions specifically designed for message receive results
 * including messages array and message count.
 */
export interface SqsReceiveResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { SqsReceiveResult } from "@probitas/client-sqs";
   * import { expectSqsReceiveResult } from "./receive.ts";
   * const result = {
   *   kind: "sqs:receive",
   *   ok: true,
   *   messages: [{ body: "test" }],
   *   duration: 0,
   * } as unknown as SqsReceiveResult;
   *
   * expectSqsReceiveResult(result).not.toHaveMessagesEmpty();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the messages equals the expected value.
   * @param expected - The expected messages
   */
  toHaveMessages(expected: unknown): this;

  /**
   * Asserts that the messages equals the expected value using deep equality.
   * @param expected - The expected messages
   */
  toHaveMessagesEqual(expected: unknown): this;

  /**
   * Asserts that the messages strictly equals the expected value.
   * @param expected - The expected messages
   */
  toHaveMessagesStrictEqual(expected: unknown): this;

  /**
   * Asserts that the messages satisfies the provided matcher function.
   * @param matcher - A function that receives the messages and performs assertions
   */
  toHaveMessagesSatisfying(matcher: (value: SqsMessages) => void): this;

  /**
   * Asserts that the messages contains the specified item.
   * @param item - The item to search for
   */
  toHaveMessagesContaining(item: unknown): this;

  /**
   * Asserts that the messages contains an item equal to the specified value.
   * @param item - The item to search for using deep equality
   */
  toHaveMessagesContainingEqual(item: unknown): this;

  /**
   * Asserts that the messages matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveMessagesMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the messages is empty.
   */
  toHaveMessagesEmpty(): this;

  /**
   * Asserts that the messages count equals the expected value.
   * @param expected - The expected messages count
   */
  toHaveMessagesCount(expected: unknown): this;

  /**
   * Asserts that the messages count equals the expected value using deep equality.
   * @param expected - The expected messages count
   */
  toHaveMessagesCountEqual(expected: unknown): this;

  /**
   * Asserts that the messages count strictly equals the expected value.
   * @param expected - The expected messages count
   */
  toHaveMessagesCountStrictEqual(expected: unknown): this;

  /**
   * Asserts that the messages count satisfies the provided matcher function.
   * @param matcher - A function that receives the messages count and performs assertions
   */
  toHaveMessagesCountSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the messages count is NaN.
   */
  toHaveMessagesCountNaN(): this;

  /**
   * Asserts that the messages count is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveMessagesCountGreaterThan(expected: number): this;

  /**
   * Asserts that the messages count is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveMessagesCountGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the messages count is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveMessagesCountLessThan(expected: number): this;

  /**
   * Asserts that the messages count is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveMessagesCountLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the messages count is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveMessagesCountCloseTo(expected: number, numDigits?: number): this;

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

export function expectSqsReceiveResult(
  result: SqsReceiveResult,
): SqsReceiveResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("receive result")),
      // Messages
      mixin.createValueMixin(() => result.messages, negate, cfg("messages")),
      mixin.createArrayValueMixin(
        () => ensureNonNullish(result.messages, "messages"),
        negate,
        cfg("messages"),
      ),
      // Message count
      mixin.createValueMixin(
        () => ensureNonNullish(result.messages, "messages").length,
        negate,
        cfg("messages count"),
      ),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.messages, "messages").length,
        negate,
        cfg("messages count"),
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
