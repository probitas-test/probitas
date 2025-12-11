import {
  buildCountAtLeastError,
  buildCountAtMostError,
  buildCountError,
  containsSubset,
  createDurationMethods,
} from "../common.ts";
import type { DenoKvEntries, DenoKvListResult } from "@probitas/client-deno-kv";
import { keysEqual } from "./utils.ts";

/**
 * Fluent API for validating DenoKvListResult.
 *
 * Provides chainable assertions specifically designed for Deno KV list operation results.
 * All assertion methods return `this` to enable method chaining.
 */
export interface DenoKvListResultExpectation<T> {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).not.toBeSuccessful();
   * expectDenoKvResult(result).not.toHaveContent();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the list operation succeeded.
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the result contains at least one entry.
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveContent();
   * ```
   */
  toHaveContent(): this;

  /**
   * Asserts that the number of entries equals the expected count.
   *
   * @param expected - The expected number of entries
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveLength(3);
   * ```
   */
  toHaveLength(expected: number): this;

  /**
   * Asserts that the number of entries is at least the specified minimum.
   *
   * @param min - The minimum number of entries (inclusive)
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveLengthGreaterThanOrEqual(5);
   * ```
   */
  toHaveLengthGreaterThanOrEqual(min: number): this;

  /**
   * Asserts that the number of entries is at most the specified maximum.
   *
   * @param max - The maximum number of entries (inclusive)
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveLengthLessThanOrEqual(10);
   * ```
   */
  toHaveLengthLessThanOrEqual(max: number): this;

  /**
   * Asserts that at least one entry matches the specified criteria.
   *
   * @param subset - An object containing optional key and/or value properties to match
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveEntryContaining({ key: ["users", "1"] });
   * expectDenoKvResult(result).toHaveEntryContaining({ value: { name: "Alice" } });
   * expectDenoKvResult(result).toHaveEntryContaining({ key: ["users", "1"], value: { active: true } });
   * ```
   */
  toHaveEntryContaining(subset: { key?: Deno.KvKey; value?: Partial<T> }): this;

  /**
   * Asserts that the entries satisfy a custom matcher function.
   *
   * @param matcher - A function that receives the entries array and should throw if the assertion fails
   * @example
   * ```ts
   * expectDenoKvResult(result).toSatisfy((entries) => {
   *   const activeCount = entries.filter(e => e.value.active).length;
   *   if (activeCount < 3) throw new Error("Expected at least 3 active entries");
   * });
   * ```
   */
  toSatisfy(matcher: (entries: DenoKvEntries<T>) => void): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds (exclusive)
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds (exclusive)
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveDurationGreaterThan(10);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveDurationGreaterThanOrEqual(10);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Create expectation for Deno KV list result.
 */
export function expectDenoKvListResult<T>(
  result: DenoKvListResult<T>,
  negate = false,
): DenoKvListResultExpectation<T> {
  const self: DenoKvListResultExpectation<T> = {
    get not(): DenoKvListResultExpectation<T> {
      return expectDenoKvListResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate ? "Expected not ok result" : "Expected ok result",
        );
      }
      return this;
    },

    toHaveContent() {
      const hasContent = result.entries.length > 0;
      if (negate ? hasContent : !hasContent) {
        throw new Error(
          negate
            ? `Expected no entries, but found ${result.entries.length}`
            : "Expected entries, but none found",
        );
      }
      return this;
    },

    toHaveLength(expected: number) {
      const match = result.entries.length === expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected entry count to not be ${expected}, got ${result.entries.length}`
            : buildCountError(expected, result.entries.length, "entries"),
        );
      }
      return this;
    },

    toHaveLengthGreaterThanOrEqual(min: number) {
      const match = result.entries.length >= min;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected entry count to not be >= ${min}, got ${result.entries.length}`
            : buildCountAtLeastError(min, result.entries.length, "entries"),
        );
      }
      return this;
    },

    toHaveLengthLessThanOrEqual(max: number) {
      const match = result.entries.length <= max;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected entry count to not be <= ${max}, got ${result.entries.length}`
            : buildCountAtMostError(max, result.entries.length, "entries"),
        );
      }
      return this;
    },

    toHaveEntryContaining(subset: { key?: Deno.KvKey; value?: Partial<T> }) {
      const found = result.entries.some((entry) => {
        if (subset.key !== undefined && !keysEqual(entry.key, subset.key)) {
          return false;
        }
        if (
          subset.value !== undefined &&
          !containsSubset(entry.value, subset.value)
        ) {
          return false;
        }
        return true;
      });

      if (negate ? found : !found) {
        throw new Error(
          negate
            ? "Expected no entry to match the criteria, but found one"
            : "No entry matches the expected criteria",
        );
      }
      return this;
    },

    toSatisfy(matcher: (entries: DenoKvEntries<T>) => void) {
      matcher(result.entries);
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}
