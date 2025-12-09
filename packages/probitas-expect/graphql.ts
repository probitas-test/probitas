import { buildDurationError, containsSubset } from "./common.ts";
import type {
  GraphqlErrorItem,
  GraphqlResponse,
} from "@probitas/client-graphql";

/**
 * Fluent API for GraphQL response validation.
 */
export interface GraphqlResponseExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that response has no errors */
  toBeSuccessful(): this;

  /** Assert exact number of errors */
  toHaveErrorCount(n: number): this;

  /** Assert that error count is greater than specified value */
  toHaveErrorCountGreaterThan(count: number): this;

  /** Assert that error count is greater than or equal to specified value */
  toHaveErrorCountGreaterThanOrEqual(count: number): this;

  /** Assert that error count is less than specified value */
  toHaveErrorCountLessThan(count: number): this;

  /** Assert that error count is less than or equal to specified value */
  toHaveErrorCountLessThanOrEqual(count: number): this;

  /** Assert that at least one error contains the message */
  toHaveErrorContaining(message: string): this;

  /** Assert that at least one error message matches the string or regex */
  toHaveError(messageMatcher: string | RegExp): this;

  /** Assert errors using custom matcher */
  toHaveErrorMatching(
    matcher: (errors: readonly GraphqlErrorItem[]) => void,
  ): this;

  /** Assert that data is not null */
  toHaveContent(): this;

  /** Assert that data contains expected subset (deep partial match) */
  // deno-lint-ignore no-explicit-any
  toMatchObject<T = any>(subset: Partial<T>): this;

  /** Assert data using custom matcher */
  // deno-lint-ignore no-explicit-any
  toSatisfy<T = any>(matcher: (data: T) => void): this;

  /** Assert that an extension key exists */
  toHaveExtension(key: string): this;

  /** Assert extension using custom matcher */
  toHaveExtensionMatching(key: string, matcher: (value: unknown) => void): this;

  /** Assert HTTP status code */
  toHaveStatus(code: number): this;

  /** Assert that HTTP status code is one of the given codes */
  toHaveStatusOneOf(statuses: number[]): this;

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
 * GraphqlResponseExpectation implementation.
 */
class GraphqlResponseExpectationImpl implements GraphqlResponseExpectation {
  readonly #response: GraphqlResponse;
  readonly #negate: boolean;

  constructor(response: GraphqlResponse, negate = false) {
    this.#response = response;
    this.#negate = negate;
  }

  get not(): this {
    return new GraphqlResponseExpectationImpl(
      this.#response,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#response.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      const errorMessages = this.#response.errors
        ?.map((e) => e.message)
        .join("; ");
      throw new Error(
        this.#negate
          ? "Expected response with errors, but got successful response"
          : `Expected successful response, got errors: ${errorMessages}`,
      );
    }
    return this;
  }

  toHaveErrorCount(n: number): this {
    const actual = this.#response.errors?.length ?? 0;
    if (actual !== n) {
      throw new Error(`Expected ${n} errors, got ${actual}`);
    }
    return this;
  }

  toHaveErrorCountGreaterThan(count: number): this {
    const actual = this.#response.errors?.length ?? 0;
    if (actual <= count) {
      throw new Error(`Expected error count > ${count}, but got ${actual}`);
    }
    return this;
  }

  toHaveErrorCountGreaterThanOrEqual(count: number): this {
    const actual = this.#response.errors?.length ?? 0;
    if (actual < count) {
      throw new Error(
        `Expected error count >= ${count}, but got ${actual}`,
      );
    }
    return this;
  }

  toHaveErrorCountLessThan(count: number): this {
    const actual = this.#response.errors?.length ?? 0;
    if (actual >= count) {
      throw new Error(`Expected error count < ${count}, but got ${actual}`);
    }
    return this;
  }

  toHaveErrorCountLessThanOrEqual(count: number): this {
    const actual = this.#response.errors?.length ?? 0;
    if (actual > count) {
      throw new Error(
        `Expected error count <= ${count}, but got ${actual}`,
      );
    }
    return this;
  }

