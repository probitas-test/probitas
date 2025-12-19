import type { MongoInsertOneResult } from "@probitas/client-mongodb";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

/**
 * Fluent API for MongoDB insertOne result validation.
 */
export interface MongoInsertOneResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { MongoInsertOneResult } from "@probitas/client-mongodb";
   * import { expectMongoInsertOneResult } from "./insert_one.ts";
   * const result = {
   *   kind: "mongo:insert-one",
   *   ok: false,
   *   insertedId: "123",
   *   duration: 0,
   * } as unknown as MongoInsertOneResult;
   *
   * expectMongoInsertOneResult(result).not.toBeOk();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the insert result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the inserted ID equals the expected value.
   * @param expected - The expected inserted ID
   */
  toHaveInsertedId(expected: unknown): this;

  /**
   * Asserts that the inserted ID equals the expected value using deep equality.
   * @param expected - The expected inserted ID
   */
  toHaveInsertedIdEqual(expected: unknown): this;

  /**
   * Asserts that the inserted ID strictly equals the expected value.
   * @param expected - The expected inserted ID
   */
  toHaveInsertedIdStrictEqual(expected: unknown): this;

  /**
   * Asserts that the inserted ID satisfies the provided matcher function.
   * @param matcher - A function that receives the inserted ID and performs assertions
   */
  toHaveInsertedIdSatisfying(matcher: (value: string) => void): this;

  /**
   * Asserts that the inserted ID contains the specified substring.
   * @param substr - The substring to search for
   */
  toHaveInsertedIdContaining(substr: string): this;

  /**
   * Asserts that the inserted ID matches the specified regular expression.
   * @param expected - The regular expression to match against
   */
  toHaveInsertedIdMatching(expected: RegExp): this;

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

export function expectMongoInsertOneResult(
  result: MongoInsertOneResult,
): MongoInsertOneResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("insert result")),
      // Inserted id
      mixin.createValueMixin(
        () => result.insertedId,
        negate,
        cfg("inserted id"),
      ),
      mixin.createStringValueMixin(
        () => ensureNonNullish(result.insertedId, "insertedId"),
        negate,
        cfg("inserted id"),
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
