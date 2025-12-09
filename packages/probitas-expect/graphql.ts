import { containsSubset, createDurationMethods, getNonNull } from "./common.ts";
import type {
  GraphqlErrorItem,
  GraphqlResponse,
} from "@probitas/client-graphql";

/**
 * Fluent API for GraphQL response validation.
 */
export interface GraphqlResponseExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectGraphqlResponse(response).not.toBeSuccessful();
   * expectGraphqlResponse(response).not.toHaveErrorCount(0);
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the response has no errors.
   *
   * @example
   * ```ts
   * expectGraphqlResponse(response).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts the exact number of errors in the response.
   *
   * @param n - The expected number of errors
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveErrorCount(0);
   * expectGraphqlResponse(response).toHaveErrorCount(1);
   * ```
   */
  toHaveErrorCount(n: number): this;

  /**
   * Asserts that the error count is greater than the specified value.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveErrorCountGreaterThan(0);
   * ```
   */
  toHaveErrorCountGreaterThan(count: number): this;

  /**
   * Asserts that the error count is greater than or equal to the specified value.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveErrorCountGreaterThanOrEqual(1);
   * ```
   */
  toHaveErrorCountGreaterThanOrEqual(count: number): this;

  /**
   * Asserts that the error count is less than the specified value.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveErrorCountLessThan(5);
   * ```
   */
  toHaveErrorCountLessThan(count: number): this;

  /**
   * Asserts that the error count is less than or equal to the specified value.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveErrorCountLessThanOrEqual(2);
   * ```
   */
  toHaveErrorCountLessThanOrEqual(count: number): this;

  /**
   * Asserts that at least one error message contains the specified substring.
   *
   * @param message - The substring to search for
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveErrorContaining("not found");
   * ```
   */
  toHaveErrorContaining(message: string): this;

  /**
   * Asserts that at least one error message matches the string or regex.
   *
   * @param messageMatcher - The string or pattern to match
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveError("User not found");
   * expectGraphqlResponse(response).toHaveError(/not found/i);
   * ```
   */
  toHaveError(messageMatcher: string | RegExp): this;

  /**
   * Asserts errors using a custom matcher function.
   *
   * @param matcher - Function that receives the errors array and should throw if invalid
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveErrorMatching((errors) => {
   *   assertEquals(errors[0].path, ["user", "email"]);
   * });
   * ```
   */
  toHaveErrorMatching(
    matcher: (errors: readonly GraphqlErrorItem[]) => void,
  ): this;

  /**
   * Asserts that the response data is not null.
   *
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveContent();
   * ```
   */
  toHaveContent(): this;

  /**
   * Asserts that the data contains the expected subset (deep partial match).
   *
   * @param subset - An object containing the expected properties
   * @example
   * ```ts
   * expectGraphqlResponse(response).toMatchObject({ user: { name: "Alice" } });
   * ```
   */
  // deno-lint-ignore no-explicit-any
  toMatchObject<T = any>(subset: Partial<T>): this;

  /**
   * Asserts the data using a custom matcher function.
   *
   * @param matcher - Function that receives the data and should throw if invalid
   * @example
   * ```ts
   * expectGraphqlResponse(response).toSatisfy((data) => {
   *   assertEquals(data.user.id, "123");
   * });
   * ```
   */
  // deno-lint-ignore no-explicit-any
  toSatisfy<T = any>(matcher: (data: T) => void): this;

  /**
   * Asserts that an extension key exists in the response.
   *
   * @param key - The extension key name
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveExtension("tracing");
   * ```
   */
  toHaveExtension(key: string): this;

  /**
   * Asserts an extension value using a custom matcher function.
   *
   * @param key - The extension key name
   * @param matcher - Function that receives the extension value and should throw if invalid
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveExtensionMatching("timing", (value) => {
   *   assertExists(value.duration);
   * });
   * ```
   */
  toHaveExtensionMatching(key: string, matcher: (value: unknown) => void): this;

  /**
   * Asserts the HTTP status code of the response.
   *
   * @param code - The expected HTTP status code
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveStatus(200);
   * ```
   */
  toHaveStatus(code: number): this;

  /**
   * Asserts that the HTTP status code is one of the given codes.
   *
   * @param statuses - Array of acceptable HTTP status codes
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveStatusOneOf([200, 201]);
   * ```
   */
  toHaveStatusOneOf(statuses: number[]): this;

  /**
   * Asserts that the response duration is less than the threshold.
   *
   * @param ms - Maximum duration in milliseconds
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveDurationLessThan(500);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the response duration is less than or equal to the threshold.
   *
   * @param ms - Maximum duration in milliseconds
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveDurationLessThanOrEqual(500);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the response duration is greater than the threshold.
   *
   * @param ms - Minimum duration in milliseconds
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveDurationGreaterThan(100);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the response duration is greater than or equal to the threshold.
   *
   * @param ms - Minimum duration in milliseconds
   * @example
   * ```ts
   * expectGraphqlResponse(response).toHaveDurationGreaterThanOrEqual(100);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Create a fluent expectation chain for GraphQL response validation.
 *
 * Returns an expectation object with chainable assertion methods.
 * Each assertion throws an Error if it fails, making it ideal for testing.
 *
 * @param response - The GraphQL response to validate
 * @param negate - Whether to negate assertions (used internally by .not)
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
 *   .toBeSuccessful()
 *   .toHaveContent()
 *   .toMatchObject({ user: { name: "Alice" } });
 * ```
 *
 * @example Error assertions
 * ```ts
 * const response = await client.query(`
 *   query { invalidField }
 * `, undefined, { throwOnError: false });
 *
 * expectGraphqlResponse(response)
 *   .not.toBeSuccessful()
 *   .toHaveErrorContaining("Cannot query field");
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
 *   .toBeSuccessful()
 *   .toSatisfy((data) => {
 *     assertEquals(data.createUser.name, "Bob");
 *   });
 * ```
 *
 * @example Performance assertions
 * ```ts
 * expectGraphqlResponse(response)
 *   .toBeSuccessful()
 *   .toHaveDurationLessThan(500);  // Must respond within 500ms
 * ```
 */
