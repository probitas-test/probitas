import { createDurationMethods } from "../common.ts";

/**
 * Fluent API for RabbitMQ publish/exchange/ack result validation.
 * Simple results only have ok and duration properties.
 */
export interface RabbitMqSimpleResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectRabbitMqResult(result).not.toBeSuccessful();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result ok is true.
   *
   * @example
   * ```ts
   * expectRabbitMqResult(result).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Base result type for simple ok/duration results.
 */
export interface SimpleResult {
  readonly ok: boolean;
  readonly duration: number;
}

/**
 * Create expectation for RabbitMQ publish/exchange/ack result.
 */
export function expectSimpleResult<T extends SimpleResult>(
  result: T,
  negate = false,
): RabbitMqSimpleResultExpectation {
  const self: RabbitMqSimpleResultExpectation = {
    get not(): RabbitMqSimpleResultExpectation {
      return expectSimpleResult(result, !negate);
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

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}
