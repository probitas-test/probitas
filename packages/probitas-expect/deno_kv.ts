import {
  buildCountAtLeastError,
  buildCountAtMostError,
  buildCountError,
  containsSubset,
  createDurationMethods,
} from "./common.ts";
import type {
  DenoKvAtomicResult,
  DenoKvDeleteResult,
  DenoKvEntries,
  DenoKvGetResult,
  DenoKvListResult,
  DenoKvResult,
  DenoKvSetResult,
} from "@probitas/client-deno-kv";

/**
 * Fluent API for validating DenoKvGetResult.
 *
 * Provides chainable assertions specifically designed for Deno KV get operation results.
 * All assertion methods return `this` to enable method chaining.
 */
export interface DenoKvGetResultExpectation<T> {
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
   * Asserts that the get operation succeeded.
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the result contains a value (not null).
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveContent();
   * ```
   */
  toHaveContent(): this;

  /**
   * Asserts that the retrieved value equals the expected value (deep equality).
   *
   * @param expected - The expected value to compare against
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveValue({ name: "Alice", age: 30 });
   * ```
   */
  toHaveValue(expected: T): this;

  /**
   * Asserts that the retrieved value contains the expected properties.
   *
   * @param subset - An object containing the expected properties
   * @example
   * ```ts
   * expectDenoKvResult(result).toMatchObject({ name: "Alice" });
   * ```
   */
  toMatchObject(subset: Partial<T>): this;

  /**
   * Asserts that the retrieved value satisfies a custom matcher function.
   *
   * @param matcher - A function that receives the value and should throw if the assertion fails
   * @example
   * ```ts
   * expectDenoKvResult(result).toSatisfy((value) => {
   *   if (value.age < 18) throw new Error("Expected adult user");
   * });
   * ```
   */
  toSatisfy(matcher: (value: T) => void): this;

