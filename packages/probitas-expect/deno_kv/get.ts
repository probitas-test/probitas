import { containsSubset, createDurationMethods } from "../common.ts";
import type { DenoKvGetResult } from "@probitas/client-deno-kv";

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
 * Create expectation for Deno KV get result.
 */
export function expectDenoKvGetResult<T>(
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
