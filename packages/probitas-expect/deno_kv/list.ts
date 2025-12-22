import type { DenoKvListResult } from "@probitas/client-deno-kv";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

type DenoKvEntries<T> = DenoKvListResult<T>["entries"];

/**
 * Fluent API for validating DenoKvListResult.
 *
 * Provides chainable assertions specifically designed for Deno KV list operation results.
 * All assertion methods return `this` to enable method chaining.
 */
export interface DenoKvListResultExpectation<_T = unknown> {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { DenoKvListResult } from "@probitas/client-deno-kv";
   * import { expectDenoKvListResult } from "./list.ts";
   * const result = {
   *   kind: "deno-kv:list",
   *   ok: false,
   *   entries: [],
   *   duration: 0,
   * } as unknown as DenoKvListResult<unknown>;
   *
   * expectDenoKvListResult(result).not.toBeOk();
   * expectDenoKvListResult(result).not.toHaveEntryCount(5);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the entries equal the expected value.
   * @param expected - The expected entries value
   */
  toHaveEntries(expected: unknown): this;

  /**
   * Asserts that the entries equal the expected value using deep equality.
   * @param expected - The expected entries value
   */
  toHaveEntriesEqual(expected: unknown): this;

  /**
   * Asserts that the entries strictly equal the expected value.
   * @param expected - The expected entries value
   */
  toHaveEntriesStrictEqual(expected: unknown): this;

  /**
   * Asserts that the entries satisfy the provided matcher function.
   * @param matcher - A function that receives the entries and performs assertions
   */
  toHaveEntriesSatisfying(matcher: (value: DenoKvEntries<_T>) => void): this;

  /**
   * Asserts that the entries array contains the specified item.
   * @param item - The item to search for
   */
  toHaveEntriesContaining(item: unknown): this;

  /**
   * Asserts that the entries array contains an item equal to the specified value.
   * @param item - The item to search for using deep equality
   */
  toHaveEntriesContainingEqual(item: unknown): this;

  /**
   * Asserts that the entries array matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveEntriesMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the entries array is empty.
   */
  toHaveEntriesEmpty(): this;

  /**
   * Asserts that the entry count equals the expected value.
   * @param expected - The expected entry count
   */
  toHaveEntryCount(expected: unknown): this;

  /**
   * Asserts that the entry count equals the expected value using deep equality.
   * @param expected - The expected entry count
   */
  toHaveEntryCountEqual(expected: unknown): this;

  /**
   * Asserts that the entry count strictly equals the expected value.
   * @param expected - The expected entry count
   */
  toHaveEntryCountStrictEqual(expected: unknown): this;

  /**
   * Asserts that the entry count satisfies the provided matcher function.
   * @param matcher - A function that receives the entry count and performs assertions
   */
  toHaveEntryCountSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the entry count is NaN.
   */
  toHaveEntryCountNaN(): this;

  /**
   * Asserts that the entry count is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveEntryCountGreaterThan(expected: number): this;

  /**
   * Asserts that the entry count is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveEntryCountGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the entry count is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveEntryCountLessThan(expected: number): this;

  /**
   * Asserts that the entry count is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveEntryCountLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the entry count is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveEntryCountCloseTo(expected: number, numDigits?: number): this;

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

/**
 * Create expectation for Deno KV list result.
 */
export function expectDenoKvListResult<T>(
  result: DenoKvListResult<T>,
): DenoKvListResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("result")),
      // Entries
      mixin.createValueMixin(() => result.entries, negate, cfg("entries")),
      mixin.createArrayValueMixin(
        () => ensureNonNullish(result.entries, "entries"),
        negate,
        cfg("entries"),
      ),
      // Entry count
      mixin.createValueMixin(
        () => ensureNonNullish(result.entries, "entries").length,
        negate,
        cfg("entry count"),
      ),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(result.entries, "entries").length,
        negate,
        cfg("entry count"),
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
