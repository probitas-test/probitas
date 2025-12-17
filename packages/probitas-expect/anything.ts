/**
 * Chainable wrapper for @std/expect matchers.
 *
 * This module provides a chainable interface around @std/expect, allowing
 * method chaining for better readability in scenario-based tests.
 *
 * @module
 */

import { expect as expectStd, type Expected } from "@std/expect";

/**
 * Chainable expectation interface for any value using @std/expect matchers.
 *
 * Unlike @std/expect which returns void from matchers, this interface returns
 * `this` to enable method chaining.
 */
export interface AnythingExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(42).not.toBe(43);
   * expectAnything("hello").not.toBeNull();
   * ```
   */
  readonly not: this;

  // Common matchers

  /**
   * Asserts that the value is strictly equal (`===`) to the expected value.
   *
   * @param expected - The expected value
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(42).toBe(42);
   * expectAnything("hello").toBe("hello");
   * ```
   */
  toBe(expected: unknown): this;

  /**
   * Asserts that the value is deeply equal to the expected value.
   *
   * @param expected - The expected value
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything({ a: 1 }).toEqual({ a: 1 });
   * expectAnything([1, 2, 3]).toEqual([1, 2, 3]);
   * ```
   */
  toEqual(expected: unknown): this;

  /**
   * Asserts that the value is strictly deeply equal to the expected value.
   * Unlike {@linkcode toEqual}, this checks object types and `undefined` properties.
   *
   * @param expected - The expected value
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything({ a: 1 }).toStrictEqual({ a: 1 });
   * ```
   */
  toStrictEqual(expected: unknown): this;

  /**
   * Asserts that the string matches the expected pattern.
   *
   * @param expected - A string or RegExp pattern
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything("hello world").toMatch(/world/);
   * expectAnything("hello world").toMatch(/^hello/);
   * ```
   */
  toMatch(expected: string | RegExp): this;

  /**
   * Asserts that the object matches a subset of properties.
   *
   * @param expected - An object containing expected properties
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything({ a: 1, b: 2 }).toMatchObject({ a: 1 });
   * ```
   */
  toMatchObject(expected: Record<string, unknown>): this;

  /**
   * Asserts that the value is not `undefined`.
   *
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(42).toBeDefined();
   * expectAnything("hello").toBeDefined();
   * ```
   */
  toBeDefined(): this;

  /**
   * Asserts that the value is `undefined`.
   *
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(undefined).toBeUndefined();
   * ```
   */
  toBeUndefined(): this;

  /**
   * Asserts that the value is `null`.
   *
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(null).toBeNull();
   * ```
   */
  toBeNull(): this;

  /**
   * Asserts that the value is `NaN`.
   *
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(NaN).toBeNaN();
   * ```
   */
  toBeNaN(): this;

  /**
   * Asserts that the value is truthy (not `false`, `0`, `""`, `null`, `undefined`, or `NaN`).
   *
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(1).toBeTruthy();
   * expectAnything("hello").toBeTruthy();
   * ```
   */
  toBeTruthy(): this;

  /**
   * Asserts that the value is falsy (`false`, `0`, `""`, `null`, `undefined`, or `NaN`).
   *
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(0).toBeFalsy();
   * expectAnything("").toBeFalsy();
   * ```
   */
  toBeFalsy(): this;

  /**
   * Asserts that an array or string contains the expected item or substring.
   *
   * @param expected - The item or substring to check for
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything([1, 2, 3]).toContain(2);
   * expectAnything("hello").toContain("ell");
   * ```
   */
  toContain(expected: unknown): this;

  /**
   * Asserts that an array contains an item equal to the expected value.
   *
   * @param expected - The item to check for equality
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything([{ a: 1 }, { b: 2 }]).toContainEqual({ a: 1 });
   * ```
   */
  toContainEqual(expected: unknown): this;

  /**
   * Asserts that the array or string has the expected length.
   *
   * @param expected - The expected length
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything([1, 2, 3]).toHaveLength(3);
   * expectAnything("hello").toHaveLength(5);
   * ```
   */
  toHaveLength(expected: number): this;

  /**
   * Asserts that the number is greater than the expected value.
   *
   * @param expected - The value to compare against
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(10).toBeGreaterThan(5);
   * ```
   */
  toBeGreaterThan(expected: number): this;

  /**
   * Asserts that the number is greater than or equal to the expected value.
   *
   * @param expected - The value to compare against
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(10).toBeGreaterThanOrEqual(10);
   * ```
   */
  toBeGreaterThanOrEqual(expected: number): this;

  /**
   * Asserts that the number is less than the expected value.
   *
   * @param expected - The value to compare against
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(5).toBeLessThan(10);
   * ```
   */
  toBeLessThan(expected: number): this;

  /**
   * Asserts that the number is less than or equal to the expected value.
   *
   * @param expected - The value to compare against
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(10).toBeLessThanOrEqual(10);
   * ```
   */
  toBeLessThanOrEqual(expected: number): this;

  /**
   * Asserts that the number is close to the expected value within a certain precision.
   *
   * @param expected - The expected value
   * @param numDigits - Number of decimal digits to check (default: 2)
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(0.1 + 0.2).toBeCloseTo(0.3);
   * expectAnything(0.123).toBeCloseTo(0.12, 2);
   * ```
   */
  toBeCloseTo(expected: number, numDigits?: number): this;

  /**
   * Asserts that the value is an instance of the expected class.
   *
   * @param expected - The expected constructor/class
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(new Date()).toBeInstanceOf(Date);
   * expectAnything(new Error("oops")).toBeInstanceOf(Error);
   * ```
   */
  // deno-lint-ignore no-explicit-any
  toBeInstanceOf(expected: new (...args: any[]) => any): this;

  /**
   * Asserts that a function throws an error matching the expected pattern.
   *
   * @param expected - Optional string, RegExp, or Error to match
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything(() => { throw new Error("oops"); }).toThrow("oops");
   * expectAnything(() => { throw new Error("oops"); }).toThrow(/oops/);
   * ```
   */
  toThrow(expected?: string | RegExp | Error): this;

  /**
   * Asserts that the object has a property at the specified path.
   *
   * @param keyPath - The property path (string or array of strings)
   * @param expectedValue - Optional expected value at the path
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   *
   * expectAnything({ a: { b: 1 } }).toHaveProperty("a.b");
   * expectAnything({ a: { b: 1 } }).toHaveProperty(["a", "b"], 1);
   * ```
   */
  toHaveProperty(
    keyPath: string | string[],
    expectedValue?: unknown,
  ): this;

  // Mock related matchers

  /**
   * Asserts that a mock function was called at least once.
   *
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   * import { fn } from "@std/expect";
   *
   * const mock = fn();
   * mock();
   * expectAnything(mock).toHaveBeenCalled();
   * ```
   */
  toHaveBeenCalled(): this;

  /**
   * Asserts that a mock function was called exactly the specified number of times.
   *
   * @param expected - The expected number of calls
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   * import { fn } from "@std/expect";
   *
   * const mock = fn();
   * mock(); mock();
   * expectAnything(mock).toHaveBeenCalledTimes(2);
   * ```
   */
  toHaveBeenCalledTimes(expected: number): this;

  /**
   * Asserts that a mock function was called with the specified arguments.
   *
   * @param expected - The expected arguments
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   * import { fn } from "@std/expect";
   *
   * const mock = fn();
   * mock("hello", 42);
   * expectAnything(mock).toHaveBeenCalledWith("hello", 42);
   * ```
   */
  toHaveBeenCalledWith(...expected: unknown[]): this;

  /**
   * Asserts that a mock function was last called with the specified arguments.
   *
   * @param expected - The expected arguments
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   * import { fn } from "@std/expect";
   *
   * const mock = fn();
   * mock("first"); mock("last");
   * expectAnything(mock).toHaveBeenLastCalledWith("last");
   * ```
   */
  toHaveBeenLastCalledWith(...expected: unknown[]): this;

  /**
   * Asserts that the nth call of a mock function was with the specified arguments.
   *
   * @param n - The call index (1-based)
   * @param expected - The expected arguments
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   * import { fn } from "@std/expect";
   *
   * const mock = fn();
   * mock("first"); mock("second");
   * expectAnything(mock).toHaveBeenNthCalledWith(1, "first");
   * ```
   */
  toHaveBeenNthCalledWith(n: number, ...expected: unknown[]): this;

  /**
   * Asserts that a mock function returned successfully at least once.
   *
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   * import { fn } from "@std/expect";
   *
   * const mock = fn(() => 42);
   * mock();
   * expectAnything(mock).toHaveReturned();
   * ```
   */
  toHaveReturned(): this;

  /**
   * Asserts that a mock function returned successfully the specified number of times.
   *
   * @param expected - The expected number of successful returns
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   * import { fn } from "@std/expect";
   *
   * const mock = fn(() => 42);
   * mock(); mock();
   * expectAnything(mock).toHaveReturnedTimes(2);
   * ```
   */
  toHaveReturnedTimes(expected: number): this;

  /**
   * Asserts that a mock function returned the specified value at least once.
   *
   * @param expected - The expected return value
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   * import { fn } from "@std/expect";
   *
   * const mock = fn(() => 42);
   * mock();
   * expectAnything(mock).toHaveReturnedWith(42);
   * ```
   */
  toHaveReturnedWith(expected: unknown): this;

  /**
   * Asserts that a mock function last returned the specified value.
   *
   * @param expected - The expected return value
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   * import { fn } from "@std/expect";
   *
   * const mock = fn(() => 42);
   * mock();
   * expectAnything(mock).toHaveLastReturnedWith(42);
   * ```
   */
  toHaveLastReturnedWith(expected: unknown): this;

  /**
   * Asserts that the nth call of a mock function returned the specified value.
   *
   * @param n - The call index (1-based)
   * @param expected - The expected return value
   * @example
   * ```ts
   * import { expectAnything } from "./anything.ts";
   * import { fn } from "@std/expect";
   *
   * const mock = fn((x: number) => x * 2);
   * mock(1); mock(2);
   * expectAnything(mock).toHaveNthReturnedWith(2, 4);
   * ```
   */
  toHaveNthReturnedWith(n: number, expected: unknown): this;
}

