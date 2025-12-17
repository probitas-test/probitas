import type { DenoKvSetResult } from "@probitas/client-deno-kv";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

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
   * import type { DenoKvSetResult } from "@probitas/client-deno-kv";
   * import { expectDenoKvSetResult } from "./set.ts";
   * const result = {
   *   kind: "deno-kv:set",
   *   ok: false,
   *   versionstamp: "00000000000000010000",
   *   duration: 0,
   * } as unknown as DenoKvSetResult;
   *
   * expectDenoKvSetResult(result).not.toBeOk();
   * expectDenoKvSetResult(result).not.toHaveVersionstamp("other");
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the versionstamp equals the expected value.
   * @param expected - The expected versionstamp value
   */
  toHaveVersionstamp(expected: unknown): this;

  /**
   * Asserts that the versionstamp equals the expected value using deep equality.
   * @param expected - The expected versionstamp value
   */
  toHaveVersionstampEqual(expected: unknown): this;

  /**
   * Asserts that the versionstamp strictly equals the expected value.
   * @param expected - The expected versionstamp value
   */
  toHaveVersionstampStrictEqual(expected: unknown): this;

  /**
   * Asserts that the versionstamp satisfies the provided matcher function.
   * @param matcher - A function that receives the versionstamp and performs assertions
   */
  toHaveVersionstampSatisfying(matcher: (value: string) => void): this;

  /**
   * Asserts that the versionstamp contains the specified substring.
   * @param substr - The substring to search for
   */
  toHaveVersionstampContaining(substr: string): this;

  /**
   * Asserts that the versionstamp matches the specified regular expression.
   * @param expected - The regular expression to match against
   */
  toHaveVersionstampMatching(expected: RegExp): this;

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
 * Create expectation for Deno KV set result.
 */
export function expectDenoKvSetResult(
  result: DenoKvSetResult,
): DenoKvSetResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("result")),
      // Versionstamp
      mixin.createValueMixin(
        () => result.versionstamp,
        negate,
        cfg("versionstamp"),
      ),
      mixin.createStringValueMixin(
        () => ensureNonNullish(result.versionstamp, "versionstamp"),
        negate,
        cfg("versionstamp"),
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
