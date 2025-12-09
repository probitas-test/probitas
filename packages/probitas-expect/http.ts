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
  /** Invert all assertions */
  readonly not: this;

  /** Assert that response status is 200-299 */
  toBeSuccessful(): this;

  /** Assert that response status matches expected code */
  toHaveStatus(code: number): this;

  /** Assert that response status is one of the given values */
  toHaveStatusOneOf(statuses: number[]): this;

  /** Assert that header value matches expected string or regex */
  toHaveHeaderValue(name: string, expected: string | RegExp): this;

  /** Assert that header exists */
  toHaveHeader(name: string): this;

  /** Assert that header value contains substring */
  toHaveHeaderContaining(name: string, substring: string): this;

  /** Assert header value using custom matcher function */
  toHaveHeaderMatching(name: string, matcher: (value: string) => void): this;

  /** Assert that Content-Type header matches expected string or regex */
  toHaveContentType(expected: string | RegExp): this;

  /** Assert that response body is not null */
  toHaveContent(): this;

  /** Assert that body contains given byte sequence */
  toHaveBodyContaining(subbody: Uint8Array): this;

  /** Assert JSON data using custom matcher function */
  // deno-lint-ignore no-explicit-any
  toSatisfy<T = any>(matcher: (data: T) => void): this;

  /** Assert raw body bytes using custom matcher function */
  toSatisfyBody(matcher: (body: Uint8Array) => void): this;

  /** Assert text body using custom matcher function */
  toSatisfyText(matcher: (text: string) => void): this;

  /** Assert that text body contains substring */
  toHaveTextContaining(substring: string): this;

  /** Assert that JSON body contains expected properties */
  // deno-lint-ignore no-explicit-any
  toMatchObject<T = any>(subset: Partial<T>): this;

  /** Assert that response duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that response duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that response duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that response duration is greater than or equal to threshold (ms) */
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
