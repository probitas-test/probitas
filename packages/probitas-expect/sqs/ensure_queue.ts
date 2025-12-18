import type { SqsEnsureQueueResult } from "@probitas/client-sqs";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

/**
 * Fluent API for SQS ensure queue result validation.
 *
 * Provides chainable assertions for queue creation/retrieval results
 * including queue URL.
 */
export interface SqsEnsureQueueResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { SqsEnsureQueueResult } from "@probitas/client-sqs";
   * import { expectSqsEnsureQueueResult } from "./ensure_queue.ts";
   * const result = {
   *   kind: "sqs:ensure-queue",
   *   ok: false,
   *   queueUrl: "https://sqs.example.com/test-queue",
   *   duration: 0,
   * } as unknown as SqsEnsureQueueResult;
   *
   * expectSqsEnsureQueueResult(result).not.toBeOk();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the queue URL equals the expected value.
   * @param expected - The expected queue URL
   */
  toHaveQueueUrl(expected: unknown): this;

  /**
   * Asserts that the queue URL equals the expected value using deep equality.
   * @param expected - The expected queue URL
   */
  toHaveQueueUrlEqual(expected: unknown): this;

  /**
   * Asserts that the queue URL strictly equals the expected value.
   * @param expected - The expected queue URL
   */
  toHaveQueueUrlStrictEqual(expected: unknown): this;

  /**
   * Asserts that the queue URL satisfies the provided matcher function.
   * @param matcher - A function that receives the queue URL and performs assertions
   */
  toHaveQueueUrlSatisfying(matcher: (value: string) => void): this;

  /**
   * Asserts that the queue URL contains the specified substring.
   * @param substr - The substring to search for
   */
  toHaveQueueUrlContaining(substr: string): this;

  /**
   * Asserts that the queue URL matches the specified regular expression.
   * @param expected - The regular expression to match against
   */
  toHaveQueueUrlMatching(expected: RegExp): this;

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

export function expectSqsEnsureQueueResult(
  result: SqsEnsureQueueResult,
): SqsEnsureQueueResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("ensure queue result")),
      // Queue url
      mixin.createValueMixin(() => result.queueUrl, negate, cfg("queue url")),
      mixin.createStringValueMixin(
        () => ensureNonNullish(result.queueUrl, "queueUrl"),
        negate,
        cfg("queue url"),
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
