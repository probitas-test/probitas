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
  /** Invert all assertions */
  readonly not: this;

  /** Verify that status is OK (code === 0). */
  toBeSuccessful(): this;

  /** Verify the exact status code. */
  toHaveCode(expected: ConnectRpcStatusCode): this;

  /** Verify the status code is one of the specified values. */
  toHaveCodeOneOf(codes: ConnectRpcStatusCode[]): this;

  /** Verify the error message matches exactly or by regex. */
  toHaveError(expected: string | RegExp): this;

  /** Verify the error message contains the substring. */
  toHaveErrorContaining(substring: string): this;

  /** Verify the error message using a custom matcher. */
  toHaveErrorMatching(matcher: (message: string) => void): this;

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

  /** Verify that response duration is less than or equal to the threshold. */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Verify that response duration is greater than the threshold. */
  toHaveDurationGreaterThan(ms: number): this;

  /** Verify that response duration is greater than or equal to the threshold. */
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
