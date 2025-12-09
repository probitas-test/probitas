/**
 * gRPC response expectation implementation.
 *
 * This module provides fluent assertion methods for gRPC responses from
 * @probitas/client-grpc. It uses common utilities for formatting and diffing.
 *
 * @module
 */

import type { GrpcResponse } from "@probitas/client-grpc";
import { assertEquals } from "@std/assert";
import { buildErrorMessage, formatDifferences } from "./common.ts";

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
 * Implementation of GrpcResponseExpectation.
 */
class GrpcResponseExpectationImpl implements GrpcResponseExpectation {
  #response: GrpcResponse;
  #negate: boolean;

  constructor(response: GrpcResponse, negate = false) {
    this.#response = response;
    this.#negate = negate;
  }

  get not(): this {
    return new GrpcResponseExpectationImpl(
      this.#response,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isOk = this.#response.ok;
    if (this.#negate ? isOk : !isOk) {
      const code = this.#response.code;
      const message = this.#response.message ?? "";
      throw new Error(
        this.#negate
          ? `Expected response to not be successful, but got code 0 (OK)`
          : `Expected response to be successful (code 0), but got code ${code}: ${message}`,
      );
    }
    return this;
  }

  toHaveCode(expected: number): this {
    const matches = this.#response.code === expected;
    if (this.#negate ? matches : !matches) {
      throw new Error(
        this.#negate
          ? `Expected code to not be ${expected}, but got ${this.#response.code}`
          : `Expected code ${expected}, but got ${this.#response.code}`,
      );
    }
    return this;
  }

  toHaveCodeOneOf(codes: number[]): this {
    const matches = codes.includes(this.#response.code);
    if (this.#negate ? matches : !matches) {
      throw new Error(
        this.#negate
          ? `Expected code to not be one of [${
            codes.join(", ")
          }], but got ${this.#response.code}`
          : `Expected code to be one of [${
            codes.join(", ")
          }], but got ${this.#response.code}`,
      );
    }
    return this;
  }

  toHaveMessage(expected: string): this {
    const matches = this.#response.message === expected;
    if (this.#negate ? matches : !matches) {
      throw new Error(
        this.#negate
          ? `Expected message to not be "${expected}", but got "${this.#response.message}"`
          : `Expected message "${expected}", but got "${this.#response.message}"`,
      );
    }
    return this;
  }

  toHaveMessageContaining(substring: string): this {
    const message = this.#response.message ?? "";
    const contains = message.includes(substring);
    if (this.#negate ? contains : !contains) {
      throw new Error(
        this.#negate
          ? `Expected message to not contain "${substring}", but got "${message}"`
          : `Expected message to contain "${substring}", but got "${message}"`,
      );
    }
    return this;
  }

  toHaveMessageMatching(pattern: RegExp): this {
    const message = this.#response.message ?? "";
    const matches = pattern.test(message);
    if (this.#negate ? matches : !matches) {
      throw new Error(
        this.#negate
          ? `Expected message to not match ${pattern}, but got "${message}"`
          : `Expected message to match ${pattern}, but got "${message}"`,
      );
    }
    return this;
  }

  toHaveTrailerValue(name: string, value: string): this {
    const trailers = this.#response.trailers as
      | Record<string, string>
      | undefined;
    const matches = trailers?.[name] === value;
    if (this.#negate ? matches : !matches) {
      throw new Error(
        this.#negate
          ? `Expected trailer "${name}" to not be "${value}", but got "${
            trailers?.[name]
          }"`
          : `Expected trailer "${name}" to be "${value}", but got "${
            trailers?.[name]
          }"`,
      );
    }
    return this;
  }

  toHaveTrailer(name: string): this {
    const trailers = this.#response.trailers as
      | Record<string, string>
      | undefined;
    const exists = trailers && (name in trailers);
    if (this.#negate ? exists : !exists) {
      throw new Error(
        this.#negate
          ? `Expected trailer "${name}" to not exist, but it was present`
          : `Expected trailer "${name}" to exist, but it was missing`,
      );
    }
    return this;
  }

  toHaveContent(): this {
    const data = this.#response.data();
    const hasContent = data !== null && data !== undefined;
    if (this.#negate ? hasContent : !hasContent) {
      throw new Error(
        this.#negate
          ? `Expected response to not have content, but got: ${
            JSON.stringify(data)
          }`
          : `Expected response to have content, but data is ${
            data === null ? "null" : "undefined"
          }`,
      );
    }
    return this;
  }

  toHaveBodyContaining<T>(subset: Partial<T>): this {
    const data = this.#response.data();

    try {
      assertEquals(
        data,
        subset,
        "Response body does not contain expected properties",
      );
      if (this.#negate) {
        throw new Error(
          `Expected body to not contain ${JSON.stringify(subset)}, but it did`,
        );
      }
    } catch (_error) {
      if (this.#negate) {
        return this;
      }
      const diffs = formatDifferences(data, subset);
      const message = buildErrorMessage(
        "toHaveBodyContaining",
        diffs,
        subset,
        data,
      );
      throw new Error(message);
    }

    return this;
  }

  toHaveBodyMatching(fn: (body: unknown) => void): this {
    const data = this.#response.data();
    try {
      fn(data);
      if (this.#negate) {
        throw new Error(
          `Expected body to not match predicate, but it did. Body: ${
            JSON.stringify(data)
          }`,
        );
      }
    } catch (error) {
      if (this.#negate) {
        return this;
      }
      throw new Error(
        `Body does not match predicate. Body: ${JSON.stringify(data)}. Error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return this;
  }

  toHaveDataContaining<T>(subset: Partial<T>): this {
    const data = this.#response.data();

    try {
      assertEquals(
        data,
        subset,
        "Response data does not contain expected properties",
      );
      if (this.#negate) {
        throw new Error(
          `Expected data to not contain ${JSON.stringify(subset)}, but it did`,
        );
      }
    } catch (_error) {
      if (this.#negate) {
        return this;
      }
      const diffs = formatDifferences(data, subset);
      const message = buildErrorMessage(
        "toHaveDataContaining",
        diffs,
        subset,
        data,
      );
      throw new Error(message);
    }

    return this;
  }

  toHaveDataMatching(fn: (data: unknown) => void): this {
    const data = this.#response.data();
    try {
      fn(data);
      if (this.#negate) {
        throw new Error(
          `Expected data to not match predicate, but it did. Data: ${
            JSON.stringify(data)
          }`,
        );
      }
    } catch (error) {
      if (this.#negate) {
        return this;
      }
      throw new Error(
        `Data does not match predicate. Data: ${JSON.stringify(data)}. Error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    const isLess = this.#response.duration < ms;
    if (this.#negate ? isLess : !isLess) {
      throw new Error(
        this.#negate
          ? `Expected duration to not be less than ${ms}ms, but got ${this.#response.duration}ms`
          : `Expected duration less than ${ms}ms, but got ${this.#response.duration}ms`,
      );
    }
    return this;
  }

  toHaveDurationLessThanOrEqual(ms: number): this {
    const isLessOrEqual = this.#response.duration <= ms;
    if (this.#negate ? isLessOrEqual : !isLessOrEqual) {
      throw new Error(
        this.#negate
          ? `Expected duration to not be <= ${ms}ms, but got ${this.#response.duration}ms`
          : `Expected duration <= ${ms}ms, but got ${this.#response.duration}ms`,
      );
    }
    return this;
  }

  toHaveDurationGreaterThan(ms: number): this {
    const isGreater = this.#response.duration > ms;
    if (this.#negate ? isGreater : !isGreater) {
      throw new Error(
        this.#negate
          ? `Expected duration to not be > ${ms}ms, but got ${this.#response.duration}ms`
          : `Expected duration > ${ms}ms, but got ${this.#response.duration}ms`,
      );
    }
    return this;
  }

  toHaveDurationGreaterThanOrEqual(ms: number): this {
    const isGreaterOrEqual = this.#response.duration >= ms;
    if (this.#negate ? isGreaterOrEqual : !isGreaterOrEqual) {
      throw new Error(
        this.#negate
          ? `Expected duration to not be >= ${ms}ms, but got ${this.#response.duration}ms`
          : `Expected duration >= ${ms}ms, but got ${this.#response.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Creates an expectation for a gRPC response.
 *
 * @param response - gRPC response to test
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
): GrpcResponseExpectation {
  return new GrpcResponseExpectationImpl(response);
}

// Re-export types for convenience
export type { GrpcResponse };
