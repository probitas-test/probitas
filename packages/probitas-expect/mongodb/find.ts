import type { MongoFindResult } from "@probitas/client-mongodb";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

type MongoFindDocs<T> = MongoFindResult<T>["docs"];

/**
 * Fluent API for MongoDB find result validation.
 */
export interface MongoFindResultExpectation<_T = unknown> {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { MongoFindResult } from "@probitas/client-mongodb";
   * import { expectMongoFindResult } from "./find.ts";
   * const result = {
   *   kind: "mongo:find",
   *   ok: true,
   *   docs: [{ name: "Alice" }],
   *   duration: 0,
   * } as unknown as MongoFindResult;
   *
   * expectMongoFindResult(result).not.toHaveDocsEmpty();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the find result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the docs equal the expected value.
   * @param expected - The expected docs value
   */
  toHaveDocs(expected: unknown): this;

  /**
   * Asserts that the docs equal the expected value using deep equality.
   * @param expected - The expected docs value
   */
  toHaveDocsEqual(expected: unknown): this;

  /**
   * Asserts that the docs strictly equal the expected value.
   * @param expected - The expected docs value
   */
  toHaveDocsStrictEqual(expected: unknown): this;

  /**
   * Asserts that the docs satisfy the provided matcher function.
   * @param matcher - A function that receives the docs and performs assertions
   */
  toHaveDocsSatisfying(matcher: (value: MongoFindDocs<_T>) => void): this;

  /**
   * Asserts that the docs array contains the specified item.
   * @param item - The item to search for
   */
  toHaveDocsContaining(item: unknown): this;

  /**
   * Asserts that the docs array contains an item equal to the specified value.
   * @param item - The item to search for using deep equality
   */
  toHaveDocsContainingEqual(item: unknown): this;

  /**
   * Asserts that the docs array matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveDocsMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the docs array is empty.
   */
  toHaveDocsEmpty(): this;

  /**
   * Asserts that the docs count equals the expected value.
   * @param expected - The expected docs count
   */
  toHaveDocsCount(expected: unknown): this;

  /**
   * Asserts that the docs count equals the expected value using deep equality.
   * @param expected - The expected docs count
   */
  toHaveDocsCountEqual(expected: unknown): this;

  /**
   * Asserts that the docs count strictly equals the expected value.
   * @param expected - The expected docs count
   */
  toHaveDocsCountStrictEqual(expected: unknown): this;

  /**
   * Asserts that the docs count satisfies the provided matcher function.
   * @param matcher - A function that receives the docs count and performs assertions
   */
  toHaveDocsCountSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the docs count is NaN.
   */
  toHaveDocsCountNaN(): this;

  /**
   * Asserts that the docs count is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveDocsCountGreaterThan(expected: number): this;

  /**
   * Asserts that the docs count is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveDocsCountGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the docs count is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveDocsCountLessThan(expected: number): this;

  /**
   * Asserts that the docs count is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveDocsCountLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the docs count is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveDocsCountCloseTo(expected: number, numDigits?: number): this;

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

export function expectMongoFindResult<T>(
  result: MongoFindResult<T>,
): MongoFindResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("find result")),
      // Docs
      mixin.createValueMixin(() => result.docs, negate, cfg("docs")),
      mixin.createArrayValueMixin(
        () => ensureNonNullish(result.docs, "docs"),
        negate,
        cfg("docs"),
      ),
      // Docs count
      mixin.createValueMixin(
        () => ensureNonNullish(result.docs, "docs").length,
        negate,
        cfg("docs count"),
      ),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.docs, "docs").length,
        negate,
        cfg("docs count"),
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