/**
 * Creates a chainable expectation for any value using @std/expect matchers.
 *
 * This wrapper allows method chaining, unlike @std/expect which returns void.
 *
 * @param value - Value to test
 * @param negate - Whether to negate assertions (used internally by .not)
 * @returns Chainable expectation interface
 *
 * @example
 * ```ts
 * import { expectAnything } from "@probitas/expect";
 *
 * // Method chaining
 * expectAnything(42)
 *   .toBeDefined()
 *   .toBeGreaterThan(40)
 *   .toBeLessThan(50);
 *
 * // Negation with continued chaining
 * expectAnything("hello")
 *   .not.toBe("world")
 *   .not.toBeNull()
 *   .toContain("ello");
 * ```
 */
export function expectAnything<T>(
  value: T,
): AnythingExpectation {
  // State to track whether the next method call should be negated
  const state = { nextNegate: false };

  // Getter function that returns and consumes the negation flag
  const getNegate = () => {
    const result = state.nextNegate;
    state.nextNegate = false; // Reset after consumption
    return result;
  };

  // Helper to apply negation to @std/expect
  const getExpect = (negate: boolean) => {
    const originalExpect = expectStd(value);
    return negate
      ? (originalExpect as unknown as Record<string, Expected<false>>).not
      : originalExpect;
  };

  const self: AnythingExpectation = {
    get not(): AnythingExpectation {
      // Toggle the negation flag for the next method call
      state.nextNegate = !state.nextNegate;
      return self; // Return the same object
    },

    // Common matchers
    toBe(expected: unknown) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBe(expected);
      return self;
    },

    toEqual(expected: unknown) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toEqual(expected);
      return self;
    },

    toStrictEqual(expected: unknown) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toStrictEqual(expected);
      return self;
    },

    toMatch(expected: string | RegExp) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toMatch(expected);
      return self;
    },

    toMatchObject(expected: Record<string, unknown>) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toMatchObject(expected);
      return self;
    },

    toBeDefined() {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeDefined();
      return self;
    },

    toBeUndefined() {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeUndefined();
      return self;
    },

    toBeNull() {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeNull();
      return self;
    },

    toBeNaN() {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeNaN();
      return self;
    },

    toBeTruthy() {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeTruthy();
      return self;
    },

    toBeFalsy() {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeFalsy();
      return self;
    },

    toContain(expected: unknown) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toContain(expected);
      return self;
    },

    toContainEqual(expected: unknown) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toContainEqual(expected);
      return self;
    },

    toHaveLength(expected: number) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveLength(expected);
      return self;
    },

    toBeGreaterThan(expected: number) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeGreaterThan(expected);
      return self;
    },

    toBeGreaterThanOrEqual(expected: number) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeGreaterThanOrEqual(expected);
      return self;
    },

    toBeLessThan(expected: number) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeLessThan(expected);
      return self;
    },

    toBeLessThanOrEqual(expected: number) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeLessThanOrEqual(expected);
      return self;
    },

    toBeCloseTo(expected: number, numDigits?: number) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeCloseTo(expected, numDigits);
      return self;
    },

    // deno-lint-ignore no-explicit-any
    toBeInstanceOf(expected: new (...args: any[]) => any) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeInstanceOf(expected);
      return self;
    },

    toThrow(expected?: string | RegExp | Error) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toThrow(expected);
      return self;
    },

    toHaveProperty(
      keyPath: string | string[],
      expectedValue?: unknown,
    ) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      if (expectedValue !== undefined) {
        (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
          .toHaveProperty(keyPath, expectedValue);
      } else {
        (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
          .toHaveProperty(keyPath);
      }
      return self;
    },

    // Mock related matchers
    toHaveBeenCalled() {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveBeenCalled();
      return self;
    },

    toHaveBeenCalledTimes(expected: number) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveBeenCalledTimes(expected);
      return self;
    },

    toHaveBeenCalledWith(...expected: unknown[]) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveBeenCalledWith(...expected);
      return self;
    },

    toHaveBeenLastCalledWith(...expected: unknown[]) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveBeenLastCalledWith(...expected);
      return self;
    },

    toHaveBeenNthCalledWith(n: number, ...expected: unknown[]) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveBeenNthCalledWith(n, ...expected);
      return self;
    },

    toHaveReturned() {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveReturned();
      return self;
    },

    toHaveReturnedTimes(expected: number) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveReturnedTimes(expected);
      return self;
    },

    toHaveReturnedWith(expected: unknown) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveReturnedWith(expected);
      return self;
    },

    toHaveLastReturnedWith(expected: unknown) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveLastReturnedWith(expected);
      return self;
    },

    toHaveNthReturnedWith(n: number, expected: unknown) {
      const negate = getNegate();
      const stdExpect = getExpect(negate);
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveNthReturnedWith(n, expected);
      return self;
    },
  };

  return self;
}
