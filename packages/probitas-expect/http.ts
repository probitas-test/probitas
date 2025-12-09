import {
  buildDurationError,
  containsSubarray,
  containsSubset,
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
  status(code: number): this;

  /** Assert that response status is within range (inclusive) */
  statusInRange(min: number, max: number): this;

  /** Assert that response status is one of the given values */
  toHaveStatusIn(statuses: number[]): this;

  /** Assert that header value matches expected string or regex */
  header(name: string, expected: string | RegExp): this;

  /** Assert that header exists */
  toHaveHeader(name: string): this;

  /** Assert that header value contains substring */
  toHaveHeaderContaining(name: string, substring: string): this;

  /** Assert header value using custom matcher function */
  headerMatch(name: string, matcher: (value: string) => void): this;

  /** Assert that Content-Type header matches expected string or regex */
  contentType(expected: string | RegExp): this;

  /** Assert that response body is not null */
  toHaveContent(): this;

  /** Assert that body contains given byte sequence */
  toHaveBodyContaining(subbody: Uint8Array): this;

  /** Assert body or text using custom matcher function */
  toSatisfy(matcher: (value: Uint8Array | string) => void): this;

  /** Assert that text body contains substring */
  toHaveTextContaining(substring: string): this;

  /** Assert that JSON body contains expected properties */
  // deno-lint-ignore no-explicit-any
  toMatchObject<T = any>(subset: Partial<T>): this;

  /** Assert that response duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;
}

/**
 * HttpResponseExpectation implementation.
 */
class HttpResponseExpectationImpl implements HttpResponseExpectation {
  readonly #response: HttpResponse;
  readonly #negate: boolean;

  constructor(response: HttpResponse, negate = false) {
    this.#response = response;
    this.#negate = negate;
  }

  get not(): this {
    return new HttpResponseExpectationImpl(
      this.#response,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#response.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? `Expected non-successful response, got status ${this.#response.status}`
          : `Expected successful response (200-299), got status ${this.#response.status}`,
      );
    }
    return this;
  }

  status(code: number): this {
    if (this.#response.status !== code) {
      throw new Error(
        `Expected status ${code}, got ${this.#response.status}`,
      );
    }
    return this;
  }

  statusInRange(min: number, max: number): this {
    const { status } = this.#response;
    if (status < min || status > max) {
      throw new Error(
        `Expected status in range ${min}-${max}, got ${status}`,
      );
    }
    return this;
  }

  toHaveStatusIn(statuses: number[]): this {
    const { status } = this.#response;
    if (!statuses.includes(status)) {
      throw new Error(
        `Expected status in [${statuses.join(", ")}], got ${status}`,
      );
    }
    return this;
  }

  header(name: string, expected: string | RegExp): this {
    const value = this.#response.headers.get(name);
    if (value === null) {
      throw new Error(`Header ${name} not found`);
    }

    if (typeof expected === "string") {
      if (value !== expected) {
        throw new Error(
          `Expected header ${name} to be "${expected}", got "${value}"`,
        );
      }
    } else {
      if (!expected.test(value)) {
        throw new Error(
          `Expected header ${name} to match ${expected}, got "${value}"`,
        );
      }
    }
    return this;
  }

  toHaveHeader(name: string): this {
    if (!this.#response.headers.has(name)) {
      throw new Error(`Header ${name} not found`);
    }
    return this;
  }

  toHaveHeaderContaining(name: string, substring: string): this {
    const value = this.#response.headers.get(name);
    if (value === null) {
      throw new Error(`Header ${name} not found`);
    }
    if (!value.includes(substring)) {
      throw new Error(
        `Expected header ${name} to contain "${substring}", got "${value}"`,
      );
    }
    return this;
  }

  headerMatch(name: string, matcher: (value: string) => void): this {
    const value = this.#response.headers.get(name);
    if (value === null) {
      throw new Error(`Header ${name} not found`);
    }
    matcher(value);
    return this;
  }

  contentType(expected: string | RegExp): this {
    return this.header("Content-Type", expected);
  }

  toHaveContent(): this {
    if (this.#response.body === null) {
      throw new Error("Expected content, but body is null");
    }
    return this;
  }

  toHaveBodyContaining(subbody: Uint8Array): this {
    if (this.#response.body === null) {
      throw new Error("Expected body to contain bytes, but body is null");
    }
    if (!containsSubarray(this.#response.body, subbody)) {
      throw new Error("Body does not contain expected bytes");
    }
    return this;
  }

  toSatisfy(matcher: (value: Uint8Array | string) => void): this {
    if (this.#response.body === null) {
      throw new Error("Expected body for matching, but body is null");
    }

    // Try text first if possible
    const text = this.#response.text();
    if (text !== null) {
      try {
        matcher(text);
        return this;
      } catch {
        // If text matcher fails, try with raw body
      }
    }

    matcher(this.#response.body);
    return this;
  }

  toHaveTextContaining(substring: string): this {
    const text = this.#response.text();
    if (text === null) {
      throw new Error("Expected text to contain substring, but body is null");
    }
    if (!text.includes(substring)) {
      throw new Error(`Text does not contain "${substring}"`);
    }
    return this;
  }

  // deno-lint-ignore no-explicit-any
  toMatchObject<T = any>(subset: Partial<T>): this {
    const data = this.#response.data();
    if (data === null) {
      throw new Error("Expected data to contain properties, but body is null");
    }
    if (!containsSubset(data, subset)) {
      throw new Error("Data does not contain expected properties");
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#response.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#response.duration));
    }
    return this;
  }
}

/**
 * Create a fluent expectation chain for HTTP response validation.
 *
 * Returns an expectation object with chainable assertion methods.
 * Each assertion throws an Error if it fails, making it ideal for testing.
 *
 * @param response - The HTTP response to validate
 * @returns A fluent expectation chain
 *
 * @example Basic assertions
 * ```ts
 * const response = await http.get("/users/123");
 *
 * expectHttpResponse(response)
 *   .ok()
 *   .contentType("application/json")
 *   .dataContains({ id: 123, name: "Alice" });
 * ```
 *
 * @example Error response assertions
 * ```ts
 * const response = await http.get("/not-found", { throwOnError: false });
 *
 * expectHttpResponse(response)
 *   .notOk()
 *   .status(404);
 * ```
 *
 * @example Performance assertions
 * ```ts
 * expectHttpResponse(response)
 *   .ok()
 *   .durationLessThan(1000);  // Must respond within 1 second
 * ```
 */
export function expectHttpResponse(
  response: HttpResponse,
): HttpResponseExpectation {
  return new HttpResponseExpectationImpl(response);
}
