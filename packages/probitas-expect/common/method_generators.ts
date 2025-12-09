/**
 * Method generator functions for expect implementations.
 *
 * This module provides functions that generate assertion methods
 * which can be spread into expectation objects.
 *
 * @module
 */

import {
  buildCountError,
  buildDurationError,
  buildDurationGreaterThanError,
  buildDurationGreaterThanOrEqualError,
  buildDurationLessThanOrEqualError,
} from "./error_builders.ts";

/**
 * Creates duration assertion methods that can be spread into an expectation object.
 * Generates all four duration comparison methods.
 *
 * @param duration - The duration value to compare
 * @param negate - Whether to negate assertions (default: false)
 * @returns Object with toHaveDuration* methods
 *
 * @example
 * ```ts
 * export function expectHttpResponse(response: HttpResponse, negate = false) {
 *   const self = {
 *     toBeSuccessful() { ... },
 *     ...createDurationMethods(response.duration, negate),
 *   };
 *   return self;
 * }
 * ```
 */
export function createDurationMethods<T>(duration: number, negate = false) {
  return {
    toHaveDurationLessThan(this: T, ms: number): T {
      const passes = duration < ms;
      if (negate ? passes : !passes) {
        throw new Error(
          negate
            ? `Expected duration to not be < ${ms}ms, but got ${duration}ms`
            : buildDurationError(ms, duration),
        );
      }
      return this;
    },

    toHaveDurationLessThanOrEqual(this: T, ms: number): T {
      const passes = duration <= ms;
      if (negate ? passes : !passes) {
        throw new Error(
          negate
            ? `Expected duration to not be <= ${ms}ms, but got ${duration}ms`
            : buildDurationLessThanOrEqualError(ms, duration),
        );
      }
      return this;
    },

    toHaveDurationGreaterThan(this: T, ms: number): T {
      const passes = duration > ms;
      if (negate ? passes : !passes) {
        throw new Error(
          negate
            ? `Expected duration to not be > ${ms}ms, but got ${duration}ms`
            : buildDurationGreaterThanError(ms, duration),
        );
      }
      return this;
    },

    toHaveDurationGreaterThanOrEqual(this: T, ms: number): T {
      const passes = duration >= ms;
      if (negate ? passes : !passes) {
        throw new Error(
          negate
            ? `Expected duration to not be >= ${ms}ms, but got ${duration}ms`
            : buildDurationGreaterThanOrEqualError(ms, duration),
        );
      }
      return this;
    },
  };
}

/**
 * Creates count comparison methods for a specific count type.
 *
 * @param count - The count value to compare
 * @param countName - Name of the count (e.g., "successful count", "error count")
 * @returns Object with count comparison methods
 */
export function createCountMethods(count: number, countName: string) {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const methodBase = "toHave" + countName.split(" ").map(capitalize).join("");

  return {
    [methodBase](expected: number) {
      if (count !== expected) {
        throw new Error(buildCountError(expected, count, countName));
      }
      return this;
    },

    [`${methodBase}GreaterThan`](threshold: number) {
      if (count <= threshold) {
        throw new Error(
          `Expected ${countName} > ${threshold}, but got ${count}`,
        );
      }
      return this;
    },

    [`${methodBase}GreaterThanOrEqual`](threshold: number) {
      if (count < threshold) {
        throw new Error(
          `Expected ${countName} >= ${threshold}, but got ${count}`,
        );
      }
      return this;
    },

    [`${methodBase}LessThan`](threshold: number) {
      if (count >= threshold) {
        throw new Error(
          `Expected ${countName} < ${threshold}, but got ${count}`,
        );
      }
      return this;
    },

    [`${methodBase}LessThanOrEqual`](threshold: number) {
      if (count > threshold) {
        throw new Error(
          `Expected ${countName} <= ${threshold}, but got ${count}`,
        );
      }
      return this;
    },
  };
}
