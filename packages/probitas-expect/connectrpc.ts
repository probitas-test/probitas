/**
 * Fluent expectation API for ConnectRPC responses.
 *
 * @module
 */

import { containsSubset, createDurationMethods, getNonNull } from "./common.ts";
import type {
  ConnectRpcResponse,
  ConnectRpcStatusCode,
} from "@probitas/client-connectrpc";

/**
 * Fluent assertion interface for ConnectRpcResponse.
 */
export interface ConnectRpcResponseExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectConnectRpcResponse(response).not.toBeSuccessful();
   * expectConnectRpcResponse(response).not.toHaveCode(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the status is OK (code === 0).
   *
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the status code matches the expected value exactly.
   *
   * @param expected - The expected ConnectRPC status code
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveCode(0);  // OK
   * expectConnectRpcResponse(response).toHaveCode(5);  // NOT_FOUND
   * ```
   */
  toHaveCode(expected: ConnectRpcStatusCode): this;

  /**
   * Asserts that the status code is one of the specified values.
   *
   * @param codes - Array of acceptable ConnectRPC status codes
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveCodeOneOf([3, 5]);  // INVALID_ARGUMENT or NOT_FOUND
   * ```
   */
  toHaveCodeOneOf(codes: ConnectRpcStatusCode[]): this;

  /**
   * Asserts that the error message matches the expected value exactly or by regex.
   *
   * @param expected - The expected error message string or RegExp pattern
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveError("user not found");
   * expectConnectRpcResponse(response).toHaveError(/not found/i);
   * ```
   */
  toHaveError(expected: string | RegExp): this;

  /**
   * Asserts that the error message contains the specified substring.
   *
   * @param substring - The substring to search for in the error message
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveErrorContaining("not found");
   * ```
   */
  toHaveErrorContaining(substring: string): this;

  /**
   * Asserts that the error message satisfies a custom matcher function.
   *
   * @param matcher - A function that receives the error message and throws if invalid
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveErrorMatching((msg) => {
   *   if (!msg.startsWith("Error:")) {
   *     throw new Error("Expected error to start with 'Error:'");
   *   }
   * });
   * ```
   */
  toHaveErrorMatching(matcher: (message: string) => void): this;

  /**
   * Asserts that a header value matches the expected value exactly or by regex.
   *
   * @param name - The header name (case-insensitive)
   * @param expected - The expected header value string or RegExp pattern
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveHeaderValue("content-type", "application/json");
   * expectConnectRpcResponse(response).toHaveHeaderValue("x-request-id", /^[a-f0-9-]+$/);
   * ```
   */
  toHaveHeaderValue(name: string, expected: string | RegExp): this;

  /**
   * Asserts that a header exists in the response.
   *
   * @param name - The header name (case-insensitive)
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveHeader("x-request-id");
   * ```
   */
  toHaveHeader(name: string): this;

  /**
   * Asserts that a header value contains the specified substring.
   *
   * @param name - The header name (case-insensitive)
   * @param substring - The substring to search for in the header value
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveHeaderContaining("content-type", "json");
   * ```
   */
  toHaveHeaderContaining(name: string, substring: string): this;

  /**
   * Asserts that a header value satisfies a custom matcher function.
   *
   * @param name - The header name (case-insensitive)
   * @param matcher - A function that receives the header value and throws if invalid
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveHeaderMatching("x-request-id", (value) => {
   *   if (value.length !== 36) {
   *     throw new Error("Expected UUID format");
   *   }
   * });
   * ```
   */
  toHaveHeaderMatching(name: string, matcher: (value: string) => void): this;

  /**
   * Asserts that a trailer value matches the expected value exactly or by regex.
   *
   * @param name - The trailer name (case-insensitive)
   * @param expected - The expected trailer value string or RegExp pattern
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveTrailerValue("grpc-status", "0");
   * expectConnectRpcResponse(response).toHaveTrailerValue("grpc-message", /success/i);
   * ```
   */
  toHaveTrailerValue(name: string, expected: string | RegExp): this;

  /**
   * Asserts that a trailer exists in the response.
   *
   * @param name - The trailer name (case-insensitive)
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveTrailer("grpc-status");
   * ```
   */
  toHaveTrailer(name: string): this;

  /**
   * Asserts that a trailer value contains the specified substring.
   *
   * @param name - The trailer name (case-insensitive)
   * @param substring - The substring to search for in the trailer value
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveTrailerContaining("grpc-message", "success");
   * ```
   */
  toHaveTrailerContaining(name: string, substring: string): this;

  /**
   * Asserts that a trailer value satisfies a custom matcher function.
   *
   * @param name - The trailer name (case-insensitive)
   * @param matcher - A function that receives the trailer value and throws if invalid
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveTrailerMatching("grpc-status", (value) => {
   *   if (value !== "0") {
   *     throw new Error("Expected successful status");
   *   }
   * });
   * ```
   */
  toHaveTrailerMatching(name: string, matcher: (value: string) => void): this;

  /**
   * Asserts that the response has content (data() is not null).
   *
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveContent();
   * ```
   */
  toHaveContent(): this;

  /**
   * Asserts that the response data contains the specified properties (deep partial match).
   *
   * @param subset - An object containing the expected subset of properties
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toMatchObject({ id: 1, name: "Alice" });
   * expectConnectRpcResponse(response).toMatchObject({ user: { email: "alice@example.com" } });
   * ```
   */
  // deno-lint-ignore no-explicit-any
  toMatchObject<T = any>(subset: Partial<T>): this;

  /**
   * Asserts that the response data satisfies a custom matcher function.
   *
   * @param matcher - A function that receives the response data and throws if invalid
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toSatisfy((data) => {
   *   if (data.items.length === 0) {
   *     throw new Error("Expected at least one item");
   *   }
   * });
   * ```
   */
  // deno-lint-ignore no-explicit-any
  toSatisfy<T = any>(matcher: (data: T) => void): this;

  /**
   * Asserts that the response duration is less than the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveDurationLessThan(500);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the response duration is less than or equal to the specified threshold.
   *
   * @param ms - The maximum duration in milliseconds
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveDurationLessThanOrEqual(500);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the response duration is greater than the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveDurationGreaterThan(100);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the response duration is greater than or equal to the specified threshold.
   *
   * @param ms - The minimum duration in milliseconds
   * @example
   * ```ts
   * expectConnectRpcResponse(response).toHaveDurationGreaterThanOrEqual(100);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Create a fluent assertion chain for ConnectRPC response validation.
 *
 * Returns an expectation object with chainable assertion methods.
 * Each assertion throws an Error if it fails, making it ideal for testing.
 *
 * @param response - The ConnectRPC response to validate
 * @param negate - Whether to negate assertions (used internally by .not)
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
 *   .toBeSuccessful()
 *   .toHaveContent()
 *   .toMatchObject({ message: "Hello!" });
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
 *   .not.toBeSuccessful()
 *   .toHaveCode(5)  // NOT_FOUND
 *   .toHaveErrorContaining("not found");
 * ```
 *
 * @example Header and trailer assertions
 * ```ts
 * expectConnectRpcResponse(response)
 *   .toBeSuccessful()
 *   .toHaveHeader("x-request-id")
 *   .toHaveTrailer("grpc-status");
 * ```
 *
 * @example Performance assertions
 * ```ts
 * expectConnectRpcResponse(response)
 *   .toBeSuccessful()
 *   .toHaveDurationLessThan(500);  // Must respond within 500ms
 * ```
 */
export function expectConnectRpcResponse(
  response: ConnectRpcResponse,
  negate = false,
): ConnectRpcResponseExpectation {
  const self: ConnectRpcResponseExpectation = {
    get not(): ConnectRpcResponseExpectation {
      return expectConnectRpcResponse(response, !negate);
    },

    toBeSuccessful() {
      const isSuccess = response.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? `Expected non-successful response, got code ${response.code}`
            : `Expected successful response (code 0), got code ${response.code}`,
        );
      }
      return this;
    },

    toHaveCode(expected: ConnectRpcStatusCode) {
      const match = response.code === expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected code to not be ${expected}, got ${response.code}`
            : `Expected code ${expected}, got ${response.code}`,
        );
      }
      return this;
    },

    toHaveCodeOneOf(codes: ConnectRpcStatusCode[]) {
      const match = codes.includes(response.code);
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected code to not be one of [${
              codes.join(", ")
            }], got ${response.code}`
            : `Expected code to be one of [${
              codes.join(", ")
            }], got ${response.code}`,
        );
      }
      return this;
    },

    toHaveError(expected: string | RegExp) {
      const msg = response.message;
      if (typeof expected === "string") {
        const match = msg === expected;
        if (negate ? match : !match) {
          throw new Error(
            negate
              ? `Expected error to not be "${expected}", got "${msg}"`
              : `Expected error "${expected}", got "${msg}"`,
          );
        }
      } else {
        const match = expected.test(msg);
        if (negate ? match : !match) {
          throw new Error(
            negate
              ? `Expected error to not match ${expected}, got "${msg}"`
              : `Expected error to match ${expected}, got "${msg}"`,
          );
        }
      }
      return this;
    },

    toHaveErrorContaining(substring: string) {
      const contains = response.message.includes(substring);
      if (negate ? contains : !contains) {
        throw new Error(
          negate
            ? `Expected error to not contain "${substring}"`
            : `Expected error to contain "${substring}"`,
        );
      }
      return this;
    },

    toHaveErrorMatching(matcher: (message: string) => void) {
      matcher(response.message);
      return this;
    },

    toHaveHeaderValue(name: string, expected: string | RegExp) {
      const value = response.headers[name];
      if (typeof expected === "string") {
        const match = value === expected;
        if (negate ? match : !match) {
          throw new Error(
            negate
              ? `Expected header "${name}" to not be "${expected}", got "${value}"`
              : `Expected header "${name}" to be "${expected}", got "${value}"`,
          );
        }
      } else {
        const match = value !== undefined && expected.test(value);
        if (negate ? match : !match) {
          throw new Error(
            negate
              ? `Expected header "${name}" to not match ${expected}, got "${value}"`
              : `Expected header "${name}" to match ${expected}, got "${value}"`,
          );
        }
      }
      return this;
    },

    toHaveHeader(name: string) {
      const exists = name in response.headers;
      if (negate ? exists : !exists) {
        throw new Error(
          negate
            ? `Expected header "${name}" to not exist`
            : `Expected header "${name}" to exist`,
        );
      }
      return this;
    },

    toHaveHeaderContaining(name: string, substring: string) {
      const value = getNonNull(response.headers[name], `header "${name}"`);
      const contains = value.includes(substring);
      if (negate ? contains : !contains) {
        throw new Error(
          negate
            ? `Expected header "${name}" to not contain "${substring}", got "${value}"`
            : `Expected header "${name}" to contain "${substring}", got "${value}"`,
        );
      }
      return this;
    },

    toHaveHeaderMatching(name: string, matcher: (value: string) => void) {
      const value = getNonNull(response.headers[name], `header "${name}"`);
      matcher(value);
      return this;
    },

    toHaveTrailerValue(name: string, expected: string | RegExp) {
      const value = response.trailers[name];
      if (typeof expected === "string") {
        const match = value === expected;
        if (negate ? match : !match) {
          throw new Error(
            negate
              ? `Expected trailer "${name}" to not be "${expected}", got "${value}"`
              : `Expected trailer "${name}" to be "${expected}", got "${value}"`,
          );
        }
      } else {
        const match = value !== undefined && expected.test(value);
        if (negate ? match : !match) {
          throw new Error(
            negate
              ? `Expected trailer "${name}" to not match ${expected}, got "${value}"`
              : `Expected trailer "${name}" to match ${expected}, got "${value}"`,
          );
        }
      }
      return this;
    },

    toHaveTrailer(name: string) {
      const exists = name in response.trailers;
      if (negate ? exists : !exists) {
        throw new Error(
          negate
            ? `Expected trailer "${name}" to not exist`
            : `Expected trailer "${name}" to exist`,
        );
      }
      return this;
    },

    toHaveTrailerContaining(name: string, substring: string) {
      const value = getNonNull(response.trailers[name], `trailer "${name}"`);
      const contains = value.includes(substring);
      if (negate ? contains : !contains) {
        throw new Error(
          negate
            ? `Expected trailer "${name}" to not contain "${substring}", got "${value}"`
            : `Expected trailer "${name}" to contain "${substring}", got "${value}"`,
        );
      }
      return this;
    },

    toHaveTrailerMatching(name: string, matcher: (value: string) => void) {
      const value = getNonNull(response.trailers[name], `trailer "${name}"`);
      matcher(value);
      return this;
    },

    toHaveContent() {
      const hasData = response.data() !== null;
      if (negate ? hasData : !hasData) {
        throw new Error(
          negate
            ? "Expected no content, but data is not null"
            : "Expected content, but data is null",
        );
      }
      return this;
    },

    // deno-lint-ignore no-explicit-any
    toMatchObject<T = any>(subset: Partial<T>) {
      const data = response.data<T>();
      const matches = containsSubset(data, subset);
      if (negate ? matches : !matches) {
        throw new Error(
          negate
            ? `Expected data to not contain ${JSON.stringify(subset)}, got ${
              JSON.stringify(data)
            }`
            : `Expected data to contain ${JSON.stringify(subset)}, got ${
              JSON.stringify(data)
            }`,
        );
      }
      return this;
    },

    // deno-lint-ignore no-explicit-any
    toSatisfy<T = any>(matcher: (data: T) => void) {
      const data = getNonNull(response.data<T>(), "data");
      matcher(data);
      return this;
    },

    ...createDurationMethods(response.duration, negate),
  };

  return self;
}
