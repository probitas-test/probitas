/**
 * Fluent expectation API for ConnectRPC responses.
 *
 * @module
 */

import { buildDurationError, containsSubset } from "./common.ts";
import type {
  ConnectRpcResponse,
  ConnectRpcStatusCode,
} from "@probitas/client-connectrpc";

/**
 * Fluent assertion interface for ConnectRpcResponse.
 */
export interface ConnectRpcResponseExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Verify that status is OK (code === 0). */
  toBeSuccessful(): this;

  /** Verify the exact status code. */
  toHaveCode(expected: ConnectRpcStatusCode): this;

  /** Verify the status code is one of the specified values. */
  toHaveCodeIn(codes: ConnectRpcStatusCode[]): this;

  /** Verify the error message matches exactly or by regex. */
  toHaveError(expected: string | RegExp): this;

  /** Verify the error message contains the substring. */
  toHaveErrorContaining(substring: string): this;

  /** Verify the error message using a custom matcher. */
  errorMatch(matcher: (message: string) => void): this;

  /** Verify a header value matches exactly or by regex. */
  toHaveHeaderValue(name: string, expected: string | RegExp): this;

  /** Verify that a header exists. */
  toHaveHeader(name: string): this;

  /** Verify that a header value contains the substring. */
  toHaveHeaderContaining(name: string, substring: string): this;

  /** Verify a header value using a custom matcher. */
  toHaveHeaderMatching(name: string, matcher: (value: string) => void): this;

  /** Verify a trailer value matches exactly or by regex. */
  toHaveTrailerValue(name: string, expected: string | RegExp): this;

  /** Verify that a trailer exists. */
  toHaveTrailer(name: string): this;

  /** Verify that a trailer value contains the substring. */
  toHaveTrailerContaining(name: string, substring: string): this;

  /** Verify a trailer value using a custom matcher. */
  toHaveTrailerMatching(name: string, matcher: (value: string) => void): this;

  /** Verify that data() is not null. */
  toHaveContent(): this;

  /** Verify that data() contains the specified properties (deep partial match). */
  // deno-lint-ignore no-explicit-any
  toMatchObject<T = any>(subset: Partial<T>): this;

  /** Verify data() using a custom matcher. */
  // deno-lint-ignore no-explicit-any
  toSatisfy<T = any>(matcher: (data: T) => void): this;

  /** Verify that response duration is less than the threshold. */
  toHaveDurationLessThan(ms: number): this;
}

