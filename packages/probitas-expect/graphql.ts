import type { GraphqlResponse } from "@probitas/client-graphql";
import { ensureNonNullish } from "./utils.ts";
import * as mixin from "./mixin.ts";

/**
 * Fluent API for GraphQL response validation.
 */
export interface GraphqlResponseExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectGraphqlResponse(response).not.toBeOk();
   * expectGraphqlResponse(response).not.toHaveErrorCount(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the response is successful (no errors).
   *
   * @example
   * ```ts
   * expectGraphqlResponse(response).toBeOk();
   * ```
   */
  toBeOk(): this;

  /**
   * Asserts that the status equals the expected value.
   * @param expected - The expected status value
   */
  toHaveStatus(expected: unknown): this;

  /**
   * Asserts that the status equals the expected value using deep equality.
   * @param expected - The expected status value
   */
  toHaveStatusEqual(expected: unknown): this;

  /**
   * Asserts that the status strictly equals the expected value.
   * @param expected - The expected status value
   */
  toHaveStatusStrictEqual(expected: unknown): this;

  /**
   * Asserts that the status satisfies the provided matcher function.
   * @param matcher - A function that receives the status and performs assertions
   */
  toHaveStatusSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the status is NaN.
   */
  toHaveStatusNaN(): this;

  /**
   * Asserts that the status is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveStatusGreaterThan(expected: number): this;

  /**
   * Asserts that the status is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveStatusGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the status is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveStatusLessThan(expected: number): this;

  /**
   * Asserts that the status is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveStatusLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the status is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveStatusCloseTo(expected: number, numDigits?: number): this;

  /**
   * Asserts that the status is one of the specified values.
   * @param values - Array of acceptable values
   */
  toHaveStatusOneOf(values: unknown[]): this;

  /**
   * Asserts that the headers equal the expected value.
   * @param expected - The expected headers value
   */
  toHaveHeaders(expected: unknown): this;

  /**
   * Asserts that the headers equal the expected value using deep equality.
   * @param expected - The expected headers value
   */
  toHaveHeadersEqual(expected: unknown): this;

  /**
   * Asserts that the headers strictly equal the expected value.
   * @param expected - The expected headers value
   */
  toHaveHeadersStrictEqual(expected: unknown): this;

  /**
   * Asserts that the headers satisfy the provided matcher function.
   * @param matcher - A function that receives the headers and performs assertions
   */
  toHaveHeadersSatisfying(
    matcher: (value: Record<string, string>) => void,
  ): this;

  /**
   * Asserts that the headers match the specified subset.
   * @param subset - The subset to match against
   */
  toHaveHeadersMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the headers have the specified property.
   * @param keyPath - The key path to check
   * @param value - Optional expected value at the key path
   */
  toHaveHeadersProperty(keyPath: string | string[], value?: unknown): this;

  /**
   * Asserts that the headers property contains the expected value.
   * @param keyPath - The key path to check
   * @param expected - The expected contained value
   */
  toHaveHeadersPropertyContaining(
    keyPath: string | string[],
    expected: unknown,
  ): this;

  /**
   * Asserts that the headers property matches the specified subset.
   * @param keyPath - The key path to check
   * @param subset - The subset to match against
   */
  toHaveHeadersPropertyMatching(
    keyPath: string | string[],
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the headers property satisfies the provided matcher function.
   * @param keyPath - The key path to check
   * @param matcher - A function that receives the property value and performs assertions
   */
  toHaveHeadersPropertySatisfying<I>(
    keyPath: string | string[],
    matcher: (value: I) => void,
  ): this;

  /**
   * Asserts that the errors equal the expected value.
   * @param expected - The expected errors value
   */
  toHaveErrors(expected: unknown): this;

  /**
   * Asserts that the errors equal the expected value using deep equality.
   * @param expected - The expected errors value
   */
  toHaveErrorsEqual(expected: unknown): this;

  /**
   * Asserts that the errors strictly equal the expected value.
   * @param expected - The expected errors value
   */
  toHaveErrorsStrictEqual(expected: unknown): this;

  /**
   * Asserts that the errors satisfy the provided matcher function.
   * @param matcher - A function that receives the errors and performs assertions
   */
  toHaveErrorsSatisfying(matcher: (value: unknown[]) => void): this;

  /**
   * Asserts that the errors array contains the specified item.
   * @param item - The item to search for
   */
  toHaveErrorsContaining(item: unknown): this;

  /**
   * Asserts that the errors array contains an item equal to the specified value.
   * @param item - The item to search for using deep equality
   */
  toHaveErrorsContainingEqual(item: unknown): this;

  /**
   * Asserts that the errors array matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveErrorsMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the errors array is empty.
   */
  toHaveErrorsEmpty(): this;

  /**
   * Asserts that the errors are present (not null or undefined).
   */
  toHaveErrorsPresent(): this;

  /**
   * Asserts that the errors are null.
   */
  toHaveErrorsNull(): this;

  /**
   * Asserts that the errors are undefined.
   */
  toHaveErrorsUndefined(): this;

  /**
   * Asserts that the errors are nullish (null or undefined).
   */
  toHaveErrorsNullish(): this;

  /**
   * Asserts that the error count equals the expected value.
   * @param expected - The expected error count
   */
  toHaveErrorCount(expected: unknown): this;

  /**
   * Asserts that the error count equals the expected value using deep equality.
   * @param expected - The expected error count
   */
  toHaveErrorCountEqual(expected: unknown): this;

  /**
   * Asserts that the error count strictly equals the expected value.
   * @param expected - The expected error count
   */
  toHaveErrorCountStrictEqual(expected: unknown): this;

  /**
   * Asserts that the error count satisfies the provided matcher function.
   * @param matcher - A function that receives the error count and performs assertions
   */
  toHaveErrorCountSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the error count is NaN.
   */
  toHaveErrorCountNaN(): this;

  /**
   * Asserts that the error count is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveErrorCountGreaterThan(expected: number): this;

  /**
   * Asserts that the error count is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveErrorCountGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the error count is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveErrorCountLessThan(expected: number): this;

  /**
   * Asserts that the error count is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveErrorCountLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the error count is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveErrorCountCloseTo(expected: number, numDigits?: number): this;

  /**
   * Asserts that the extensions equal the expected value.
   * @param expected - The expected extensions value
   */
  toHaveExtensions(expected: unknown): this;

  /**
   * Asserts that the extensions equal the expected value using deep equality.
   * @param expected - The expected extensions value
   */
  toHaveExtensionsEqual(expected: unknown): this;

  /**
   * Asserts that the extensions strictly equal the expected value.
   * @param expected - The expected extensions value
   */
  toHaveExtensionsStrictEqual(expected: unknown): this;

  /**
   * Asserts that the extensions satisfy the provided matcher function.
   * @param matcher - A function that receives the extensions and performs assertions
   */
  toHaveExtensionsSatisfying(
    matcher: (value: Record<string, unknown>) => void,
  ): this;

  /**
   * Asserts that the extensions match the specified subset.
   * @param subset - The subset to match against
   */
  toHaveExtensionsMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the extensions have the specified property.
   * @param keyPath - The key path to check
   * @param value - Optional expected value at the key path
   */
  toHaveExtensionsProperty(keyPath: string | string[], value?: unknown): this;

  /**
   * Asserts that the extensions property contains the expected value.
   * @param keyPath - The key path to check
   * @param expected - The expected contained value
   */
  toHaveExtensionsPropertyContaining(
    keyPath: string | string[],
    expected: unknown,
  ): this;

  /**
   * Asserts that the extensions property matches the specified subset.
   * @param keyPath - The key path to check
   * @param subset - The subset to match against
   */
  toHaveExtensionsPropertyMatching(
    keyPath: string | string[],
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the extensions property satisfies the provided matcher function.
   * @param keyPath - The key path to check
   * @param matcher - A function that receives the property value and performs assertions
   */
  toHaveExtensionsPropertySatisfying<I>(
    keyPath: string | string[],
    matcher: (value: I) => void,
  ): this;

  /**
   * Asserts that the extensions are present (not null or undefined).
   */
  toHaveExtensionsPresent(): this;

  /**
   * Asserts that the extensions are null.
   */
  toHaveExtensionsNull(): this;

  /**
   * Asserts that the extensions are undefined.
   */
  toHaveExtensionsUndefined(): this;

  /**
   * Asserts that the extensions are nullish (null or undefined).
   */
  toHaveExtensionsNullish(): this;

  /**
   * Asserts that the data equals the expected value.
   * @param expected - The expected data value
   */
  toHaveData(expected: unknown): this;

  /**
   * Asserts that the data equals the expected value using deep equality.
   * @param expected - The expected data value
   */
  toHaveDataEqual(expected: unknown): this;

  /**
   * Asserts that the data strictly equals the expected value.
   * @param expected - The expected data value
   */
  toHaveDataStrictEqual(expected: unknown): this;

  /**
   * Asserts that the data satisfies the provided matcher function.
   * @param matcher - A function that receives the data and performs assertions
   */
  toHaveDataSatisfying(matcher: (value: unknown) => void): this;

  /**
   * Asserts that the data matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveDataMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the data has the specified property.
   * @param keyPath - The key path to check
   * @param value - Optional expected value
   */
  toHaveDataProperty(keyPath: string | string[], value?: unknown): this;

  /**
   * Asserts that the data property contains the specified value.
   * @param keyPath - The key path to check
   * @param expected - The value to search for
   */
  toHaveDataPropertyContaining(
    keyPath: string | string[],
    expected: unknown,
  ): this;

  /**
   * Asserts that the data property matches the specified subset.
   * @param keyPath - The key path to check
   * @param subset - The subset to match against
   */
  toHaveDataPropertyMatching(
    keyPath: string | string[],
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the data property satisfies the provided matcher function.
   * @param keyPath - The key path to check
   * @param matcher - A function that receives the property value and performs assertions
   */
  toHaveDataPropertySatisfying<I>(
    keyPath: string | string[],
    matcher: (value: I) => void,
  ): this;

  /**
   * Asserts that the data is present (not null or undefined).
   */
  toHaveDataPresent(): this;

  /**
   * Asserts that the data is null.
   */
  toHaveDataNull(): this;

  /**
   * Asserts that the data is undefined.
   */
  toHaveDataUndefined(): this;

  /**
   * Asserts that the data is nullish (null or undefined).
   */
  toHaveDataNullish(): this;

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

export function expectGraphqlResponse(
  response: GraphqlResponse,
): GraphqlResponseExpectation {
  return mixin.defineExpectation((negate) => [
    mixin.createOkMixin(
      () => response.ok,
      negate,
      { valueName: "response" },
    ),
    // Status
    mixin.createValueMixin(
      () => response.status,
      negate,
      { valueName: "status" },
    ),
    mixin.createNumberValueMixin(
      () => response.status,
      negate,
      { valueName: "status" },
    ),
    mixin.createOneOfValueMixin(
      () => response.status,
      negate,
      { valueName: "status" },
    ),
    // Headers
    mixin.createValueMixin(
      () => response.headers,
      negate,
      { valueName: "headers" },
    ),
    mixin.createObjectValueMixin(
      () => Object.fromEntries(response.headers.entries()),
      negate,
      { valueName: "headers" },
    ),
    // Errors
    mixin.createValueMixin(
      () => response.errors,
      negate,
      { valueName: "errors" },
    ),
    mixin.createNullishValueMixin(
      () => response.errors,
      negate,
      { valueName: "errors" },
    ),
    mixin.createArrayValueMixin(
      () => ensureNonNullish(response.errors, "errors"),
      negate,
      { valueName: "errors" },
    ),
    // Error count
    mixin.createValueMixin(
      () => response.errors?.length ?? 0,
      negate,
      { valueName: "error count" },
    ),
    mixin.createNumberValueMixin(
      () => response.errors?.length ?? 0,
      negate,
      { valueName: "error count" },
    ),
    // Extensions
    mixin.createValueMixin(
      () => response.extensions,
      negate,
      { valueName: "extensions" },
    ),
    mixin.createNullishValueMixin(
      () => response.extensions,
      negate,
      { valueName: "extensions" },
    ),
    mixin.createObjectValueMixin(
      () => ensureNonNullish(response.extensions, "extensions"),
      negate,
      { valueName: "extensions" },
    ),
    // Data
    mixin.createValueMixin(
      () => response.data,
      negate,
      { valueName: "data" },
    ),
    mixin.createNullishValueMixin(
      () => response.data,
      negate,
      { valueName: "data" },
    ),
    mixin.createObjectValueMixin(
      () => ensureNonNullish(response.data, "data"),
      negate,
      { valueName: "data" },
    ),
    // Duration
    mixin.createValueMixin(
      () => response.duration,
      negate,
      { valueName: "duration" },
    ),
    mixin.createNumberValueMixin(
      () => response.duration,
      negate,
      { valueName: "duration" },
    ),
  ]);
}
