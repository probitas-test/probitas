import type { MongoUpdateResult } from "@probitas/client-mongodb";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

type MongoUpsertedId = MongoUpdateResult["upsertedId"];

/**
 * Fluent API for MongoDB update result validation.
 */
export interface MongoUpdateResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { MongoUpdateResult } from "@probitas/client-mongodb";
   * import { expectMongoUpdateResult } from "./update.ts";
   * const result = {
   *   kind: "mongo:update",
   *   ok: true,
   *   matchedCount: 2,
   *   modifiedCount: 2,
   *   upsertedId: undefined,
   *   duration: 0,
   * } as unknown as MongoUpdateResult;
   *
   * expectMongoUpdateResult(result).not.toHaveMatchedCount(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the update result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the matched count equals the expected value.
   * @param expected - The expected matched count
   */
  toHaveMatchedCount(expected: unknown): this;

  /**
   * Asserts that the matched count equals the expected value using deep equality.
   * @param expected - The expected matched count
   */
  toHaveMatchedCountEqual(expected: unknown): this;

  /**
   * Asserts that the matched count strictly equals the expected value.
   * @param expected - The expected matched count
   */
  toHaveMatchedCountStrictEqual(expected: unknown): this;

  /**
   * Asserts that the matched count satisfies the provided matcher function.
   * @param matcher - A function that receives the matched count and performs assertions
   */
  toHaveMatchedCountSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the matched count is NaN.
   */
  toHaveMatchedCountNaN(): this;

  /**
   * Asserts that the matched count is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveMatchedCountGreaterThan(expected: number): this;

  /**
   * Asserts that the matched count is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveMatchedCountGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the matched count is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveMatchedCountLessThan(expected: number): this;

  /**
   * Asserts that the matched count is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveMatchedCountLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the matched count is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveMatchedCountCloseTo(expected: number, numDigits?: number): this;

  /**
   * Asserts that the modified count equals the expected value.
   * @param expected - The expected modified count
   */
  toHaveModifiedCount(expected: unknown): this;

  /**
   * Asserts that the modified count equals the expected value using deep equality.
   * @param expected - The expected modified count
   */
  toHaveModifiedCountEqual(expected: unknown): this;

  /**
   * Asserts that the modified count strictly equals the expected value.
   * @param expected - The expected modified count
   */
  toHaveModifiedCountStrictEqual(expected: unknown): this;

  /**
   * Asserts that the modified count satisfies the provided matcher function.
   * @param matcher - A function that receives the modified count and performs assertions
   */
  toHaveModifiedCountSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the modified count is NaN.
   */
  toHaveModifiedCountNaN(): this;

  /**
   * Asserts that the modified count is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveModifiedCountGreaterThan(expected: number): this;

  /**
   * Asserts that the modified count is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveModifiedCountGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the modified count is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveModifiedCountLessThan(expected: number): this;

  /**
   * Asserts that the modified count is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveModifiedCountLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the modified count is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveModifiedCountCloseTo(expected: number, numDigits?: number): this;

  /**
   * Asserts that the upserted ID equals the expected value.
   * @param expected - The expected upserted ID
   */
  toHaveUpsertedId(expected: unknown): this;

  /**
   * Asserts that the upserted ID equals the expected value using deep equality.
   * @param expected - The expected upserted ID
   */
  toHaveUpsertedIdEqual(expected: unknown): this;

  /**
   * Asserts that the upserted ID strictly equals the expected value.
   * @param expected - The expected upserted ID
   */
  toHaveUpsertedIdStrictEqual(expected: unknown): this;

  /**
   * Asserts that the upserted ID satisfies the provided matcher function.
   * @param matcher - A function that receives the upserted ID and performs assertions
   */
  toHaveUpsertedIdSatisfying(
    matcher: (value: MongoUpsertedId) => void,
  ): this;

  /**
   * Asserts that the upserted ID is present (not null or undefined).
   */
  toHaveUpsertedIdPresent(): this;

  /**
   * Asserts that the upserted ID is null.
   */
  toHaveUpsertedIdNull(): this;

  /**
   * Asserts that the upserted ID is undefined.
   */
  toHaveUpsertedIdUndefined(): this;

  /**
   * Asserts that the upserted ID is nullish (null or undefined).
   */
  toHaveUpsertedIdNullish(): this;

  /**
   * Asserts that the upserted ID contains the specified substring.
   * @param substr - The substring to search for
   */
  toHaveUpsertedIdContaining(substr: string): this;

  /**
   * Asserts that the upserted ID matches the specified regular expression.
   * @param expected - The regular expression to match against
   */
  toHaveUpsertedIdMatching(expected: RegExp): this;

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

export function expectMongoUpdateResult(
  result: MongoUpdateResult,
): MongoUpdateResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("update result")),
      // Matched count
      mixin.createValueMixin(
        () => result.matchedCount,
        negate,
        cfg("matched count"),
      ),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.matchedCount, "matchedCount"),
        negate,
        cfg("matched count"),
      ),
      // Modified count
      mixin.createValueMixin(
        () => result.modifiedCount,
        negate,
        cfg("modified count"),
      ),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.modifiedCount, "modifiedCount"),
        negate,
        cfg("modified count"),
      ),
      // Upserted ID
      mixin.createValueMixin(
        () => result.upsertedId,
        negate,
        cfg("upserted id"),
      ),
      mixin.createNullishValueMixin(
        () => result.upsertedId,
        negate,
        cfg("upserted id"),
      ),
      mixin.createStringValueMixin(
        () => ensureNonNullish(result.upsertedId, "upserted id"),
        negate,
        cfg("upserted id"),
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