class ConnectRpcResponseExpectationImpl
  implements ConnectRpcResponseExpectation {
  readonly #response: ConnectRpcResponse;
  readonly #negate: boolean;

  constructor(response: ConnectRpcResponse, negate = false) {
    this.#response = response;
    this.#negate = negate;
  }

  get not(): this {
    return new ConnectRpcResponseExpectationImpl(
      this.#response,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#response.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? `Expected non-successful response, got code ${this.#response.code}`
          : `Expected successful response (code 0), got code ${this.#response.code}`,
      );
    }
    return this;
  }

  toHaveCode(expected: ConnectRpcStatusCode): this {
    if (this.#response.code !== expected) {
      throw new Error(
        `Expected code ${expected}, got ${this.#response.code}`,
      );
    }
    return this;
  }

  toHaveCodeIn(codes: ConnectRpcStatusCode[]): this {
    if (!codes.includes(this.#response.code)) {
      throw new Error(
        `Expected code to be one of [${
          codes.join(", ")
        }], got ${this.#response.code}`,
      );
    }
    return this;
  }

  toHaveError(expected: string | RegExp): this {
    const msg = this.#response.message;
    if (typeof expected === "string") {
      if (msg !== expected) {
        throw new Error(`Expected error "${expected}", got "${msg}"`);
      }
    } else {
      if (!expected.test(msg)) {
        throw new Error(
          `Expected error to match ${expected}, got "${msg}"`,
        );
      }
    }
    return this;
  }

  toHaveErrorContaining(substring: string): this {
    if (!this.#response.message.includes(substring)) {
      throw new Error(`Expected error to contain "${substring}"`);
    }
    return this;
  }

  errorMatch(matcher: (message: string) => void): this {
    matcher(this.#response.message);
    return this;
  }

  toHaveHeaderValue(name: string, expected: string | RegExp): this {
    const value = this.#response.headers[name];
    if (typeof expected === "string") {
      if (value !== expected) {
        throw new Error(
          `Expected header "${name}" to be "${expected}", got "${value}"`,
        );
      }
    } else {
      if (value === undefined || !expected.test(value)) {
        throw new Error(
          `Expected header "${name}" to match ${expected}, got "${value}"`,
        );
      }
    }
    return this;
  }

  toHaveHeader(name: string): this {
    if (!(name in this.#response.headers)) {
      throw new Error(`Expected header "${name}" to exist`);
    }
    return this;
  }

  toHaveHeaderContaining(name: string, substring: string): this {
    const value = this.#response.headers[name];
    if (value === undefined) {
      throw new Error(`Expected header "${name}" to exist`);
    }
    if (!value.includes(substring)) {
      throw new Error(
        `Expected header "${name}" to contain "${substring}", got "${value}"`,
      );
    }
    return this;
  }

  toHaveHeaderMatching(name: string, matcher: (value: string) => void): this {
    const value = this.#response.headers[name];
    if (value === undefined) {
      throw new Error(`Expected header "${name}" to exist`);
    }
    matcher(value);
    return this;
  }

  toHaveTrailerValue(name: string, expected: string | RegExp): this {
    const value = this.#response.trailers[name];
    if (typeof expected === "string") {
      if (value !== expected) {
        throw new Error(
          `Expected trailer "${name}" to be "${expected}", got "${value}"`,
        );
      }
    } else {
      if (value === undefined || !expected.test(value)) {
        throw new Error(
          `Expected trailer "${name}" to match ${expected}, got "${value}"`,
        );
      }
    }
    return this;
  }

  toHaveTrailer(name: string): this {
    if (!(name in this.#response.trailers)) {
      throw new Error(`Expected trailer "${name}" to exist`);
    }
    return this;
  }

  toHaveTrailerContaining(name: string, substring: string): this {
    const value = this.#response.trailers[name];
    if (value === undefined) {
      throw new Error(`Expected trailer "${name}" to exist`);
    }
    if (!value.includes(substring)) {
      throw new Error(
        `Expected trailer "${name}" to contain "${substring}", got "${value}"`,
      );
    }
    return this;
  }

  toHaveTrailerMatching(name: string, matcher: (value: string) => void): this {
    const value = this.#response.trailers[name];
    if (value === undefined) {
      throw new Error(`Expected trailer "${name}" to exist`);
    }
    matcher(value);
    return this;
  }

  toHaveContent(): this {
    const hasData = this.#response.data() !== null;
    if (this.#negate ? hasData : !hasData) {
      throw new Error(
        this.#negate
          ? "Expected no content, but data is not null"
          : "Expected content, but data is null",
      );
    }
    return this;
  }

  // deno-lint-ignore no-explicit-any
  toMatchObject<T = any>(subset: Partial<T>): this {
    const data = this.#response.data<T>();
    if (!containsSubset(data, subset)) {
      throw new Error(
        `Expected data to contain ${JSON.stringify(subset)}, got ${
          JSON.stringify(data)
        }`,
      );
    }
    return this;
  }

  // deno-lint-ignore no-explicit-any
  toSatisfy<T = any>(matcher: (data: T) => void): this {
    const data = this.#response.data<T>();
    if (data === null) {
      throw new Error("Cannot match data: data is null");
    }
    matcher(data);
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
 * Create a fluent assertion chain for ConnectRPC response validation.
 *
 * Returns an expectation object with chainable assertion methods.
 * Each assertion throws an Error if it fails, making it ideal for testing.
 *
 * @param response - The ConnectRPC response to validate
 * @returns A fluent expectation chain
 *
 * @example Basic assertions
 * ```ts
 * const response = await client.call(
 *   "echo.EchoService",
 *   "echo",
 *   { message: "Hello!" }
 * );
 *
 * expectConnectRpcResponse(response)
 *   .ok()
 *   .hasContent()
 *   .dataContains({ message: "Hello!" });
 * ```
 *
 * @example Error status assertions
 * ```ts
 * const response = await client.call(
 *   "user.UserService",
 *   "getUser",
 *   { id: "non-existent" },
 *   { throwOnError: false }
 * );
 *
 * expectConnectRpcResponse(response)
 *   .notOk()
 *   .code(5)  // NOT_FOUND
 *   .errorContains("not found");
 * ```
 *
 * @example Header and trailer assertions
 * ```ts
 * expectConnectRpcResponse(response)
 *   .ok()
 *   .headerExists("x-request-id")
 *   .trailerExists("grpc-status");
 * ```
 *
 * @example Performance assertions
 * ```ts
 * expectConnectRpcResponse(response)
 *   .ok()
 *   .durationLessThan(500);  // Must respond within 500ms
 * ```
 */
export function expectConnectRpcResponse(
  response: ConnectRpcResponse,
): ConnectRpcResponseExpectation {
  return new ConnectRpcResponseExpectationImpl(response);
}
