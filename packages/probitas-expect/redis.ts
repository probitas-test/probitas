import {
  buildCountAtLeastError,
  buildCountAtMostError,
  buildCountError,
  createDurationMethods,
} from "./common.ts";
import type {
  RedisArrayResult,
  RedisCommonResult,
  RedisCountResult,
  RedisGetResult,
  RedisHashResult,
  RedisResult,
  RedisSetResult,
} from "@probitas/client-redis";

/**
 * Base fluent API for Redis result validation.
 *
 * Provides chainable assertions for validating Redis operation results,
 * including success status, data values, and operation duration.
 */
export interface RedisResultExpectation<T> {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectRedisResult(result).not.toBeSuccessful();
   * expectRedisResult(result).not.toHaveData("unexpected");
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the Redis operation was successful (ok is true).
   *
   * @example
   * ```ts
   * expectRedisResult(result).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the result data matches the expected value using strict equality.
   *
   * @param expected - The expected data value
   * @example
   * ```ts
   * expectRedisResult(result).toHaveData("myValue");
   * expectRedisResult(result).toHaveData(null);
   * ```
   */
  toHaveData(expected: T): this;

  /**
   * Asserts that the result data satisfies a custom matcher function.
   *
   * The matcher function receives the result value and should throw
   * an error if the assertion fails.
   *
   * @param matcher - A function that validates the value
   * @example
   * ```ts
   * expectRedisResult(result).toSatisfy((value) => {
   *   if (value !== "expected") {
   *     throw new Error("Value mismatch");
   *   }
   * });
   * ```
   */
  toSatisfy(matcher: (value: T) => void): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds (exclusive)
   * @example
   * ```ts
   * expectRedisResult(result).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectRedisResult(result).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds (exclusive)
   * @example
   * ```ts
   * expectRedisResult(result).toHaveDurationGreaterThan(10);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectRedisResult(result).toHaveDurationGreaterThanOrEqual(10);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for Redis count result validation.
 *
 * Extends {@linkcode RedisResultExpectation} with additional assertions
 * specific to count-based results (e.g., DEL, LPUSH, SCARD operations).
 */
export interface RedisCountResultExpectation
  extends RedisResultExpectation<number> {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectRedisResult(result).not.toHaveLength(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the count equals the expected value.
   *
   * @param expected - The expected count value
   * @example
   * ```ts
   * expectRedisResult(result).toHaveLength(5);
   * ```
   */
  toHaveLength(expected: number): this;

  /**
   * Asserts that the count is greater than or equal to the minimum value.
   *
   * @param min - The minimum count value (inclusive)
   * @example
   * ```ts
   * expectRedisResult(result).toHaveLengthGreaterThanOrEqual(1);
   * ```
   */
  toHaveLengthGreaterThanOrEqual(min: number): this;

  /**
   * Asserts that the count is less than or equal to the maximum value.
   *
   * @param max - The maximum count value (inclusive)
   * @example
   * ```ts
   * expectRedisResult(result).toHaveLengthLessThanOrEqual(10);
   * ```
   */
  toHaveLengthLessThanOrEqual(max: number): this;
}

/**
 * Fluent API for Redis array result validation.
 *
 * Extends {@linkcode RedisResultExpectation} with additional assertions
 * specific to array-based results (e.g., LRANGE, SMEMBERS, KEYS operations).
 */
export interface RedisArrayResultExpectation<T>
  extends RedisResultExpectation<readonly T[]> {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectRedisResult(result).not.toHaveContent();
   * expectRedisResult(result).not.toContain("item");
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the array is not empty (contains at least one item).
   *
   * @example
   * ```ts
   * expectRedisResult(result).toHaveContent();
   * ```
   */
  toHaveContent(): this;

  /**
   * Asserts that the array length equals the expected value.
   *
   * @param expected - The expected array length
   * @example
   * ```ts
   * expectRedisResult(result).toHaveLength(3);
   * ```
   */
  toHaveLength(expected: number): this;

  /**
   * Asserts that the array length is greater than or equal to the minimum value.
   *
   * @param min - The minimum array length (inclusive)
   * @example
   * ```ts
   * expectRedisResult(result).toHaveLengthGreaterThanOrEqual(1);
   * ```
   */
  toHaveLengthGreaterThanOrEqual(min: number): this;

  /**
   * Asserts that the array length is less than or equal to the maximum value.
   *
   * @param max - The maximum array length (inclusive)
   * @example
   * ```ts
   * expectRedisResult(result).toHaveLengthLessThanOrEqual(100);
   * ```
   */
  toHaveLengthLessThanOrEqual(max: number): this;

  /**
   * Asserts that the array contains the specified item.
   *
   * @param item - The item to check for
   * @example
   * ```ts
   * expectRedisResult(result).toContain("myItem");
   * expectRedisResult(result).toContain("value1").toContain("value2");
   * ```
   */
  toContain(item: T): this;
}

/**
 * Common shape for all Redis results (internal use only).
 */
interface RedisResultShape<T> {
  readonly type: string;
  readonly ok: boolean;
  readonly value: T;
  readonly duration: number;
}

/**
 * Create base expectation for Redis result.
 */
function expectRedisResultBase<T>(
  result: RedisResultShape<T>,
  negate = false,
): RedisResultExpectation<T> {
  const self: RedisResultExpectation<T> = {
    get not(): RedisResultExpectation<T> {
      return expectRedisResultBase(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? "Expected not ok result, but ok is true"
            : "Expected ok result, but ok is false",
        );
      }
      return this;
    },

    toHaveData(expected: T) {
      const match = result.value === expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected data to not be ${JSON.stringify(expected)}, got ${
              JSON.stringify(result.value)
            }`
            : `Expected data ${JSON.stringify(expected)}, got ${
              JSON.stringify(result.value)
            }`,
        );
      }
      return this;
    },

    toSatisfy(matcher: (value: T) => void) {
      matcher(result.value);
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create expectation for Redis count result.
 */
function expectRedisCountResult(
  result: RedisCountResult,
  negate = false,
): RedisCountResultExpectation {
  const base = expectRedisResultBase(result, negate);

  const self: RedisCountResultExpectation = {
    get not(): RedisCountResultExpectation {
      return expectRedisCountResult(result, !negate);
    },

    toBeSuccessful() {
      base.toBeSuccessful();
      return this;
    },

    toHaveData(expected: number) {
      base.toHaveData(expected);
      return this;
    },

    toSatisfy(matcher: (value: number) => void) {
      base.toSatisfy(matcher);
      return this;
    },

    toHaveDurationLessThan(ms: number) {
      base.toHaveDurationLessThan(ms);
      return this;
    },

    toHaveDurationLessThanOrEqual(ms: number) {
      base.toHaveDurationLessThanOrEqual(ms);
      return this;
    },

    toHaveDurationGreaterThan(ms: number) {
      base.toHaveDurationGreaterThan(ms);
      return this;
    },

    toHaveDurationGreaterThanOrEqual(ms: number) {
      base.toHaveDurationGreaterThanOrEqual(ms);
      return this;
    },

    toHaveLength(expected: number) {
      const match = result.value === expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected count to not be ${expected}, got ${result.value}`
            : buildCountError(expected, result.value, "count"),
        );
      }
      return this;
    },

    toHaveLengthGreaterThanOrEqual(min: number) {
      const match = result.value >= min;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected count to not be >= ${min}, got ${result.value}`
            : buildCountAtLeastError(min, result.value, "count"),
        );
      }
      return this;
    },

    toHaveLengthLessThanOrEqual(max: number) {
      const match = result.value <= max;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected count to not be <= ${max}, got ${result.value}`
            : buildCountAtMostError(max, result.value, "count"),
        );
      }
      return this;
    },
  };

  return self;
}

/**
 * Create expectation for Redis array result.
 */
function expectRedisArrayResult<T>(
  result: RedisArrayResult<T>,
  negate = false,
): RedisArrayResultExpectation<T> {
  const base = expectRedisResultBase(result, negate);

  const self: RedisArrayResultExpectation<T> = {
    get not(): RedisArrayResultExpectation<T> {
      return expectRedisArrayResult(result, !negate);
    },

    toBeSuccessful() {
      base.toBeSuccessful();
      return this;
    },

    toHaveData(expected: readonly T[]) {
      base.toHaveData(expected);
      return this;
    },

    toSatisfy(matcher: (value: readonly T[]) => void) {
      base.toSatisfy(matcher);
      return this;
    },

    toHaveDurationLessThan(ms: number) {
      base.toHaveDurationLessThan(ms);
      return this;
    },

    toHaveDurationLessThanOrEqual(ms: number) {
      base.toHaveDurationLessThanOrEqual(ms);
      return this;
    },

    toHaveDurationGreaterThan(ms: number) {
      base.toHaveDurationGreaterThan(ms);
      return this;
    },

    toHaveDurationGreaterThanOrEqual(ms: number) {
      base.toHaveDurationGreaterThanOrEqual(ms);
      return this;
    },

    toHaveContent() {
      const hasContent = result.value.length > 0;
      if (negate ? hasContent : !hasContent) {
        throw new Error(
          negate
            ? `Expected empty array, got ${result.value.length} items`
            : "Expected non-empty array, but array is empty",
        );
      }
      return this;
    },

    toHaveLength(expected: number) {
      const match = result.value.length === expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected array count to not be ${expected}, got ${result.value.length}`
            : buildCountError(expected, result.value.length, "array count"),
        );
      }
      return this;
    },

    toHaveLengthGreaterThanOrEqual(min: number) {
      const match = result.value.length >= min;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected array count to not be >= ${min}, got ${result.value.length}`
            : buildCountAtLeastError(min, result.value.length, "array count"),
        );
      }
      return this;
    },

    toHaveLengthLessThanOrEqual(max: number) {
      const match = result.value.length <= max;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected array count to not be <= ${max}, got ${result.value.length}`
            : buildCountAtMostError(max, result.value.length, "array count"),
        );
      }
      return this;
    },

    toContain(item: T) {
      const found = result.value.includes(item);
      if (negate ? found : !found) {
        throw new Error(
          negate
            ? `Expected array to not contain ${JSON.stringify(item)}`
            : `Expected array to contain ${JSON.stringify(item)}`,
        );
      }
      return this;
    },
  };

  return self;
}

