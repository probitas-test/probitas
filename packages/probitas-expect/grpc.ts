/**
 * gRPC response expectation implementation.
 *
 * This module provides fluent assertion methods for gRPC responses from
 * @probitas/client-grpc. It uses common utilities for formatting and diffing.
 *
 * @module
 */

import type { GrpcResponse } from "@probitas/client-grpc";
import {
  buildErrorMessage,
  containsSubset,
  createDurationMethods,
  formatDifferences,
} from "./common.ts";

/**
 * Fluent expectation interface for gRPC responses.
 */
export interface GrpcResponseExpectation {
  /**
   * Negates the next assertion.
   */
  readonly not: this;

  /**
   * Assert that the response is successful (status code 0/OK).
   */
  toBeSuccessful(): this;

  /**
   * Assert that the response has a specific status code.
   *
   * @param expected - Expected gRPC status code
   */
  toHaveCode(expected: number): this;

  /**
   * Assert that the response status code is one of the specified codes.
   *
   * @param codes - Array of acceptable status codes
   */
  toHaveCodeOneOf(codes: number[]): this;

  /**
   * Assert that the response has a specific status message.
   *
   * @param expected - Expected status message
   */
  toHaveMessage(expected: string): this;

  /**
   * Assert that the status message contains a substring.
   *
   * @param substring - Expected substring
   */
  toHaveMessageContaining(substring: string): this;

  /**
   * Assert that the status message matches a pattern.
   *
   * @param pattern - RegExp pattern
   */
  toHaveMessageMatching(pattern: RegExp): this;

  /**
   * Assert that a specific trailer has the expected value.
   *
   * @param name - Trailer name
   * @param value - Expected trailer value
   */
  toHaveTrailerValue(name: string, value: string): this;

  /**
   * Assert that a specific trailer exists.
   *
   * @param name - Trailer name
   */
  toHaveTrailer(name: string): this;

  /**
   * Assert that the response has content (non-null data).
   */
  toHaveContent(): this;

  /**
   * Assert that the response body (for streaming) contains specific properties.
   *
   * @param subset - Expected properties
   */
  toHaveBodyContaining<T>(subset: Partial<T>): this;

  /**
   * Assert that the body matches a predicate.
   * The predicate should throw an error if the assertion fails.
   *
   * @param fn - Predicate function
   */
  toHaveBodyMatching(fn: (body: unknown) => void): this;

  /**
   * Assert that the response data contains specific properties.
   * Uses deep comparison with formatted diffs on mismatch.
   *
   * @param subset - Expected data properties
   */
  toHaveDataContaining<T>(subset: Partial<T>): this;

  /**
   * Assert that the response data matches a predicate function.
   * The predicate should throw an error if the assertion fails.
   *
   * @param fn - Predicate function
   */
  toHaveDataMatching(fn: (data: unknown) => void): this;

