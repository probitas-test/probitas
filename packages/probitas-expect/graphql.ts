import type { GraphqlResponse } from "@probitas/client-graphql";
import { ensureNonNullish } from "./utils.ts";
import * as mixin from "./mixin.ts";

type GraphqlHeaders = GraphqlResponse["headers"];

/**
 * Fluent API for GraphQL response validation.
 */
export interface GraphqlResponseExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { GraphqlResponse } from "@probitas/client-graphql";
   * import { expectGraphqlResponse } from "./graphql.ts";
   * const mockHeaders = new Map<string, string>();
   * const response = {
   *   kind: "graphql",
   *   ok: false,
   *   status: 200,
   *   headers: mockHeaders,
   *   data: null,
   *   error: { message: "Not found" },
   *   extensions: undefined,
   *   duration: 0,
   * } as unknown as GraphqlResponse;
   *
   * expectGraphqlResponse(response).not.toBeOk();
   * expectGraphqlResponse(response).toHaveErrorPresent();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the response is successful (no errors).
   *
   * @example
   * ```ts
   * import type { GraphqlResponse } from "@probitas/client-graphql";
   * import { expectGraphqlResponse } from "./graphql.ts";
   * const mockHeaders = new Map<string, string>();
   * const response = {
   *   kind: "graphql",
   *   ok: true,
   *   status: 200,
   *   headers: mockHeaders,
   *   data: { user: { name: "Alice" } },
   *   error: null,
   *   extensions: undefined,
   *   duration: 0,
   * } as unknown as GraphqlResponse;
   *
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
    matcher: (value: GraphqlHeaders) => void,
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
  toHaveHeadersPropertySatisfying(
    keyPath: string | string[],
    // deno-lint-ignore no-explicit-any
    matcher: (value: any) => void,
  ): this;

  /**
   * Asserts that the error equals the expected value.
   * @param expected - The expected error value
   */
  toHaveError(expected: unknown): this;

  /**
   * Asserts that the error equals the expected value using deep equality.
   * @param expected - The expected error value
   */
  toHaveErrorEqual(expected: unknown): this;

  /**
   * Asserts that the error strictly equals the expected value.
   * @param expected - The expected error value
   */
  toHaveErrorStrictEqual(expected: unknown): this;

  /**
   * Asserts that the error satisfies the provided matcher function.
   * @param matcher - A function that receives the error and performs assertions
   */
  // deno-lint-ignore no-explicit-any
  toHaveErrorSatisfying(matcher: (value: any) => void): this;

  /**
   * Asserts that the error is present (not null or undefined).
   */
  toHaveErrorPresent(): this;

  /**
   * Asserts that the error is null.
   */
  toHaveErrorNull(): this;

  /**
   * Asserts that the error is undefined.
   */
  toHaveErrorUndefined(): this;

  /**
   * Asserts that the error is nullish (null or undefined).
   */
  toHaveErrorNullish(): this;

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
    // deno-lint-ignore no-explicit-any
    matcher: (value: Record<string, any>) => void,
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
  toHaveExtensionsPropertySatisfying(
    keyPath: string | string[],
    // deno-lint-ignore no-explicit-any
    matcher: (value: any) => void,
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
  // deno-lint-ignore no-explicit-any
  toHaveDataSatisfying(matcher: (value: any) => void): this;

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
  toHaveDataPropertySatisfying(
    keyPath: string | string[],
    // deno-lint-ignore no-explicit-any
    matcher: (value: any) => void,
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
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: response }) as const;
    return [
      mixin.createOkMixin(() => response.ok, negate, cfg("response")),
      // Status
      mixin.createValueMixin(() => response.status, negate, cfg("status")),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(response.status, "status"),
        negate,
        cfg("status"),
      ),
      mixin.createOneOfValueMixin(() => response.status, negate, cfg("status")),
      // Headers
      mixin.createValueMixin(() => response.headers, negate, cfg("headers")),
      mixin.createObjectValueMixin(
        () =>
          Object.fromEntries(
            ensureNonNullish(response.headers, "headers").entries(),
          ),
        negate,
        cfg("headers"),
      ),
      // Error
      mixin.createValueMixin(() => response.error, negate, cfg("error")),
      mixin.createNullishValueMixin(
        () => response.error,
        negate,
        cfg("error"),
      ),
      // Extensions
      mixin.createValueMixin(
        () => response.extensions,
        negate,
        cfg("extensions"),
      ),
      mixin.createNullishValueMixin(
        () => response.extensions,
        negate,
        cfg("extensions"),
      ),
      mixin.createObjectValueMixin(
        () => ensureNonNullish(response.extensions, "extensions"),
        negate,
        cfg("extensions"),
      ),
      // Data
      mixin.createValueMixin(() => response.data, negate, cfg("data")),
      mixin.createNullishValueMixin(() => response.data, negate, cfg("data")),
      mixin.createObjectValueMixin(
        () => ensureNonNullish(response.data, "data"),
        negate,
        cfg("data"),
      ),
      // Duration
      mixin.createValueMixin(() => response.duration, negate, cfg("duration")),
      mixin.createNumberValueMixin(
        () => response.duration,
        negate,
        cfg("duration"),
      ),
    ] as const;
  });
}
