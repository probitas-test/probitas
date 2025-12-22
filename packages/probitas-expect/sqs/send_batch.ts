import type { SqsSendBatchResult } from "@probitas/client-sqs";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

type SqsSendBatchSuccessful = SqsSendBatchResult["successful"];
type SqsSendBatchFailed = SqsSendBatchResult["failed"];

/**
 * Fluent API for SQS send batch result validation.
 *
 * Provides chainable assertions specifically designed for batch message send results
 * including successful and failed messages arrays.
 */
export interface SqsSendBatchResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { SqsSendBatchResult } from "@probitas/client-sqs";
   * import { expectSqsSendBatchResult } from "./send_batch.ts";
   * const result = {
   *   kind: "sqs:send-batch",
   *   ok: false,
   *   successful: [],
   *   failed: [],
   *   duration: 0,
   * } as unknown as SqsSendBatchResult;
   *
   * expectSqsSendBatchResult(result).not.toBeOk();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result is successful.
   */
  toBeOk(): this;

  toHaveSuccessful(expected: unknown): this;
  toHaveSuccessfulEqual(expected: unknown): this;
  toHaveSuccessfulStrictEqual(expected: unknown): this;
  toHaveSuccessfulSatisfying(
    matcher: (value: SqsSendBatchSuccessful) => void,
  ): this;
  toHaveSuccessfulContaining(item: unknown): this;
  toHaveSuccessfulContainingEqual(item: unknown): this;
  toHaveSuccessfulMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;
  toHaveSuccessfulEmpty(): this;
  toHaveSuccessfulCount(expected: unknown): this;
  toHaveSuccessfulCountEqual(expected: unknown): this;
  toHaveSuccessfulCountStrictEqual(expected: unknown): this;
  toHaveSuccessfulCountSatisfying(matcher: (value: number) => void): this;
  toHaveSuccessfulCountNaN(): this;
  toHaveSuccessfulCountGreaterThan(expected: number): this;
  toHaveSuccessfulCountGreaterThanOrEqual(expected: number): this;
  toHaveSuccessfulCountLessThan(expected: number): this;
  toHaveSuccessfulCountLessThanOrEqual(expected: number): this;
  toHaveSuccessfulCountCloseTo(expected: number, numDigits?: number): this;

  toHaveFailed(expected: unknown): this;
  toHaveFailedEqual(expected: unknown): this;
  toHaveFailedStrictEqual(expected: unknown): this;
  toHaveFailedSatisfying(matcher: (value: SqsSendBatchFailed) => void): this;
  toHaveFailedContaining(item: unknown): this;
  toHaveFailedContainingEqual(item: unknown): this;
  toHaveFailedMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;
  toHaveFailedEmpty(): this;
  toHaveFailedCount(expected: unknown): this;
  toHaveFailedCountEqual(expected: unknown): this;
  toHaveFailedCountStrictEqual(expected: unknown): this;
  toHaveFailedCountSatisfying(matcher: (value: number) => void): this;
  toHaveFailedCountNaN(): this;
  toHaveFailedCountGreaterThan(expected: number): this;
  toHaveFailedCountGreaterThanOrEqual(expected: number): this;
  toHaveFailedCountLessThan(expected: number): this;
  toHaveFailedCountLessThanOrEqual(expected: number): this;
  toHaveFailedCountCloseTo(expected: number, numDigits?: number): this;

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

export function expectSqsSendBatchResult(
  result: SqsSendBatchResult,
): SqsSendBatchResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("send batch result")),
      // Successful
      mixin.createValueMixin(
        () => result.successful,
        negate,
        cfg("successful"),
      ),
      mixin.createArrayValueMixin(
        () => ensureNonNullish(result.successful, "successful"),
        negate,
        cfg("successful"),
      ),
      // Successful count
      mixin.createValueMixin(
        () => ensureNonNullish(result.successful, "successful").length,
        negate,
        cfg("successful count"),
      ),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.successful, "successful").length,
        negate,
        cfg("successful count"),
      ),
      // Failed
      mixin.createValueMixin(() => result.failed, negate, cfg("failed")),
      mixin.createArrayValueMixin(
        () => ensureNonNullish(result.failed, "failed"),
        negate,
        cfg("failed"),
      ),
      // Failed count
      mixin.createValueMixin(
        () => ensureNonNullish(result.failed, "failed").length,
        negate,
        cfg("failed count"),
      ),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.failed, "failed").length,
        negate,
        cfg("failed count"),
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
