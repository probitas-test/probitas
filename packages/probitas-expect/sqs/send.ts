import type { SqsSendResult } from "@probitas/client-sqs";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

/**
 * Fluent API for SQS send result validation.
 *
 * Provides chainable assertions specifically designed for single message send results
 * including message ID and sequence number.
 */
export interface SqsSendResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { SqsSendResult } from "@probitas/client-sqs";
   * import { expectSqsSendResult } from "./send.ts";
   * const result = {
   *   kind: "sqs:send",
   *   ok: false,
   *   messageId: "msg-123",
   *   md5OfBody: "abc123",
   *   sequenceNumber: undefined,
   *   duration: 0,
   * } as unknown as SqsSendResult;
   *
   * expectSqsSendResult(result).not.toBeOk();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the message ID equals the expected value.
   * @param expected - The expected message ID
   */
  toHaveMessageId(expected: unknown): this;

  /**
   * Asserts that the message ID equals the expected value using deep equality.
   * @param expected - The expected message ID
   */
  toHaveMessageIdEqual(expected: unknown): this;

  /**
   * Asserts that the message ID strictly equals the expected value.
   * @param expected - The expected message ID
   */
  toHaveMessageIdStrictEqual(expected: unknown): this;

  /**
   * Asserts that the message ID satisfies the provided matcher function.
   * @param matcher - A function that receives the message ID and performs assertions
   */
  toHaveMessageIdSatisfying(matcher: (value: string) => void): this;

  /**
   * Asserts that the message ID contains the specified substring.
   * @param substr - The substring to search for
   */
  toHaveMessageIdContaining(substr: string): this;

  /**
   * Asserts that the message ID matches the specified regular expression.
   * @param expected - The regular expression to match against
   */
  toHaveMessageIdMatching(expected: RegExp): this;

  /**
   * Asserts that the MD5 of body equals the expected value.
   * @param expected - The expected MD5 hash
   */
  toHaveMd5OfBody(expected: unknown): this;

  /**
   * Asserts that the MD5 of body equals the expected value using deep equality.
   * @param expected - The expected MD5 hash
   */
  toHaveMd5OfBodyEqual(expected: unknown): this;

  /**
   * Asserts that the MD5 of body strictly equals the expected value.
   * @param expected - The expected MD5 hash
   */
  toHaveMd5OfBodyStrictEqual(expected: unknown): this;

  /**
   * Asserts that the MD5 of body satisfies the provided matcher function.
   * @param matcher - A function that receives the MD5 hash and performs assertions
   */
  toHaveMd5OfBodySatisfying(matcher: (value: string) => void): this;

  /**
   * Asserts that the MD5 of body contains the specified substring.
   * @param substr - The substring to search for
   */
  toHaveMd5OfBodyContaining(substr: string): this;

  /**
   * Asserts that the MD5 of body matches the specified regular expression.
   * @param expected - The regular expression to match against
   */
  toHaveMd5OfBodyMatching(expected: RegExp): this;

  /**
   * Asserts that the sequence number equals the expected value.
   * @param expected - The expected sequence number
   */
  toHaveSequenceNumber(expected: unknown): this;

  /**
   * Asserts that the sequence number equals the expected value using deep equality.
   * @param expected - The expected sequence number
   */
  toHaveSequenceNumberEqual(expected: unknown): this;

  /**
   * Asserts that the sequence number strictly equals the expected value.
   * @param expected - The expected sequence number
   */
  toHaveSequenceNumberStrictEqual(expected: unknown): this;

  /**
   * Asserts that the sequence number satisfies the provided matcher function.
   * @param matcher - A function that receives the sequence number and performs assertions
   */
  toHaveSequenceNumberSatisfying(matcher: (value: string) => void): this;

  /**
   * Asserts that the sequence number contains the specified substring.
   * @param substr - The substring to search for
   */
  toHaveSequenceNumberContaining(substr: string): this;

  /**
   * Asserts that the sequence number matches the specified regular expression.
   * @param expected - The regular expression to match against
   */
  toHaveSequenceNumberMatching(expected: RegExp): this;

  /**
   * Asserts that the sequence number is present (not null or undefined).
   */
  toHaveSequenceNumberPresent(): this;

  /**
   * Asserts that the sequence number is null.
   */
  toHaveSequenceNumberNull(): this;

  /**
   * Asserts that the sequence number is undefined.
   */
  toHaveSequenceNumberUndefined(): this;

  /**
   * Asserts that the sequence number is nullish (null or undefined).
   */
  toHaveSequenceNumberNullish(): this;

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

export function expectSqsSendResult(
  result: SqsSendResult,
): SqsSendResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("send result")),
      // Message id
      mixin.createValueMixin(() => result.messageId, negate, cfg("message id")),
      mixin.createStringValueMixin(
        () => ensureNonNullish(result.messageId, "messageId"),
        negate,
        cfg("message id"),
      ),
      // md5 of body
      mixin.createValueMixin(
        () => result.md5OfBody,
        negate,
        cfg("md5 of body"),
      ),
      mixin.createStringValueMixin(
        () => ensureNonNullish(result.md5OfBody, "md5OfBody"),
        negate,
        cfg("md5 of body"),
      ),
      // Sequence number
      mixin.createValueMixin(
        () => result.sequenceNumber,
        negate,
        cfg("sequence number"),
      ),
      mixin.createNullishValueMixin(
        () => result.sequenceNumber,
        negate,
        cfg("sequence number"),
      ),
      mixin.createStringValueMixin(
        () => ensureNonNullish(result.sequenceNumber, "sequence number"),
        negate,
        cfg("sequence number"),
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
