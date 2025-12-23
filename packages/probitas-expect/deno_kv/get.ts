import type { DenoKvGetResult } from "@probitas/client-deno-kv";
import { ensureNonNullish } from "../utils.ts";
import * as mixin from "../mixin.ts";

type DenoKvKey<T> = DenoKvGetResult<T>["key"];

/**
 * Fluent API for validating DenoKvGetResult.
 *
 * Provides chainable assertions specifically designed for Deno KV get operation results.
 * All assertion methods return `this` to enable method chaining.
 */
export interface DenoKvGetResultExpectation<_T = unknown> {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { DenoKvGetResult } from "@probitas/client-deno-kv";
   * import { expectDenoKvGetResult } from "./get.ts";
   * const result = {
   *   kind: "deno-kv:get",
   *   ok: false,
   *   key: ["users", "1"],
   *   value: null,
   *   versionstamp: null,
   *   duration: 0,
   * } as unknown as DenoKvGetResult<unknown>;
   *
   * expectDenoKvGetResult(result).not.toBeOk();
   * expectDenoKvGetResult(result).not.toHaveValuePresent();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result is successful.
   */
  toBeOk(): this;

  /**
   * Asserts that the key equals the expected value.
   * @param expected - The expected key value
   */
  toHaveKey(expected: unknown): this;

  /**
   * Asserts that the key equals the expected value using deep equality.
   * @param expected - The expected key value
   */
  toHaveKeyEqual(expected: unknown): this;

  /**
   * Asserts that the key strictly equals the expected value.
   * @param expected - The expected key value
   */
  toHaveKeyStrictEqual(expected: unknown): this;

  /**
   * Asserts that the key satisfies the provided matcher function.
   * @param matcher - A function that receives the key and performs assertions
   */
  toHaveKeySatisfying(matcher: (value: DenoKvKey<_T>) => void): this;

  /**
   * Asserts that the key array contains the specified item.
   * @param item - The item to search for
   */
  toHaveKeyContaining(item: unknown): this;

  /**
   * Asserts that the key array contains an item equal to the specified value.
   * @param item - The item to search for using deep equality
   */
  toHaveKeyContainingEqual(item: unknown): this;

  /**
   * Asserts that the key array matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveKeyMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the key array is empty.
   */
  toHaveKeyEmpty(): this;

  /**
   * Asserts that the value equals the expected value.
   * @param expected - The expected value
   */
  toHaveValue(expected: unknown): this;

  /**
   * Asserts that the value equals the expected value using deep equality.
   * @param expected - The expected value
   */
  toHaveValueEqual(expected: unknown): this;

  /**
   * Asserts that the value strictly equals the expected value.
   * @param expected - The expected value
   */
  toHaveValueStrictEqual(expected: unknown): this;

  /**
   * Asserts that the value satisfies the provided matcher function.
   * @param matcher - A function that receives the value and performs assertions
   */
  // deno-lint-ignore no-explicit-any
  toHaveValueSatisfying(matcher: (value: any) => void): this;

  /**
   * Asserts that the value is present (not null or undefined).
   */
  toHaveValuePresent(): this;

  /**
   * Asserts that the value is null.
   */
  toHaveValueNull(): this;

  /**
   * Asserts that the value is undefined.
   */
  toHaveValueUndefined(): this;

  /**
   * Asserts that the value is nullish (null or undefined).
   */
  toHaveValueNullish(): this;

  /**
   * Asserts that the value matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveValueMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the value has the specified property.
   * @param keyPath - The key path to check
   * @param value - Optional expected value at the key path
   */
  toHaveValueProperty(keyPath: string | string[], value?: unknown): this;

  /**
   * Asserts that the value property contains the expected value.
   * @param keyPath - The key path to check
   * @param expected - The expected contained value
   */
  toHaveValuePropertyContaining(
    keyPath: string | string[],
    expected: unknown,
  ): this;

  /**
   * Asserts that the value property matches the specified subset.
   * @param keyPath - The key path to check
   * @param subset - The subset to match against
   */
  toHaveValuePropertyMatching(
    keyPath: string | string[],
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the value property satisfies the provided matcher function.
   * @param keyPath - The key path to check
   * @param matcher - A function that receives the property value and performs assertions
   */
  toHaveValuePropertySatisfying(
    keyPath: string | string[],
    // deno-lint-ignore no-explicit-any
    matcher: (value: any) => void,
  ): this;

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
   * Asserts that the versionstamp is present (not null or undefined).
   */
  toHaveVersionstampPresent(): this;

  /**
   * Asserts that the versionstamp is null.
   */
  toHaveVersionstampNull(): this;

  /**
   * Asserts that the versionstamp is undefined.
   */
  toHaveVersionstampUndefined(): this;

  /**
   * Asserts that the versionstamp is nullish (null or undefined).
   */
  toHaveVersionstampNullish(): this;

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
 * Create expectation for Deno KV get result.
 */
export function expectDenoKvGetResult<T>(
  result: DenoKvGetResult<T>,
): DenoKvGetResultExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: result }) as const;
    return [
      mixin.createOkMixin(() => result.ok, negate, cfg("result")),
      // Key
      mixin.createValueMixin(() => result.key, negate, cfg("key")),
      mixin.createArrayValueMixin(
        () => ensureNonNullish(result.key, "key"),
        negate,
        cfg("key"),
      ),
      // Value
      mixin.createValueMixin(() => result.value, negate, cfg("value")),
      mixin.createNullishValueMixin(() => result.value, negate, cfg("value")),
      mixin.createObjectValueMixin(
        () => ensureNonNullish(result.value, "value"),
        negate,
        cfg("value"),
      ),
      // Versionstamp
      mixin.createValueMixin(
        () => result.versionstamp,
        negate,
        cfg("versionstamp"),
      ),
      mixin.createNullishValueMixin(
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
