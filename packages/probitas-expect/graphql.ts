import { containsSubset, createDurationMethods, getNonNull } from "./common.ts";
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
