import {
  assertContains,
  assertMatches,
  containsSubarray,
  containsSubset,
  createDurationMethods,
  getNonNull,
} from "./common.ts";
import type { HttpResponse } from "@probitas/client-http";

/**
 * Fluent API for HTTP response validation.
 */
export interface HttpResponseExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectHttpResponse(response).not.toBeSuccessful();
   * expectHttpResponse(response).not.toHaveStatus(404);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the response status is successful (200-299).
   *
   * @example
   * ```ts
   * expectHttpResponse(response).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the response status matches the expected code.
   *
   * @param code - The expected HTTP status code
   * @example
   * ```ts
   * expectHttpResponse(response).toHaveStatus(200);
   * expectHttpResponse(response).toHaveStatus(201);
   * ```
   */
  toHaveStatus(code: number): this;

  /**
   * Asserts that the response status is one of the given values.
   *
   * @param statuses - Array of acceptable HTTP status codes
   * @example
   * ```ts
   * expectHttpResponse(response).toHaveStatusOneOf([200, 201, 204]);
   * ```
   */
  toHaveStatusOneOf(statuses: number[]): this;

  /**
   * Asserts that a header value matches the expected string or regex.
   *
   * @param name - The header name (case-insensitive)
   * @param expected - The expected value or pattern
   * @example
   * ```ts
   * expectHttpResponse(response).toHaveHeaderValue("content-type", "application/json");
   * expectHttpResponse(response).toHaveHeaderValue("content-type", /application\/json/);
   * ```
   */
  toHaveHeaderValue(name: string, expected: string | RegExp): this;

  /**
   * Asserts that a header exists in the response.
   *
   * @param name - The header name (case-insensitive)
   * @example
   * ```ts
   * expectHttpResponse(response).toHaveHeader("x-request-id");
   * ```
   */
  toHaveHeader(name: string): this;

  /**
   * Asserts that a header value contains the specified substring.
   *
   * @param name - The header name (case-insensitive)
   * @param substring - The substring to search for
   * @example
   * ```ts
   * expectHttpResponse(response).toHaveHeaderContaining("content-type", "json");
   * ```
   */
  toHaveHeaderContaining(name: string, substring: string): this;

  /**
   * Asserts a header value using a custom matcher function.
   *
   * @param name - The header name (case-insensitive)
   * @param matcher - Function that receives the header value and should throw if invalid
   * @example
   * ```ts
   * expectHttpResponse(response).toHaveHeaderMatching("x-custom", (value) => {
   *   assertEquals(value.startsWith("prefix-"), true);
   * });
   * ```
   */
  toHaveHeaderMatching(name: string, matcher: (value: string) => void): this;

  /**
   * Asserts that the Content-Type header matches the expected string or regex.
   *
   * @param expected - The expected content type or pattern
   * @example
   * ```ts
   * expectHttpResponse(response).toHaveContentType("application/json");
   * expectHttpResponse(response).toHaveContentType(/application\/json/);
   * ```
   */
  toHaveContentType(expected: string | RegExp): this;

  /**
   * Asserts that the response body is not null.
   *
   * @example
   * ```ts
   * expectHttpResponse(response).toHaveContent();
   * ```
   */
  toHaveContent(): this;

  /**
   * Asserts that the body contains the given byte sequence.
   *
   * @param subbody - The byte sequence to search for
   * @example
   * ```ts
   * const expected = new TextEncoder().encode("hello");
   * expectHttpResponse(response).toHaveBodyContaining(expected);
   * ```
   */
  toHaveBodyContaining(subbody: Uint8Array): this;

  /**
   * Asserts the JSON data using a custom matcher function.
   *
   * @param matcher - Function that receives the parsed JSON and should throw if invalid
   * @example
   * ```ts
   * expectHttpResponse(response).toSatisfy((data) => {
   *   assertEquals(data.users.length, 3);
   * });
   * ```
   */
  // deno-lint-ignore no-explicit-any
  toSatisfy<T = any>(matcher: (data: T) => void): this;

  /**
   * Asserts the raw body bytes using a custom matcher function.
   *
   * @param matcher - Function that receives the raw bytes and should throw if invalid
   * @example
   * ```ts
   * expectHttpResponse(response).toSatisfyBody((body) => {
   *   assertEquals(body.length > 0, true);
   * });
   * ```
   */
  toSatisfyBody(matcher: (body: Uint8Array) => void): this;

  /**
   * Asserts the text body using a custom matcher function.
   *
   * @param matcher - Function that receives the text and should throw if invalid
   * @example
   * ```ts
   * expectHttpResponse(response).toSatisfyText((text) => {
   *   assertStringIncludes(text, "success");
   * });
   * ```
   */
  toSatisfyText(matcher: (text: string) => void): this;

  /**
   * Asserts that the text body contains the specified substring.
   *
   * @param substring - The substring to search for
   * @example
   * ```ts
   * expectHttpResponse(response).toHaveTextContaining("success");
   * ```
   */
  toHaveTextContaining(substring: string): this;

  /**
   * Asserts that the JSON body contains the expected properties (deep partial match).
   *
   * @param subset - An object containing the expected properties
   * @example
   * ```ts
   * expectHttpResponse(response).toMatchObject({ status: "ok", data: { id: 1 } });
   * ```
   */
  // deno-lint-ignore no-explicit-any
  toMatchObject<T = any>(subset: Partial<T>): this;

  /**
   * Asserts that the response duration is less than the threshold.
   *
   * @param ms - Maximum duration in milliseconds
   * @example
   * ```ts
   * expectHttpResponse(response).toHaveDurationLessThan(1000);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the response duration is less than or equal to the threshold.
   *
   * @param ms - Maximum duration in milliseconds
   * @example
   * ```ts
   * expectHttpResponse(response).toHaveDurationLessThanOrEqual(1000);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the response duration is greater than the threshold.
   *
   * @param ms - Minimum duration in milliseconds
   * @example
   * ```ts
   * expectHttpResponse(response).toHaveDurationGreaterThan(100);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the response duration is greater than or equal to the threshold.
   *
   * @param ms - Minimum duration in milliseconds
   * @example
   * ```ts
   * expectHttpResponse(response).toHaveDurationGreaterThanOrEqual(100);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Create a fluent expectation chain for HTTP response validation.
 *
 * Returns an expectation object with chainable assertion methods.
 * Each assertion throws an Error if it fails, making it ideal for testing.
 *
 * @param response - The HTTP response to validate
 * @param negate - Whether to negate assertions (used internally by .not)
 * @returns A fluent expectation chain
 *
 * @example Basic assertions
 * ```ts
 * const response = await http.get("/users/123");
 *
 * expectHttpResponse(response)
 *   .toBeSuccessful()
 *   .toHaveContentType("application/json")
 *   .toMatchObject({ id: 123, name: "Alice" });
 * ```
 *
 * @example Error response assertions
 * ```ts
 * const response = await http.get("/not-found", { throwOnError: false });
 *
 * expectHttpResponse(response)
 *   .not.toBeSuccessful()
 *   .toHaveStatus(404);
 * ```
 *
 * @example Performance assertions
 * ```ts
 * expectHttpResponse(response)
 *   .toBeSuccessful()
 *   .toHaveDurationLessThan(1000);  // Must respond within 1 second
 * ```
 */
export function expectHttpResponse(
  response: HttpResponse,
  negate = false,
): HttpResponseExpectation {
  const self: HttpResponseExpectation = {
    get not(): HttpResponseExpectation {
      return expectHttpResponse(response, !negate);
    },

    toBeSuccessful() {
      const isSuccess = response.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? `Expected non-successful response, got status ${response.status}`
            : `Expected successful response (200-299), got status ${response.status}`,
        );
      }
      return this;
    },

    toHaveStatus(code: number) {
      const match = response.status === code;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected status to not be ${code}`
            : `Expected status ${code}, got ${response.status}`,
        );
      }
      return this;
    },

    toHaveStatusOneOf(statuses: number[]) {
      const match = statuses.includes(response.status);
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected status to not be one of [${
              statuses.join(", ")
            }], got ${response.status}`
            : `Expected status to be one of [${
              statuses.join(", ")
            }], got ${response.status}`,
        );
      }
      return this;
    },

    toHaveHeaderValue(name: string, expected: string | RegExp) {
      const value = getNonNull(response.headers.get(name), `header "${name}"`);
      assertMatches(value, expected, `header "${name}"`);
      return this;
    },

    toHaveHeader(name: string) {
      const has = response.headers.has(name);
      if (negate ? has : !has) {
        throw new Error(
          negate
            ? `Expected header "${name}" to not exist`
            : `Expected header "${name}" to exist`,
        );
      }
      return this;
    },

    toHaveHeaderContaining(name: string, substring: string) {
      const value = getNonNull(response.headers.get(name), `header "${name}"`);
      assertContains(value, substring, `header "${name}"`);
      return this;
    },

    toHaveHeaderMatching(name: string, matcher: (value: string) => void) {
      const value = getNonNull(response.headers.get(name), `header "${name}"`);
      matcher(value);
      return this;
    },

    toHaveContentType(expected: string | RegExp) {
      return this.toHaveHeaderValue("Content-Type", expected);
    },

    toHaveContent() {
      const hasContent = response.body !== null;
      if (negate ? hasContent : !hasContent) {
        throw new Error(
          negate
            ? "Expected no content, but body is present"
            : "Expected content, but body is null",
        );
      }
      return this;
    },

    toHaveBodyContaining(subbody: Uint8Array) {
      const body = getNonNull(response.body, "body");
      const contains = containsSubarray(body, subbody);
      if (negate ? contains : !contains) {
        throw new Error(
          negate
            ? "Expected body to not contain bytes"
            : "Body does not contain expected bytes",
        );
      }
      return this;
    },

    // deno-lint-ignore no-explicit-any
    toSatisfy<T = any>(matcher: (data: T) => void) {
      const data = getNonNull(response.data(), "JSON data") as T;
      matcher(data);
      return this;
    },

    toSatisfyBody(matcher: (body: Uint8Array) => void) {
      const body = getNonNull(response.body, "body");
      matcher(body);
      return this;
    },

    toSatisfyText(matcher: (text: string) => void) {
      const text = getNonNull(response.text(), "text");
      matcher(text);
      return this;
    },

    toHaveTextContaining(substring: string) {
      const text = getNonNull(response.text(), "text body");
      const contains = text.includes(substring);
      if (negate ? contains : !contains) {
        throw new Error(
          negate
            ? `Expected text to not contain "${substring}"`
            : `Text does not contain "${substring}"`,
        );
      }
      return this;
    },

    // deno-lint-ignore no-explicit-any
    toMatchObject<T = any>(subset: Partial<T>) {
      const data = getNonNull(response.data(), "JSON data");
      const matches = containsSubset(data, subset);
      if (negate ? matches : !matches) {
        throw new Error(
          negate
            ? "Expected data to not contain properties"
            : "Data does not contain expected properties",
        );
      }
      return this;
    },

    ...createDurationMethods(response.duration, negate),
  };

  return self;
}