export function expectGraphqlResponse(
  response: GraphqlResponse,
  negate = false,
): GraphqlResponseExpectation {
  const self: GraphqlResponseExpectation = {
    get not(): GraphqlResponseExpectation {
      return expectGraphqlResponse(response, !negate);
    },

    toBeSuccessful() {
      const isSuccess = response.ok;
      if (negate ? isSuccess : !isSuccess) {
        const errorMessages = response.errors
          ?.map((e) => e.message)
          .join("; ");
        throw new Error(
          negate
            ? "Expected response with errors, but got successful response"
            : `Expected successful response, got errors: ${errorMessages}`,
        );
      }
      return this;
    },

    toHaveErrorCount(n: number) {
      const actual = response.errors?.length ?? 0;
      const match = actual === n;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected error count to not be ${n}, got ${actual}`
            : `Expected ${n} errors, got ${actual}`,
        );
      }
      return this;
    },

    toHaveErrorCountGreaterThan(count: number) {
      const actual = response.errors?.length ?? 0;
      const match = actual > count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected error count to not be > ${count}, got ${actual}`
            : `Expected error count > ${count}, but got ${actual}`,
        );
      }
      return this;
    },

    toHaveErrorCountGreaterThanOrEqual(count: number) {
      const actual = response.errors?.length ?? 0;
      const match = actual >= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected error count to not be >= ${count}, got ${actual}`
            : `Expected error count >= ${count}, but got ${actual}`,
        );
      }
      return this;
    },

    toHaveErrorCountLessThan(count: number) {
      const actual = response.errors?.length ?? 0;
      const match = actual < count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected error count to not be < ${count}, got ${actual}`
            : `Expected error count < ${count}, but got ${actual}`,
        );
      }
      return this;
    },

    toHaveErrorCountLessThanOrEqual(count: number) {
      const actual = response.errors?.length ?? 0;
      const match = actual <= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected error count to not be <= ${count}, got ${actual}`
            : `Expected error count <= ${count}, but got ${actual}`,
        );
      }
      return this;
    },

    toHaveErrorContaining(message: string) {
      if (!response.errors || response.errors.length === 0) {
        throw new Error(
          `Expected an error containing "${message}", but no errors present`,
        );
      }
      const found = response.errors.some((e) => e.message.includes(message));
      if (negate ? found : !found) {
        throw new Error(
          negate
            ? `Expected no error containing "${message}", but found one`
            : `Expected an error containing "${message}", but none found`,
        );
      }
      return this;
    },

    toHaveError(messageMatcher: string | RegExp) {
      if (!response.errors || response.errors.length === 0) {
        throw new Error(
          `Expected an error matching "${messageMatcher}", but no errors present`,
        );
      }
      const found = response.errors.some((e) => {
        if (typeof messageMatcher === "string") {
          return e.message.includes(messageMatcher);
        }
        return messageMatcher.test(e.message);
      });
      if (negate ? found : !found) {
        throw new Error(
          negate
            ? `Expected no error matching "${messageMatcher}", but found one`
            : `Expected an error matching "${messageMatcher}", but none found`,
        );
      }
      return this;
    },

    toHaveErrorMatching(
      matcher: (errors: readonly GraphqlErrorItem[]) => void,
    ) {
      const errors = getNonNull(response.errors, "errors");
      matcher(errors);
      return this;
    },

    toHaveContent() {
      const hasData = response.data() !== null;
      if (negate ? hasData : !hasData) {
        throw new Error(
          negate
            ? "Expected no content, but data is present"
            : "Expected content, but data is null",
        );
      }
      return this;
    },

    // deno-lint-ignore no-explicit-any
    toMatchObject<T = any>(subset: Partial<T>) {
      const data = getNonNull(response.data(), "data");
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
      const data = getNonNull(response.data(), "data") as T;
      matcher(data);
      return this;
    },

    toHaveExtension(key: string) {
      const exists = response.extensions && key in response.extensions;
      if (negate ? exists : !exists) {
        throw new Error(
          negate
            ? `Expected extension "${key}" to not exist`
            : `Expected extension "${key}" to exist`,
        );
      }
      return this;
    },

    toHaveExtensionMatching(key: string, matcher: (value: unknown) => void) {
      if (!response.extensions || !(key in response.extensions)) {
        throw new Error(`Extension "${key}" not found`);
      }
      matcher(response.extensions[key]);
      return this;
    },

    toHaveStatus(code: number) {
      const match = response.status === code;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected status to not be ${code}, got ${response.status}`
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
            ? `Expected status to not be in [${
              statuses.join(", ")
            }], got ${response.status}`
            : `Expected status in [${
              statuses.join(", ")
            }], got ${response.status}`,
        );
      }
      return this;
    },

    ...createDurationMethods(response.duration, negate),
  };

  return self;
}