  /**
   * Asserts that the result has a versionstamp (indicates the entry exists).
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveVersionstamp();
   * ```
   */
  toHaveVersionstamp(): this;

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
 * Fluent API for validating DenoKvSetResult.
 *
 * Provides chainable assertions specifically designed for Deno KV set operation results.
 * All assertion methods return `this` to enable method chaining.
 */
export interface DenoKvSetResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).not.toBeSuccessful();
   * expectDenoKvResult(result).not.toHaveVersionstamp();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the set operation succeeded.
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the result has a versionstamp (confirms the value was stored).
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveVersionstamp();
   * ```
   */
  toHaveVersionstamp(): this;

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
 * Fluent API for validating DenoKvDeleteResult.
 *
 * Provides chainable assertions specifically designed for Deno KV delete operation results.
 * All assertion methods return `this` to enable method chaining.
 */
export interface DenoKvDeleteResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).not.toBeSuccessful();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the delete operation succeeded.
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

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
 * Fluent API for validating DenoKvAtomicResult.
 *
 * Provides chainable assertions specifically designed for Deno KV atomic operation results.
 * All assertion methods return `this` to enable method chaining.
 */
export interface DenoKvAtomicResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).not.toBeSuccessful();
   * expectDenoKvResult(result).not.toHaveVersionstamp();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the atomic operation succeeded.
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the result has a versionstamp (only present on successful atomic commits).
   *
   * @example
   * ```ts
   * expectDenoKvResult(result).toHaveVersionstamp();
   * ```
   */
  toHaveVersionstamp(): this;

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
 * Check if two KvKey arrays are equal.
 */
function keysEqual(a: Deno.KvKey, b: Deno.KvKey): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Create expectation for Deno KV get result.
 */
function expectDenoKvGetResult<T>(
  result: DenoKvGetResult<T>,
  negate = false,
): DenoKvGetResultExpectation<T> {
  const self: DenoKvGetResultExpectation<T> = {
    get not(): DenoKvGetResultExpectation<T> {
      return expectDenoKvGetResult(result, !negate);
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
      const hasContent = result.value !== null;
      if (negate ? hasContent : !hasContent) {
        throw new Error(
          negate
            ? "Expected no content, but value exists"
            : "Expected content, but value is null",
        );
      }
      return this;
    },

    toHaveValue(expected: T) {
      if (result.value === null) {
        throw new Error("Expected value, but value is null");
      }
      const match = JSON.stringify(result.value) === JSON.stringify(expected);
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected value to not be ${JSON.stringify(expected)}, got ${
              JSON.stringify(result.value)
            }`
            : `Expected value ${JSON.stringify(expected)}, got ${
              JSON.stringify(result.value)
            }`,
        );
      }
      return this;
    },

    toMatchObject(subset: Partial<T>) {
      if (result.value === null) {
        throw new Error(
          "Expected data to contain properties, but value is null",
        );
      }
      const matches = containsSubset(result.value, subset);
      if (negate ? matches : !matches) {
        throw new Error(
          negate
            ? "Expected data to not contain properties"
            : "Data does not contain expected properties",
        );
      }
      return this;
    },

    toSatisfy(matcher: (value: T) => void) {
      if (result.value === null) {
        throw new Error("Expected data for matching, but value is null");
      }
      matcher(result.value);
      return this;
    },

    toHaveVersionstamp() {
      const hasStamp = result.versionstamp !== null;
      if (negate ? hasStamp : !hasStamp) {
        throw new Error(
          negate
            ? "Expected no versionstamp, but it exists"
            : "Expected versionstamp, but it is null",
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create expectation for Deno KV list result.
 */
function expectDenoKvListResult<T>(
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

/**
 * Create expectation for Deno KV set result.
 */
function expectDenoKvSetResult(
  result: DenoKvSetResult,
  negate = false,
): DenoKvSetResultExpectation {
  const self: DenoKvSetResultExpectation = {
    get not(): DenoKvSetResultExpectation {
      return expectDenoKvSetResult(result, !negate);
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

    toHaveVersionstamp() {
      const hasStamp = !!result.versionstamp;
      if (negate ? hasStamp : !hasStamp) {
        throw new Error(
          negate
            ? "Expected no versionstamp, but it exists"
            : "Expected versionstamp, but it is empty",
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create expectation for Deno KV delete result.
 */
function expectDenoKvDeleteResult(
  result: DenoKvDeleteResult,
  negate = false,
): DenoKvDeleteResultExpectation {
  const self: DenoKvDeleteResultExpectation = {
    get not(): DenoKvDeleteResultExpectation {
      return expectDenoKvDeleteResult(result, !negate);
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

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create expectation for Deno KV atomic result.
 */
function expectDenoKvAtomicResult(
  result: DenoKvAtomicResult,
  negate = false,
): DenoKvAtomicResultExpectation {
  const self: DenoKvAtomicResultExpectation = {
    get not(): DenoKvAtomicResultExpectation {
      return expectDenoKvAtomicResult(result, !negate);
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

    toHaveVersionstamp() {
      const hasStamp = !!result.versionstamp;
      if (negate ? hasStamp : !hasStamp) {
        throw new Error(
          negate
            ? "Expected no versionstamp, but it exists"
            : "Expected versionstamp, but it is missing or empty",
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Expectation type returned by expectDenoKvResult based on the result type.
 */
export type DenoKvExpectation<R extends DenoKvResult> = R extends
  DenoKvGetResult<infer T> ? DenoKvGetResultExpectation<T>
  : R extends DenoKvListResult<infer T> ? DenoKvListResultExpectation<T>
  : R extends DenoKvSetResult ? DenoKvSetResultExpectation
  : R extends DenoKvDeleteResult ? DenoKvDeleteResultExpectation
  : R extends DenoKvAtomicResult ? DenoKvAtomicResultExpectation
  : never;

/**
 * Create a fluent expectation chain for any Deno KV result validation.
 *
 * This unified function accepts any Deno KV result type and returns
 * the appropriate expectation interface based on the result's type discriminator.
 *
 * @example
 * ```ts
 * // For GET result - returns DenoKvGetResultExpectation<T>
 * const getResult = await kv.get(["users", "1"]);
 * expectDenoKvResult(getResult).toBeSuccessful().toHaveContent().toMatchObject({ name: "Alice" });
 *
 * // For SET result - returns DenoKvSetResultExpectation
 * const setResult = await kv.set(["users", "1"], { name: "Alice" });
 * expectDenoKvResult(setResult).toBeSuccessful().toHaveVersionstamp();
 *
 * // For LIST result - returns DenoKvListResultExpectation<T>
 * const listResult = await kv.list({ prefix: ["users"] });
 * expectDenoKvResult(listResult).toBeSuccessful().toHaveLength(3);
 *
 * // For DELETE result - returns DenoKvDeleteResultExpectation
 * const deleteResult = await kv.delete(["users", "1"]);
 * expectDenoKvResult(deleteResult).toBeSuccessful();
 *
 * // For ATOMIC result - returns DenoKvAtomicResultExpectation
 * const atomicResult = await kv.atomic().set(["counter"], 1).commit();
 * expectDenoKvResult(atomicResult).toBeSuccessful().toHaveVersionstamp();
 * ```
 */
// deno-lint-ignore no-explicit-any
export function expectDenoKvResult<R extends DenoKvResult<any>>(
  result: R,
): DenoKvExpectation<R> {
  switch (result.type) {
    case "deno-kv:get":
      return expectDenoKvGetResult(
        // deno-lint-ignore no-explicit-any
        result as DenoKvGetResult<any>,
      ) as unknown as DenoKvExpectation<R>;
    case "deno-kv:list":
      return expectDenoKvListResult(
        // deno-lint-ignore no-explicit-any
        result as DenoKvListResult<any>,
      ) as unknown as DenoKvExpectation<R>;
    case "deno-kv:set":
      return expectDenoKvSetResult(
        result as DenoKvSetResult,
      ) as unknown as DenoKvExpectation<R>;
    case "deno-kv:delete":
      return expectDenoKvDeleteResult(
        result as DenoKvDeleteResult,
      ) as unknown as DenoKvExpectation<R>;
    case "deno-kv:atomic":
      return expectDenoKvAtomicResult(
        result as DenoKvAtomicResult,
      ) as unknown as DenoKvExpectation<R>;
    default:
      throw new Error(
        `Unknown Deno KV result type: ${(result as { type: string }).type}`,
      );
  }
}
