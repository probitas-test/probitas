import type { SqsDeleteQueueResult } from "@probitas/client-sqs";
import * as mixin from "../mixin.ts";

/**
 * Fluent API for SQS delete queue result validation.
 *
 * Provides chainable assertions for queue deletion results.
 * Delete queue results only have ok and duration properties.
 */
export interface SqsDeleteQueueResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { SqsDeleteQueueResult } from "@probitas/client-sqs";
   * import { expectSqsDeleteQueueResult } from "./delete_queue.ts";
   * const result = {
   *   kind: "sqs:delete-queue",
   *   ok: false,
   *   duration: 0,
   * } as unknown as SqsDeleteQueueResult;
   *
   * expectSqsDeleteQueueResult(result).not.toBeOk();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result is successful.
   */
  toBeOk(): this;

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

export function expectSqsDeleteQueueResult(
  result: SqsDeleteQueueResult,
): SqsDeleteQueueResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("delete queue result")),
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
