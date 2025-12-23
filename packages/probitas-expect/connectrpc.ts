import type { ConnectRpcResponse } from "@probitas/client-connectrpc";
import { ensureNonNullish } from "./utils.ts";
import * as mixin from "./mixin.ts";

type ConnectRpcStatusCode = ConnectRpcResponse["statusCode"];
type ConnectRpcHeaders = ConnectRpcResponse["headers"];
type ConnectRpcTrailers = ConnectRpcResponse["trailers"];

/**
 * Fluent assertion interface for ConnectRpcResponse.
 */
export interface ConnectRpcResponseExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import type { ConnectRpcResponse } from "@probitas/client-connectrpc";
   * import { expectConnectRpcResponse } from "./connectrpc.ts";
   * const mockHeaders = new Map<string, string>();
   * const response = {
   *   kind: "connectrpc",
   *   ok: false,
   *   statusCode: 2,
   *   statusMessage: "Not Found",
   *   headers: mockHeaders,
   *   trailers: mockHeaders,
   *   data: null,
   *   duration: 0,
   * } as unknown as ConnectRpcResponse;
   *
   * expectConnectRpcResponse(response).not.toBeOk();
   * expectConnectRpcResponse(response).not.toHaveStatusCode(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the response is successful (code 0).
   *
   * @example
   * ```ts
   * import type { ConnectRpcResponse } from "@probitas/client-connectrpc";
   * import { expectConnectRpcResponse } from "./connectrpc.ts";
   * const mockHeaders = new Map<string, string>();
   * const response = {
   *   kind: "connectrpc",
   *   ok: true,
   *   statusCode: 0,
   *   statusMessage: undefined,
   *   headers: mockHeaders,
   *   trailers: mockHeaders,
   *   data: { result: "success" },
   *   duration: 0,
   * } as unknown as ConnectRpcResponse;
   *
   * expectConnectRpcResponse(response).toBeOk();
   * ```
   */
  toBeOk(): this;

  /**
   * Asserts that the code equals the expected value.
   * @param expected - The expected code value
   */
  toHaveStatusCode(expected: unknown): this;

  /**
   * Asserts that the code equals the expected value using deep equality.
   * @param expected - The expected code value
   */
  toHaveStatusCodeEqual(expected: unknown): this;

  /**
   * Asserts that the code strictly equals the expected value.
   * @param expected - The expected code value
   */
  toHaveStatusCodeStrictEqual(expected: unknown): this;

  /**
   * Asserts that the code satisfies the provided matcher function.
   * @param matcher - A function that receives the code and performs assertions
   */
  toHaveStatusCodeSatisfying(
    matcher: (value: ConnectRpcStatusCode) => void,
  ): this;

  /**
   * Asserts that the code is NaN.
   */
  toHaveStatusCodeNaN(): this;

  /**
   * Asserts that the code is greater than the expected value.
   * @param expected - The value to compare against
   */
  toHaveStatusCodeGreaterThan(expected: number): this;

  /**
   * Asserts that the code is greater than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveStatusCodeGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the code is less than the expected value.
   * @param expected - The value to compare against
   */
  toHaveStatusCodeLessThan(expected: number): this;

  /**
   * Asserts that the code is less than or equal to the expected value.
   * @param expected - The value to compare against
   */
  toHaveStatusCodeLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the code is close to the expected value.
   * @param expected - The expected value
   * @param numDigits - The number of decimal digits to check (default: 2)
   */
  toHaveStatusCodeCloseTo(expected: number, numDigits?: number): this;

  /**
   * Asserts that the code is one of the specified values.
   * @param values - Array of acceptable values
   */
  toHaveStatusCodeOneOf(values: unknown[]): this;

  /**
   * Asserts that the message equals the expected value.
   * @param expected - The expected message value
   */
  toHaveStatusMessage(expected: unknown): this;

  /**
   * Asserts that the message equals the expected value using deep equality.
   * @param expected - The expected message value
   */
  toHaveStatusMessageEqual(expected: unknown): this;

  /**
   * Asserts that the message strictly equals the expected value.
   * @param expected - The expected message value
   */
  toHaveStatusMessageStrictEqual(expected: unknown): this;

  /**
   * Asserts that the message satisfies the provided matcher function.
   * @param matcher - A function that receives the message and performs assertions
   */
  toHaveStatusMessageSatisfying(matcher: (value: string) => void): this;

  /**
   * Asserts that the message contains the specified substring.
   * @param substr - The substring to search for
   */
  toHaveStatusMessageContaining(substr: string): this;

  /**
   * Asserts that the message matches the specified regular expression.
   * @param expected - The regular expression to match against
   */
  toHaveStatusMessageMatching(expected: RegExp): this;

  /**
   * Asserts that the message is present (not null or undefined).
   */
  toHaveStatusMessagePresent(): this;

  /**
   * Asserts that the message is null.
   */
  toHaveStatusMessageNull(): this;

  /**
   * Asserts that the message is undefined.
   */
  toHaveStatusMessageUndefined(): this;

  /**
   * Asserts that the message is nullish (null or undefined).
   */
  toHaveStatusMessageNullish(): this;

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
    matcher: (value: ConnectRpcHeaders) => void,
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
   * @param keyPath - Property path as dot-separated string (`"user.name"`) or array (`["user", "name"]`). Use array format for properties containing dots.
   * @param value - Optional expected value at the key path
   */
  toHaveHeadersProperty(keyPath: string | string[], value?: unknown): this;

  /**
   * Asserts that the headers property contains the expected value.
   * @param keyPath - Property path as dot-separated string (`"user.name"`) or array (`["user", "name"]`). Use array format for properties containing dots.
   * @param expected - The expected contained value
   */
  toHaveHeadersPropertyContaining(
    keyPath: string | string[],
    expected: unknown,
  ): this;

  /**
   * Asserts that the headers property matches the specified subset.
   * @param keyPath - Property path as dot-separated string (`"user.name"`) or array (`["user", "name"]`). Use array format for properties containing dots.
   * @param subset - The subset to match against
   */
  toHaveHeadersPropertyMatching(
    keyPath: string | string[],
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the headers property satisfies the provided matcher function.
   * @param keyPath - Property path as dot-separated string (`"user.name"`) or array (`["user", "name"]`). Use array format for properties containing dots.
   * @param matcher - A function that receives the property value and performs assertions
   */
  toHaveHeadersPropertySatisfying(
    keyPath: string | string[],
    // deno-lint-ignore no-explicit-any
    matcher: (value: any) => void,
  ): this;

  /**
   * Asserts that the trailers equal the expected value.
   * @param expected - The expected trailers value
   */
  toHaveTrailers(expected: unknown): this;

  /**
   * Asserts that the trailers equal the expected value using deep equality.
   * @param expected - The expected trailers value
   */
  toHaveTrailersEqual(expected: unknown): this;

  /**
   * Asserts that the trailers strictly equal the expected value.
   * @param expected - The expected trailers value
   */
  toHaveTrailersStrictEqual(expected: unknown): this;

  /**
   * Asserts that the trailers satisfy the provided matcher function.
   * @param matcher - A function that receives the trailers and performs assertions
   */
  toHaveTrailersSatisfying(
    matcher: (value: ConnectRpcTrailers) => void,
  ): this;

  /**
   * Asserts that the trailers match the specified subset.
   * @param subset - The subset to match against
   */
  toHaveTrailersMatching(
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the trailers have the specified property.
   * @param keyPath - Property path as dot-separated string (`"user.name"`) or array (`["user", "name"]`). Use array format for properties containing dots.
   * @param value - Optional expected value at the key path
   */
  toHaveTrailersProperty(keyPath: string | string[], value?: unknown): this;

  /**
   * Asserts that the trailers property contains the expected value.
   * @param keyPath - Property path as dot-separated string (`"user.name"`) or array (`["user", "name"]`). Use array format for properties containing dots.
   * @param expected - The expected contained value
   */
  toHaveTrailersPropertyContaining(
    keyPath: string | string[],
    expected: unknown,
  ): this;

  /**
   * Asserts that the trailers property matches the specified subset.
   * @param keyPath - Property path as dot-separated string (`"user.name"`) or array (`["user", "name"]`). Use array format for properties containing dots.
   * @param subset - The subset to match against
   */
  toHaveTrailersPropertyMatching(
    keyPath: string | string[],
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the trailers property satisfies the provided matcher function.
   * @param keyPath - Property path as dot-separated string (`"user.name"`) or array (`["user", "name"]`). Use array format for properties containing dots.
   * @param matcher - A function that receives the property value and performs assertions
   */
  toHaveTrailersPropertySatisfying(
    keyPath: string | string[],
    // deno-lint-ignore no-explicit-any
    matcher: (value: any) => void,
  ): this;

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
    // deno-lint-ignore no-explicit-any
    matcher: (value: Record<string, any> | null) => void,
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
   * @param keyPath - Property path as dot-separated string (`"user.name"`) or array (`["user", "name"]`). Use array format for properties containing dots.
   * @param value - Optional expected value at the key path
   */
  toHaveDataProperty(keyPath: string | string[], value?: unknown): this;

  /**
   * Asserts that the data property contains the expected value.
   * @param keyPath - Property path as dot-separated string (`"user.name"`) or array (`["user", "name"]`). Use array format for properties containing dots.
   * @param expected - The expected contained value
   */
  toHaveDataPropertyContaining(
    keyPath: string | string[],
    expected: unknown,
  ): this;

  /**
   * Asserts that the data property matches the specified subset.
   * @param keyPath - Property path as dot-separated string (`"user.name"`) or array (`["user", "name"]`). Use array format for properties containing dots.
   * @param subset - The subset to match against
   */
  toHaveDataPropertyMatching(
    keyPath: string | string[],
    subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): this;

  /**
   * Asserts that the data property satisfies the provided matcher function.
   * @param keyPath - Property path as dot-separated string (`"user.name"`) or array (`["user", "name"]`). Use array format for properties containing dots.
   * @param matcher - A function that receives the property value and performs assertions
   */
  toHaveDataPropertySatisfying(
    keyPath: string | string[],
    // deno-lint-ignore no-explicit-any
    matcher: (value: any) => void,
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

export function expectConnectRpcResponse(
  response: ConnectRpcResponse,
): ConnectRpcResponseExpectation {
  return mixin.defineExpectation((negate, expectOrigin) => {
    const cfg = <T extends string>(valueName: T) =>
      ({ valueName, expectOrigin, subject: response }) as const;
    return [
      mixin.createOkMixin(() => response.ok, negate, cfg("response")),
      // Status code
      mixin.createValueMixin(
        () => response.statusCode,
        negate,
        cfg("status code"),
      ),
      mixin.createNumberValueMixin(
        () => ensureNonNullish(response.statusCode, "statusCode"),
        negate,
        cfg("status code"),
      ),
      mixin.createOneOfValueMixin(
        () => response.statusCode,
        negate,
        cfg("status code"),
      ),
      // Message
      mixin.createValueMixin(
        () => response.statusMessage,
        negate,
        cfg("status message"),
      ),
      mixin.createNullishValueMixin(
        () => response.statusMessage,
        negate,
        cfg("status message"),
      ),
      mixin.createStringValueMixin(
        () => ensureNonNullish(response.statusMessage, "status message"),
        negate,
        cfg("status message"),
      ),
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
      // Trailers
      mixin.createValueMixin(() => response.trailers, negate, cfg("trailers")),
      mixin.createObjectValueMixin(
        () =>
          Object.fromEntries(
            ensureNonNullish(response.trailers, "trailers").entries(),
          ),
        negate,
        cfg("trailers"),
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
