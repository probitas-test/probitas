import type { HttpResponse } from "@probitas/client-http";
import { ensureNonNullish } from "./utils.ts";
import * as mixin from "./mixin.ts";

/**
 * Fluent API for HTTP response validation.
 */
export interface HttpResponseExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectHttpResponse(response).not.toBeOk();
   * expectHttpResponse(response).not.toHaveStatus(404);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the response is successful (status 2xx).
   *
   * @example
   * ```ts
   * expectHttpResponse(response).toBeOk();
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
   * Asserts that the status text equals the expected value.
   * @param expected - The expected status text
   */
  toHaveStatusText(expected: unknown): this;

  /**
   * Asserts that the status text equals the expected value using deep equality.
   * @param expected - The expected status text
   */
  toHaveStatusTextEqual(expected: unknown): this;

  /**
   * Asserts that the status text strictly equals the expected value.
   * @param expected - The expected status text
   */
  toHaveStatusTextStrictEqual(expected: unknown): this;

  /**
   * Asserts that the status text satisfies the provided matcher function.
   * @param matcher - A function that receives the status text and performs assertions
   */
  toHaveStatusTextSatisfying(matcher: (value: string) => void): this;

  /**
   * Asserts that the status text contains the specified substring.
   * @param substr - The substring to search for
   */
  toHaveStatusTextContaining(substr: string): this;

  /**
   * Asserts that the status text matches the specified regular expression.
   * @param expected - The regular expression to match against
   */
  toHaveStatusTextMatching(expected: RegExp): this;

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
   * Asserts that the URL equals the expected value.
   * @param expected - The expected URL value
   */
  toHaveUrl(expected: unknown): this;

  /**
   * Asserts that the URL equals the expected value using deep equality.
   * @param expected - The expected URL value
   */
  toHaveUrlEqual(expected: unknown): this;

  /**
   * Asserts that the URL strictly equals the expected value.
   * @param expected - The expected URL value
   */
  toHaveUrlStrictEqual(expected: unknown): this;

  /**
   * Asserts that the URL satisfies the provided matcher function.
   * @param matcher - A function that receives the URL and performs assertions
   */
  toHaveUrlSatisfying(matcher: (value: string) => void): this;

  /**
   * Asserts that the URL contains the specified substring.
   * @param substr - The substring to search for
   */
  toHaveUrlContaining(substr: string): this;

  /**
   * Asserts that the URL matches the specified regular expression.
   * @param expected - The regular expression to match against
   */
  toHaveUrlMatching(expected: RegExp): this;

  /**
   * Asserts that the body equals the expected value.
   * @param expected - The expected body value
   */
  toHaveBody(expected: unknown): this;

  /**
   * Asserts that the body equals the expected value using deep equality.
   * @param expected - The expected body value
   */
  toHaveBodyEqual(expected: unknown): this;

  /**
   * Asserts that the body strictly equals the expected value.
   * @param expected - The expected body value
   */
  toHaveBodyStrictEqual(expected: unknown): this;

  /**
   * Asserts that the body satisfies the provided matcher function.
   * @param matcher - A function that receives the body and performs assertions
   */
  toHaveBodySatisfying(matcher: (value: Uint8Array | null) => void): this;

  /**
   * Asserts that the body is present (not null or undefined).
   */
  toHaveBodyPresent(): this;

  /**
   * Asserts that the body is null.
   */
  toHaveBodyNull(): this;

  /**
   * Asserts that the body is undefined.
   */
  toHaveBodyUndefined(): this;

  /**
   * Asserts that the body is nullish (null or undefined).
   */
  toHaveBodyNullish(): this;

  /**
   * Asserts that the body length equals the expected value.
   * @param expected - The expected body length
   */
  toHaveBodyLength(expected: unknown): this;

  /**
   * Asserts that the body length equals the expected value using deep equality.
   * @param expected - The expected body length
   */
  toHaveBodyLengthEqual(expected: unknown): this;

  /**
   * Asserts that the body length strictly equals the expected value.
   * @param expected - The expected body length
   */
  toHaveBodyLengthStrictEqual(expected: unknown): this;

  /**
   * Asserts that the body length satisfies the provided matcher function.
   * @param matcher - A function that receives the body length and performs assertions
   */
  toHaveBodyLengthSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the body length is NaN.
   */
  toHaveBodyLengthNaN(): this;

  /**
   * Asserts that the body length is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveBodyLengthGreaterThan(expected: number): this;

  /**
   * Asserts that the body length is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveBodyLengthGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the body length is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveBodyLengthLessThan(expected: number): this;

  /**
   * Asserts that the body length is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveBodyLengthLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the body length is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveBodyLengthCloseTo(expected: number, numDigits?: number): this;

  /**
   * Asserts that the text equals the expected value.
   * @param expected - The expected text value
   */
  toHaveText(expected: unknown): this;

  /**
   * Asserts that the text equals the expected value using deep equality.
   * @param expected - The expected text value
   */
  toHaveTextEqual(expected: unknown): this;

  /**
   * Asserts that the text strictly equals the expected value.
   * @param expected - The expected text value
   */
  toHaveTextStrictEqual(expected: unknown): this;

  /**
   * Asserts that the text satisfies the provided matcher function.
   * @param matcher - A function that receives the text and performs assertions
   */
  toHaveTextSatisfying(matcher: (value: string) => void): this;

  /**
   * Asserts that the text contains the specified substring.
   * @param substr - The substring to search for
   */
  toHaveTextContaining(substr: string): this;

  /**
   * Asserts that the text matches the specified regular expression.
   * @param expected - The regular expression to match against
   */
  toHaveTextMatching(expected: RegExp): this;

  /**
   * Asserts that the text is present (not null or undefined).
   */
  toHaveTextPresent(): this;

  /**
   * Asserts that the text is null.
   */
  toHaveTextNull(): this;

  /**
   * Asserts that the text is undefined.
   */
  toHaveTextUndefined(): this;

  /**
   * Asserts that the text is nullish (null or undefined).
   */
  toHaveTextNullish(): this;

  /**
   * Asserts that the text length equals the expected value.
   * @param expected - The expected text length
   */
  toHaveTextLength(expected: unknown): this;

  /**
   * Asserts that the text length equals the expected value using deep equality.
   * @param expected - The expected text length
   */
  toHaveTextLengthEqual(expected: unknown): this;

  /**
   * Asserts that the text length strictly equals the expected value.
   * @param expected - The expected text length
   */
  toHaveTextLengthStrictEqual(expected: unknown): this;

  /**
   * Asserts that the text length satisfies the provided matcher function.
   * @param matcher - A function that receives the text length and performs assertions
   */
  toHaveTextLengthSatisfying(matcher: (value: number) => void): this;

  /**
   * Asserts that the text length is NaN.
   */
  toHaveTextLengthNaN(): this;

  /**
   * Asserts that the text length is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveTextLengthGreaterThan(expected: number): this;

  /**
   * Asserts that the text length is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveTextLengthGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the text length is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveTextLengthLessThan(expected: number): this;

  /**
   * Asserts that the text length is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveTextLengthLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the text length is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveTextLengthCloseTo(expected: number, numDigits?: number): this;

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
  toHaveDataSatisfying(
    matcher: (value: Record<string, unknown> | null) => void,
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
   * Asserts that the data matches the specified subset.
   * @param subset - The subset to match against
   */
  toHaveDataMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the data has the specified property.
   * @param keyPath - The key path to check
   * @param value - Optional expected value at the key path
   */
  toHaveDataProperty(keyPath: string | string[], value?: unknown): this;

  /**
   * Asserts that the data property contains the expected value.
   * @param keyPath - The key path to check
   * @param expected - The expected contained value
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

export function expectHttpResponse(
  response: HttpResponse,
): HttpResponseExpectation {
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
    // Status text
    mixin.createValueMixin(
      () => response.statusText,
      negate,
      { valueName: "status text" },
    ),
    mixin.createStringValueMixin(
      () => response.statusText,
      negate,
      { valueName: "status text" },
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
    // URL
    mixin.createValueMixin(
      () => response.url,
      negate,
      { valueName: "url" },
    ),
    mixin.createStringValueMixin(
      () => response.url,
      negate,
      { valueName: "url" },
    ),
    // Body
    mixin.createValueMixin(
      () => response.body,
      negate,
      { valueName: "body" },
    ),
    mixin.createNullishValueMixin(
      () => response.body,
      negate,
      { valueName: "body" },
    ),
    // Body length
    mixin.createValueMixin(
      () => ensureNonNullish(response.body?.length, "body length"),
      negate,
      { valueName: "body length" },
    ),
    mixin.createNumberValueMixin(
      () => ensureNonNullish(response.body?.length, "body length"),
      negate,
      { valueName: "body length" },
    ),
    // Text
    mixin.createValueMixin(
      () => response.text(),
      negate,
      { valueName: "text" },
    ),
    mixin.createNullishValueMixin(
      () => response.text(),
      negate,
      { valueName: "text" },
    ),
    mixin.createStringValueMixin(
      () => ensureNonNullish(response.text(), "text"),
      negate,
      { valueName: "text" },
    ),
    // Text length
    mixin.createValueMixin(
      () => ensureNonNullish(response.text(), "text length").length,
      negate,
      { valueName: "text length" },
    ),
    mixin.createNumberValueMixin(
      () => ensureNonNullish(response.text(), "text length").length,
      negate,
      { valueName: "text length" },
    ),
    // Data
    mixin.createValueMixin(
      () => response.data(),
      negate,
      { valueName: "data" },
    ),
    mixin.createNullishValueMixin(
      () => response.data(),
      negate,
      { valueName: "data" },
    ),
    mixin.createObjectValueMixin(
      () => ensureNonNullish(response.data(), "response data"),
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