  /**
   * Assert that the request duration is less than a threshold.
   *
   * @param ms - Maximum duration in milliseconds
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Assert that the request duration is less than or equal to a threshold.
   *
   * @param ms - Maximum duration in milliseconds
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Assert that the request duration is greater than a threshold.
   *
   * @param ms - Minimum duration in milliseconds
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Assert that the request duration is greater than or equal to a threshold.
   *
   * @param ms - Minimum duration in milliseconds
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Creates an expectation for a gRPC response.
 *
 * @param response - gRPC response to test
 * @param negate - Whether to negate assertions (used internally by .not)
 * @returns Fluent expectation interface
 *
 * @example
 * ```ts
 * import { expectGrpcResponse } from "@probitas/expect/grpc";
 *
 * const response = await client.call("GetUser", { id: "1" });
 * expectGrpcResponse(response)
 *   .toBeSuccessful()
 *   .toHaveCode(0)
 *   .toHaveContent()
 *   .toHaveDataContaining({ id: "1", name: "Alice" });
 * ```
 */
export function expectGrpcResponse(
  response: GrpcResponse,
  negate = false,
): GrpcResponseExpectation {
  const self: GrpcResponseExpectation = {
    get not(): GrpcResponseExpectation {
      return expectGrpcResponse(response, !negate);
    },

    toBeSuccessful() {
      const isOk = response.ok;
      if (negate ? isOk : !isOk) {
        const code = response.code;
        const message = response.message ?? "";
        throw new Error(
          negate
            ? `Expected response to not be successful, but got code 0 (OK)`
            : `Expected response to be successful (code 0), but got code ${code}: ${message}`,
        );
      }
      return this;
    },

    toHaveCode(expected: number) {
      const matches = response.code === expected;
      if (negate ? matches : !matches) {
        throw new Error(
          negate
            ? `Expected code to not be ${expected}, but got ${response.code}`
            : `Expected code ${expected}, but got ${response.code}`,
        );
      }
      return this;
    },

    toHaveCodeOneOf(codes: number[]) {
      const matches = codes.includes(response.code);
      if (negate ? matches : !matches) {
        throw new Error(
          negate
            ? `Expected code to not be one of [${
              codes.join(", ")
            }], but got ${response.code}`
            : `Expected code to be one of [${
              codes.join(", ")
            }], but got ${response.code}`,
        );
      }
      return this;
    },

    toHaveMessage(expected: string) {
      const matches = response.message === expected;
      if (negate ? matches : !matches) {
        throw new Error(
          negate
            ? `Expected message to not be "${expected}", but got "${response.message}"`
            : `Expected message "${expected}", but got "${response.message}"`,
        );
      }
      return this;
    },

    toHaveMessageContaining(substring: string) {
      const message = response.message ?? "";
      const contains = message.includes(substring);
      if (negate ? contains : !contains) {
        throw new Error(
          negate
            ? `Expected message to not contain "${substring}", but got "${message}"`
            : `Expected message to contain "${substring}", but got "${message}"`,
        );
      }
      return this;
    },

    toHaveMessageMatching(pattern: RegExp) {
      const message = response.message ?? "";
      const matches = pattern.test(message);
      if (negate ? matches : !matches) {
        throw new Error(
          negate
            ? `Expected message to not match ${pattern}, but got "${message}"`
            : `Expected message to match ${pattern}, but got "${message}"`,
        );
      }
      return this;
    },

    toHaveTrailerValue(name: string, value: string) {
      const trailers = response.trailers as
        | Record<string, string>
        | undefined;
      const matches = trailers?.[name] === value;
      if (negate ? matches : !matches) {
        throw new Error(
          negate
            ? `Expected trailer "${name}" to not be "${value}", but got "${
              trailers?.[name]
            }"`
            : `Expected trailer "${name}" to be "${value}", but got "${
              trailers?.[name]
            }"`,
        );
      }
      return this;
    },

    toHaveTrailer(name: string) {
      const trailers = response.trailers as
        | Record<string, string>
        | undefined;
      const exists = trailers && (name in trailers);
      if (negate ? exists : !exists) {
        throw new Error(
          negate
            ? `Expected trailer "${name}" to not exist, but it was present`
            : `Expected trailer "${name}" to exist, but it was missing`,
        );
      }
      return this;
    },

    toHaveContent() {
      const data = response.data();
      const hasContent = data !== null && data !== undefined;
      if (negate ? hasContent : !hasContent) {
        throw new Error(
          negate
            ? `Expected response to not have content, but got: ${
              JSON.stringify(data)
            }`
            : `Expected response to have content, but data is ${
              data === null ? "null" : "undefined"
            }`,
        );
      }
      return this;
    },

    toHaveBodyContaining<T>(subset: Partial<T>) {
      const data = response.data();
      const contains = containsSubset(data, subset);

      if (negate ? contains : !contains) {
        const diffs = formatDifferences(data, subset);
        const message = negate
          ? `Expected body to not contain ${JSON.stringify(subset)}, but it did`
          : buildErrorMessage(
            "toHaveBodyContaining",
            diffs,
            subset,
            data,
          );
        throw new Error(message);
      }

      return this;
    },

    toHaveBodyMatching(fn: (body: unknown) => void) {
      const data = response.data();
      try {
        fn(data);
        if (negate) {
          throw new Error(
            `Expected body to not match predicate, but it did. Body: ${
              JSON.stringify(data)
            }`,
          );
        }
      } catch (error) {
        if (negate) {
          return this;
        }
        throw new Error(
          `Body does not match predicate. Body: ${
            JSON.stringify(data)
          }. Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      return this;
    },

    toHaveDataContaining<T>(subset: Partial<T>) {
      const data = response.data();
      const contains = containsSubset(data, subset);

      if (negate ? contains : !contains) {
        const diffs = formatDifferences(data, subset);
        const message = negate
          ? `Expected data to not contain ${JSON.stringify(subset)}, but it did`
          : buildErrorMessage(
            "toHaveDataContaining",
            diffs,
            subset,
            data,
          );
        throw new Error(message);
      }

      return this;
    },

    toHaveDataMatching(fn: (data: unknown) => void) {
      const data = response.data();
      try {
        fn(data);
        if (negate) {
          throw new Error(
            `Expected data to not match predicate, but it did. Data: ${
              JSON.stringify(data)
            }`,
          );
        }
      } catch (error) {
        if (negate) {
          return this;
        }
        throw new Error(
          `Data does not match predicate. Data: ${
            JSON.stringify(data)
          }. Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      return this;
    },

    ...createDurationMethods(response.duration, negate),
  };

  return self;
}

// Re-export types for convenience
export type { GrpcResponse };
