import type { SqsDeleteBatchResult } from "@probitas/client-sqs";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

type SqsDeleteBatchSuccessful = SqsDeleteBatchResult["successful"];
type SqsDeleteBatchFailed = SqsDeleteBatchResult["failed"];

export interface SqsDeleteBatchResultExpectation {
  /**
   * Negates the next assertion.
   */
  readonly not: this;

  toBeOk(): this;

  toHaveSuccessful(expected: unknown): this;
  toHaveSuccessfulEqual(expected: unknown): this;
  toHaveSuccessfulStrictEqual(expected: unknown): this;
  toHaveSuccessfulSatisfying(
    matcher: (value: SqsDeleteBatchSuccessful) => void,
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
  toHaveFailedSatisfying(matcher: (value: SqsDeleteBatchFailed) => void): this;
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

  toHaveDuration(expected: unknown): this;
  toHaveDurationEqual(expected: unknown): this;
  toHaveDurationStrictEqual(expected: unknown): this;
  toHaveDurationSatisfying(matcher: (value: number) => void): this;
  toHaveDurationNaN(): this;
  toHaveDurationGreaterThan(expected: number): this;
  toHaveDurationGreaterThanOrEqual(expected: number): this;
  toHaveDurationLessThan(expected: number): this;
  toHaveDurationLessThanOrEqual(expected: number): this;
  toHaveDurationCloseTo(expected: number, numDigits?: number): this;
}

export function expectSqsDeleteBatchResult(
  result: SqsDeleteBatchResult,
): SqsDeleteBatchResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("delete batch result")),
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
