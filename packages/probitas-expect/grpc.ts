/**
 * gRPC response expectation implementation.
 *
 * This module provides fluent assertion methods for gRPC responses from
 * @probitas/client-grpc. It uses common utilities for formatting and diffing.
 *
 * @module
 */

import type { GrpcResponse } from "@probitas/client-grpc";
import { assertEquals, assertMatch } from "@std/assert";
import { buildErrorMessage, formatDifferences } from "./common.ts";

/**
 * Fluent expectation interface for gRPC responses.
 */
export interface GrpcResponseExpectation {
  /**
   * Assert that the response is successful (status code 0/OK).
   */
  ok(): this;

  /**
   * Assert that the response is not successful (non-zero status code).
   */
  notOk(): this;

  /**
   * Assert that the response has a specific status code.
   *
   * @param expected - Expected gRPC status code
   */
  code(expected: number): this;

  /**
   * Assert that the response status code is one of the specified codes.
   *
   * @param codes - Array of acceptable status codes
   */
  codeIn(codes: number[]): this;

  /**
   * Assert that the response has a specific status message.
   *
   * @param expected - Expected status message
   */
  message(expected: string): this;

  /**
   * Assert that the status message contains a substring.
   *
   * @param substring - Expected substring
   */
  messageContains(substring: string): this;

  /**
   * Assert that the status message matches a pattern.
   *
   * @param pattern - RegExp pattern
   */
  messageMatch(pattern: RegExp): this;

  /**
   * Assert that a specific trailer exists.
   *
   * @param name - Trailer name
   * @param value - Expected trailer value
   */
  trailers(name: string, value: string): this;

  /**
   * Assert that a specific trailer exists.
   *
   * @param name - Trailer name
   */
  trailersExist(name: string): this;

  /**
   * Assert that the response has no content (null data).
   */
  noContent(): this;

  /**
   * Assert that the response has content (non-null data).
   */
  hasContent(): this;

  /**
   * Assert that the response body (for streaming) contains specific properties.
   *
   * @param subset - Expected properties
   */
  bodyContains<T>(subset: Partial<T>): this;

  /**
   * Assert that the body matches a predicate.
   *
   * @param fn - Predicate function
   */
  bodyMatch(fn: (body: unknown) => boolean): this;

  /**
   * Assert that the response data contains specific properties.
   * Uses deep comparison with formatted diffs on mismatch.
   *
   * @param subset - Expected data properties
   */
  dataContains<T>(subset: Partial<T>): this;

  /**
   * Assert that the response data matches a predicate function.
   *
   * @param fn - Predicate function
   */
  dataMatch(fn: (data: unknown) => boolean): this;

  /**
   * Assert that the request duration is less than a threshold.
   *
   * @param ms - Maximum duration in milliseconds
   */
  durationLessThan(ms: number): this;
}

/**
 * Implementation of GrpcResponseExpectation.
 */
class GrpcResponseExpectationImpl implements GrpcResponseExpectation {
  #response: GrpcResponse;

  constructor(response: GrpcResponse) {
    this.#response = response;
  }

  ok(): this {
    if (!this.#response.ok) {
      const code = this.#response.code;
      const message = this.#response.message ?? "";
      throw new Error(
        `Expected response to be ok (code 0), but got code ${code}: ${message}`,
      );
    }
    return this;
  }

  notOk(): this {
    if (this.#response.ok) {
      throw new Error(
        `Expected response to not be ok, but got code 0 (OK)`,
      );
    }
    return this;
  }

  code(expected: number): this {
    if (this.#response.code !== expected) {
      throw new Error(
        `Expected code ${expected}, but got ${this.#response.code}`,
      );
    }
    return this;
  }

  codeIn(codes: number[]): this {
    if (!codes.includes(this.#response.code)) {
      throw new Error(
        `Expected code to be one of [${
          codes.join(", ")
        }], but got ${this.#response.code}`,
      );
    }
    return this;
  }

  message(expected: string): this {
    if (this.#response.message !== expected) {
      throw new Error(
        `Expected message "${expected}", but got "${this.#response.message}"`,
      );
    }
    return this;
  }

  messageContains(substring: string): this {
    const message = this.#response.message ?? "";
    if (!message.includes(substring)) {
      throw new Error(
        `Expected message to contain "${substring}", but got "${message}"`,
      );
    }
    return this;
  }

  messageMatch(pattern: RegExp): this {
    const message = this.#response.message ?? "";
    assertMatch(message, pattern, "Message does not match pattern");
    return this;
  }

  trailers(name: string, value: string): this {
    const trailers = this.#response.trailers as
      | Record<string, string>
      | undefined;
    if (!trailers || trailers[name] !== value) {
      throw new Error(
        `Expected trailer "${name}" to be "${value}", but got "${
          trailers?.[name]
        }"`,
      );
    }
    return this;
  }

  trailersExist(name: string): this {
    const trailers = this.#response.trailers as
      | Record<string, string>
      | undefined;
    if (!trailers || !(name in trailers)) {
      throw new Error(
        `Expected trailer "${name}" to exist, but it was missing`,
      );
    }
    return this;
  }

  noContent(): this {
    const data = this.#response.data();
    if (data !== null && data !== undefined) {
      throw new Error(
        `Expected no content, but got: ${JSON.stringify(data)}`,
      );
    }
    return this;
  }

  hasContent(): this {
    const data = this.#response.data();
    if (data === null || data === undefined) {
      throw new Error(
        `Expected response to have content, but data is ${
          data === null ? "null" : "undefined"
        }`,
      );
    }
    return this;
  }

  bodyContains<T>(subset: Partial<T>): this {
    const data = this.#response.data();

    try {
      assertEquals(
        data,
        subset,
        "Response body does not contain expected properties",
      );
    } catch (_error) {
      const diffs = formatDifferences(data, subset);
      const message = buildErrorMessage(
        "bodyContains",
        diffs,
        subset,
        data,
      );
      throw new Error(message);
    }

    return this;
  }

  bodyMatch(fn: (body: unknown) => boolean): this {
    const data = this.#response.data();
    if (!fn(data)) {
      throw new Error(
        `Body does not match predicate. Body: ${JSON.stringify(data)}`,
      );
    }
    return this;
  }

  dataContains<T>(subset: Partial<T>): this {
    const data = this.#response.data();

    try {
      assertEquals(
        data,
        subset,
        "Response data does not contain expected properties",
      );
    } catch (_error) {
      const diffs = formatDifferences(data, subset);
      const message = buildErrorMessage(
        "dataContains",
        diffs,
        subset,
        data,
      );
      throw new Error(message);
    }

    return this;
  }

  dataMatch(fn: (data: unknown) => boolean): this {
    const data = this.#response.data();
    if (!fn(data)) {
      throw new Error(
        `Data does not match predicate. Data: ${JSON.stringify(data)}`,
      );
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#response.duration >= ms) {
      throw new Error(
        `Expected duration less than ${ms}ms, but got ${this.#response.duration}ms`,
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
 *   .ok()
 *   .code(0)
 *   .hasContent()
 *   .dataContains({ id: "1", name: "Alice" });
 * ```
 */
export function expectGrpcResponse(
  response: GrpcResponse,
): GrpcResponseExpectation {
  return new GrpcResponseExpectationImpl(response);
}

// Re-export types for convenience
export type { GrpcResponse };
