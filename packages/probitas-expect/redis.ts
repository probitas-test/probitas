import {
  buildCountAtLeastError,
  buildCountAtMostError,
  buildCountError,
  buildDurationError,
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
 * Common shape for all Redis results (internal use only).
 */
interface RedisResultShape<T> {
  readonly type: string;
  readonly ok: boolean;
  readonly value: T;
  readonly duration: number;
}

/**
 * Base fluent API for Redis result validation.
 */
export interface RedisResultExpectation<T> {
  /** Negates the next assertion */
  readonly not: this;

  /** Assert that result ok is true */
  toBeSuccessful(): this;

  /** Assert that data matches expected */
  toHaveData(expected: T): this;

  /** Assert data using custom matcher function */
  toSatisfy(matcher: (value: T) => void): this;

  /** Assert that duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for Redis count result validation.
 */
export interface RedisCountResultExpectation
  extends RedisResultExpectation<number> {
  /** Assert that count equals expected */
  toHaveLength(expected: number): this;

  /** Assert that count is at least min */
  toHaveLengthGreaterThanOrEqual(min: number): this;

  /** Assert that count is at most max */
  toHaveLengthLessThanOrEqual(max: number): this;
}

/**
 * Fluent API for Redis array result validation.
 */
export interface RedisArrayResultExpectation<T>
  extends RedisResultExpectation<readonly T[]> {
  /** Assert that array is not empty */
  toHaveContent(): this;

  /** Assert that array count equals expected */
  toHaveLength(expected: number): this;

  /** Assert that array count is at least min */
  toHaveLengthGreaterThanOrEqual(min: number): this;

  /** Assert that array count is at most max */
  toHaveLengthLessThanOrEqual(max: number): this;

  /** Assert that array contains item */
  toContain(item: T): this;
}

/**
 * Base implementation for Redis result expectations.
 */
class RedisResultExpectationImpl<T> implements RedisResultExpectation<T> {
  protected readonly result: RedisResultShape<T>;
  protected readonly negate: boolean;

  constructor(result: RedisResultShape<T>, negate = false) {
    this.result = result;
    this.negate = negate;
  }

  get not(): this {
    return new (this.constructor as new (
      result: RedisResultShape<T>,
      negate: boolean,
    ) => this)(this.result, !this.negate);
  }

  toBeSuccessful(): this {
    const isSuccess = this.result.ok;
    if (this.negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  toHaveData(expected: T): this {
    if (this.result.value !== expected) {
      throw new Error(
        `Expected data ${JSON.stringify(expected)}, got ${
          JSON.stringify(this.result.value)
        }`,
      );
    }
    return this;
  }

  toSatisfy(matcher: (value: T) => void): this {
    matcher(this.result.value);
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.result.duration));
    }
    return this;
  }

  toHaveDurationLessThanOrEqual(ms: number): this {
    if (this.result.duration > ms) {
      throw new Error(
        `Expected duration <= ${ms}ms, but got ${this.result.duration}ms`,
      );
    }
    return this;
  }

  toHaveDurationGreaterThan(ms: number): this {
    if (this.result.duration <= ms) {
      throw new Error(
        `Expected duration > ${ms}ms, but got ${this.result.duration}ms`,
      );
    }
    return this;
  }

  toHaveDurationGreaterThanOrEqual(ms: number): this {
    if (this.result.duration < ms) {
      throw new Error(
        `Expected duration >= ${ms}ms, but got ${this.result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Implementation for Redis count result expectations.
 */
class RedisCountResultExpectationImpl extends RedisResultExpectationImpl<number>
  implements RedisCountResultExpectation {
  constructor(result: RedisCountResult, negate = false) {
    super(result, negate);
  }

  toHaveLength(expected: number): this {
    if (this.result.value !== expected) {
      throw new Error(
        buildCountError(expected, this.result.value, "count"),
      );
    }
    return this;
  }

  toHaveLengthGreaterThanOrEqual(min: number): this {
    if (this.result.value < min) {
      throw new Error(
        buildCountAtLeastError(min, this.result.value, "count"),
      );
    }
    return this;
  }

  toHaveLengthLessThanOrEqual(max: number): this {
    if (this.result.value > max) {
      throw new Error(
        buildCountAtMostError(max, this.result.value, "count"),
      );
    }
    return this;
  }
}

/**
 * Implementation for Redis array result expectations.
 */
class RedisArrayResultExpectationImpl<T>
  extends RedisResultExpectationImpl<readonly T[]>
  implements RedisArrayResultExpectation<T> {
  constructor(result: RedisArrayResult<T>, negate = false) {
    super(result, negate);
  }

  toHaveContent(): this {
    const hasContent = this.result.value.length > 0;
    if (this.negate ? hasContent : !hasContent) {
      throw new Error(
        this.negate
          ? `Expected empty array, got ${this.result.value.length} items`
          : "Expected non-empty array, but array is empty",
      );
    }
    return this;
  }

  toHaveLength(expected: number): this {
    if (this.result.value.length !== expected) {
      throw new Error(
        buildCountError(expected, this.result.value.length, "array count"),
      );
    }
    return this;
  }

  toHaveLengthGreaterThanOrEqual(min: number): this {
    if (this.result.value.length < min) {
      throw new Error(
        buildCountAtLeastError(min, this.result.value.length, "array count"),
      );
    }
    return this;
  }

  toHaveLengthLessThanOrEqual(max: number): this {
    if (this.result.value.length > max) {
      throw new Error(
        buildCountAtMostError(max, this.result.value.length, "array count"),
      );
    }
    return this;
  }

  toContain(item: T): this {
    if (!this.result.value.includes(item)) {
      throw new Error(
        `Expected array to contain ${JSON.stringify(item)}`,
      );
    }
    return this;
  }
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
 * expectRedisResult(getResult).ok().data("expected");
 *
 * // For COUNT result - returns RedisCountResultExpectation
 * const countResult = await client.del("key");
 * expectRedisResult(countResult).ok().count(1);
 *
 * // For ARRAY result - returns RedisArrayResultExpectation
 * const arrayResult = await client.lrange("list", 0, -1);
 * expectRedisResult(arrayResult).ok().count(3).contains("item");
 * ```
 */
// deno-lint-ignore no-explicit-any
export function expectRedisResult<R extends RedisResult<any>>(
  result: R,
): RedisExpectation<R> {
  switch (result.type) {
    case "redis:count":
      return new RedisCountResultExpectationImpl(
        result as RedisCountResult,
      ) as unknown as RedisExpectation<R>;
    case "redis:array":
      return new RedisArrayResultExpectationImpl(
        // deno-lint-ignore no-explicit-any
        result as RedisArrayResult<any>,
      ) as unknown as RedisExpectation<R>;
    case "redis:get":
    case "redis:set":
    case "redis:hash":
    case "redis:common":
      return new RedisResultExpectationImpl(
        result,
      ) as unknown as RedisExpectation<R>;
    default:
      throw new Error(
        `Unknown Redis result type: ${(result as { type: string }).type}`,
      );
  }
}
