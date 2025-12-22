import type { MongoFindOneResult } from "@probitas/client-mongodb";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

type MongoFindOneDoc<T> = MongoFindOneResult<T>["doc"];

/**
 * Fluent API for MongoDB findOne result validation.
 */
export interface MongoFindOneResultExpectation<_T = unknown> {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { MongoFindOneResult } from "@probitas/client-mongodb";
   * import { expectMongoFindOneResult } from "./find_one.ts";
   * const result = {
   *   kind: "mongo:find-one",
   *   ok: true,
   *   doc: { name: "Alice" },
   *   duration: 0,
   * } as unknown as MongoFindOneResult;
   *
   * expectMongoFindOneResult(result).not.toHaveDocNullish();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the findOne result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the doc equals the expected value.
   * @param expected - The expected doc value
   */
  toHaveDoc(expected: unknown): this;

  /**
   * Asserts that the doc equals the expected value using deep equality.
   * @param expected - The expected doc value
   */
  toHaveDocEqual(expected: unknown): this;

  /**
   * Asserts that the doc strictly equals the expected value.
   * @param expected - The expected doc value
   */
  toHaveDocStrictEqual(expected: unknown): this;

  /**
   * Asserts that the doc satisfies the provided matcher function.
   * @param matcher - A function that receives the doc and performs assertions
   */
  toHaveDocSatisfying(
    matcher: (value: MongoFindOneDoc<_T>) => void,
  ): this;

  /**
   * Asserts that the doc is present (not null or undefined).
   */
  toHaveDocPresent(): this;

  /**
   * Asserts that the doc is null.
   */
  toHaveDocNull(): this;

  /**
   * Asserts that the doc is undefined.
   */
  toHaveDocUndefined(): this;

  /**
   * Asserts that the doc is nullish (null or undefined).
   */
  toHaveDocNullish(): this;

  /**
   * Asserts that the doc matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveDocMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the doc has the specified property.
   * @param keyPath - The key path to check
   * @param value - Optional expected value at the key path
   */
  toHaveDocProperty(keyPath: string | string[], value?: unknown): this;

  /**
   * Asserts that the doc property contains the expected value.
   * @param keyPath - The key path to check
   * @param expected - The expected contained value
   */
  toHaveDocPropertyContaining(
    keyPath: string | string[],
    expected: unknown,
  ): this;

  /**
   * Asserts that the doc property matches the specified subset.
   * @param keyPath - The key path to check
   * @param subset - The subset to match against
   */
  toHaveDocPropertyMatching(
    keyPath: string | string[],
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the doc property satisfies the provided matcher function.
   * @param keyPath - The key path to check
   * @param matcher - A function that receives the property value and performs assertions
   */
  toHaveDocPropertySatisfying<I>(
    keyPath: string | string[],
    matcher: (value: I) => void,
  ): this;

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

export function expectMongoFindOneResult<T>(
  result: MongoFindOneResult<T>,
): MongoFindOneResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("findOne result")),
      // Doc
      mixin.createValueMixin(() => result.doc, negate, cfg("doc")),
      mixin.createNullishValueMixin(() => result.doc, negate, cfg("doc")),
      mixin.createObjectValueMixin(
        () => ensureNonNullish(result.doc, "doc"),
        negate,
        cfg("doc"),
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