  toHaveErrorContaining(message: string): this {
    if (!this.#response.errors || this.#response.errors.length === 0) {
      throw new Error(
        `Expected an error containing "${message}", but no errors present`,
      );
    }
    const found = this.#response.errors.some((e) =>
      e.message.includes(message)
    );
    if (!found) {
      throw new Error(
        `Expected an error containing "${message}", but none found`,
      );
    }
    return this;
  }

  toHaveError(messageMatcher: string | RegExp): this {
    if (!this.#response.errors || this.#response.errors.length === 0) {
      throw new Error(
        `Expected an error matching "${messageMatcher}", but no errors present`,
      );
    }
    const found = this.#response.errors.some((e) => {
      if (typeof messageMatcher === "string") {
        return e.message.includes(messageMatcher);
      }
      return messageMatcher.test(e.message);
    });
    if (!found) {
      throw new Error(
        `Expected an error matching "${messageMatcher}", but none found`,
      );
    }
    return this;
  }

  toHaveErrorMatching(
    matcher: (errors: readonly GraphqlErrorItem[]) => void,
  ): this {
    if (!this.#response.errors) {
      throw new Error("Cannot match errors: no errors present");
    }
    matcher(this.#response.errors);
    return this;
  }

  toHaveContent(): this {
    if (this.#response.data() === null) {
      throw new Error("Expected content, but data is null");
    }
    return this;
  }

  // deno-lint-ignore no-explicit-any
  toMatchObject<T = any>(subset: Partial<T>): this {
    const data = this.#response.data();
    if (data === null) {
      throw new Error("Expected data to contain subset, but data is null");
    }
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
    const data = this.#response.data();
    if (data === null) {
      throw new Error("Cannot match data: data is null");
    }
    matcher(data as T);
    return this;
  }

  toHaveExtension(key: string): this {
    if (!this.#response.extensions || !(key in this.#response.extensions)) {
      throw new Error(`Expected extension "${key}" to exist`);
    }
    return this;
  }

  toHaveExtensionMatching(
    key: string,
    matcher: (value: unknown) => void,
  ): this {
    if (!this.#response.extensions || !(key in this.#response.extensions)) {
      throw new Error(`Extension "${key}" not found`);
    }
    matcher(this.#response.extensions[key]);
    return this;
  }

  toHaveStatus(code: number): this {
    if (this.#response.status !== code) {
      throw new Error(
        `Expected status ${code}, got ${this.#response.status}`,
      );
    }
    return this;
  }

  toHaveStatusOneOf(statuses: number[]): this {
    if (!statuses.includes(this.#response.status)) {
      throw new Error(
        `Expected status in [${
          statuses.join(", ")
        }], got ${this.#response.status}`,
      );
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#response.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#response.duration));
    }
    return this;
  }

  toHaveDurationLessThanOrEqual(ms: number): this {
    if (this.#response.duration > ms) {
      throw new Error(
        `Expected duration <= ${ms}ms, but got ${this.#response.duration}ms`,
      );
    }
    return this;
  }

  toHaveDurationGreaterThan(ms: number): this {
    if (this.#response.duration <= ms) {
      throw new Error(
        `Expected duration > ${ms}ms, but got ${this.#response.duration}ms`,
      );
    }
    return this;
  }

  toHaveDurationGreaterThanOrEqual(ms: number): this {
    if (this.#response.duration < ms) {
      throw new Error(
        `Expected duration >= ${ms}ms, but got ${this.#response.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Create a fluent expectation chain for GraphQL response validation.
 *
 * Returns an expectation object with chainable assertion methods.
 * Each assertion throws an Error if it fails, making it ideal for testing.
 *
 * @param response - The GraphQL response to validate
 * @returns A fluent expectation chain
 *
 * @example Basic assertions
 * ```ts
 * const response = await client.query(`
 *   query GetUser($id: ID!) {
 *     user(id: $id) { id name }
 *   }
 * `, { id: "123" });
 *
 * expectGraphqlResponse(response)
 *   .ok()
 *   .hasContent()
 *   .dataContains({ user: { name: "Alice" } });
 * ```
 *
 * @example Error assertions
 * ```ts
 * const response = await client.query(`
 *   query { invalidField }
 * `, undefined, { throwOnError: false });
 *
 * expectGraphqlResponse(response)
 *   .notOk()
 *   .errorContains("Cannot query field");
 * ```
 *
 * @example Mutation with custom matcher
 * ```ts
 * const response = await client.mutation(`
 *   mutation CreateUser($input: CreateUserInput!) {
 *     createUser(input: $input) { id name }
 *   }
 * `, { input: { name: "Bob" } });
 *
 * expectGraphqlResponse(response)
 *   .ok()
 *   .dataMatch((data) => {
 *     assertEquals(data.createUser.name, "Bob");
 *   });
 * ```
 *
 * @example Performance assertions
 * ```ts
 * expectGraphqlResponse(response)
 *   .ok()
 *   .durationLessThan(500);  // Must respond within 500ms
 * ```
 */
export function expectGraphqlResponse(
  response: GraphqlResponse,
): GraphqlResponseExpectation {
  return new GraphqlResponseExpectationImpl(response);
}