/**
 * Expectation type returned by expectRedisResult based on the result type.
 */
export type RedisExpectation<R extends RedisResult> = R extends RedisCountResult
  ? RedisCountResultExpectation
  : R extends RedisArrayResult<infer T> ? RedisArrayResultExpectation<T>
  : R extends RedisGetResult ? RedisResultExpectation<string | null>
  : R extends RedisSetResult ? RedisResultExpectation<"OK">
  : R extends RedisHashResult ? RedisResultExpectation<Record<string, string>>
  : R extends RedisCommonResult<infer T> ? RedisResultExpectation<T>
  : never;

/**
 * Create a fluent expectation chain for any Redis result validation.
 *
 * This unified function accepts any Redis result type and returns
 * the appropriate expectation interface based on the result's type discriminator.
 *
 * @example
 * ```ts
 * // For GET result - returns RedisResultExpectation<string | null>
 * const getResult = await client.get("key");
 * expectRedisResult(getResult).toBeSuccessful().toHaveValue("expected");
 *
 * // For COUNT result - returns RedisCountResultExpectation
 * const countResult = await client.del("key");
 * expectRedisResult(countResult).toBeSuccessful().toHaveCount(1);
 *
 * // For ARRAY result - returns RedisArrayResultExpectation
 * const arrayResult = await client.lrange("list", 0, -1);
 * expectRedisResult(arrayResult).toBeSuccessful().toHaveLength(3).toContain("item");
 * ```
 */
// deno-lint-ignore no-explicit-any
export function expectRedisResult<R extends RedisResult<any>>(
  result: R,
): RedisExpectation<R> {
  switch (result.type) {
    case "redis:count":
      return expectRedisCountResult(
        result as RedisCountResult,
      ) as unknown as RedisExpectation<R>;
    case "redis:array":
      return expectRedisArrayResult(
        // deno-lint-ignore no-explicit-any
        result as RedisArrayResult<any>,
      ) as unknown as RedisExpectation<R>;
    case "redis:get":
    case "redis:set":
    case "redis:hash":
    case "redis:common":
      return expectRedisResultBase(
        result,
      ) as unknown as RedisExpectation<R>;
    default:
      throw new Error(
        `Unknown Redis result type: ${(result as { type: string }).type}`,
      );
  }
}
