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
   * expectAnything("hello world").toMatch(/world/);
   * expectAnything("hello").toMatch("ello");
   * ```
   */
  toMatch(expected: string | RegExp): this;

  /**
   * Asserts that the object matches a subset of properties.
   *
   * @param expected - An object containing expected properties
   * @example
   * ```ts
   * expectAnything({ a: 1, b: 2 }).toMatchObject({ a: 1 });
   * ```
   */
  toMatchObject(expected: Record<string, unknown>): this;

  /**
   * Asserts that the value is not `undefined`.
   *
   * @example
   * ```ts
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
   * expectAnything(undefined).toBeUndefined();
   * ```
   */
  toBeUndefined(): this;

  /**
   * Asserts that the value is `null`.
   *
   * @example
   * ```ts
   * expectAnything(null).toBeNull();
   * ```
   */
  toBeNull(): this;

  /**
   * Asserts that the value is `NaN`.
   *
   * @example
   * ```ts
   * expectAnything(NaN).toBeNaN();
   * ```
   */
  toBeNaN(): this;

  /**
   * Asserts that the value is truthy (not `false`, `0`, `""`, `null`, `undefined`, or `NaN`).
   *
   * @example
   * ```ts
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
   * const fn = mock.fn();
   * fn();
   * expectAnything(fn).toHaveBeenCalled();
   * ```
   */
  toHaveBeenCalled(): this;

  /**
   * Asserts that a mock function was called exactly the specified number of times.
   *
   * @param expected - The expected number of calls
   * @example
   * ```ts
   * const fn = mock.fn();
   * fn(); fn();
   * expectAnything(fn).toHaveBeenCalledTimes(2);
   * ```
   */
  toHaveBeenCalledTimes(expected: number): this;

  /**
   * Asserts that a mock function was called with the specified arguments.
   *
   * @param expected - The expected arguments
   * @example
   * ```ts
   * const fn = mock.fn();
   * fn("hello", 42);
   * expectAnything(fn).toHaveBeenCalledWith("hello", 42);
   * ```
   */
  toHaveBeenCalledWith(...expected: unknown[]): this;

  /**
   * Asserts that a mock function was last called with the specified arguments.
   *
   * @param expected - The expected arguments
   * @example
   * ```ts
   * const fn = mock.fn();
   * fn("first"); fn("last");
   * expectAnything(fn).toHaveBeenLastCalledWith("last");
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
   * const fn = mock.fn();
   * fn("first"); fn("second");
   * expectAnything(fn).toHaveBeenNthCalledWith(1, "first");
   * ```
   */
  toHaveBeenNthCalledWith(n: number, ...expected: unknown[]): this;

  /**
   * Asserts that a mock function returned successfully at least once.
   *
   * @example
   * ```ts
   * const fn = mock.fn(() => 42);
   * fn();
   * expectAnything(fn).toHaveReturned();
   * ```
   */
  toHaveReturned(): this;

  /**
   * Asserts that a mock function returned successfully the specified number of times.
   *
   * @param expected - The expected number of successful returns
   * @example
   * ```ts
   * const fn = mock.fn(() => 42);
   * fn(); fn();
   * expectAnything(fn).toHaveReturnedTimes(2);
   * ```
   */
  toHaveReturnedTimes(expected: number): this;

  /**
   * Asserts that a mock function returned the specified value at least once.
   *
   * @param expected - The expected return value
   * @example
   * ```ts
   * const fn = mock.fn(() => 42);
   * fn();
   * expectAnything(fn).toHaveReturnedWith(42);
   * ```
   */
  toHaveReturnedWith(expected: unknown): this;

  /**
   * Asserts that a mock function last returned the specified value.
   *
   * @param expected - The expected return value
   * @example
   * ```ts
   * const fn = mock.fn(() => 42);
   * fn();
   * expectAnything(fn).toHaveLastReturnedWith(42);
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
   * const fn = mock.fn((x: number) => x * 2);
   * fn(1); fn(2);
   * expectAnything(fn).toHaveNthReturnedWith(2, 4);
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
 * import { expectAnything } from "@probitas/expect/anything";
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
 *   .toContain("hello");
 * ```
 */
export function expectAnything<T>(
  value: T,
  negate = false,
): AnythingExpectation {
  // Always create a fresh @std/expect instance to avoid Proxy state contamination
  const originalExpect = expectStd(value);

  // Apply negation if needed
  const stdExpect = negate
    ? (originalExpect as unknown as Record<string, Expected<false>>).not
    : originalExpect;

  const self: AnythingExpectation = {
    get not(): AnythingExpectation {
      // Create new negated instance
      return expectAnything(value, !negate);
    },

    // Common matchers
    toBe(expected: unknown) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBe(expected);
      // Return new instance with negation reset
      return expectAnything(value, false);
    },

    toEqual(expected: unknown) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toEqual(expected);
      return expectAnything(value, false);
    },

    toStrictEqual(expected: unknown) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toStrictEqual(expected);
      return expectAnything(value, false);
    },

    toMatch(expected: string | RegExp) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toMatch(expected);
      return expectAnything(value, false);
    },

    toMatchObject(expected: Record<string, unknown>) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toMatchObject(expected);
      return expectAnything(value, false);
    },

    toBeDefined() {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeDefined();
      return expectAnything(value, false);
    },

    toBeUndefined() {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeUndefined();
      return expectAnything(value, false);
    },

    toBeNull() {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeNull();
      return expectAnything(value, false);
    },

    toBeNaN() {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeNaN();
      return expectAnything(value, false);
    },

    toBeTruthy() {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeTruthy();
      return expectAnything(value, false);
    },

    toBeFalsy() {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeFalsy();
      return expectAnything(value, false);
    },

    toContain(expected: unknown) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toContain(expected);
      return expectAnything(value, false);
    },

    toContainEqual(expected: unknown) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toContainEqual(expected);
      return expectAnything(value, false);
    },

    toHaveLength(expected: number) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveLength(expected);
      return expectAnything(value, false);
    },

    toBeGreaterThan(expected: number) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeGreaterThan(expected);
      return expectAnything(value, false);
    },

    toBeGreaterThanOrEqual(expected: number) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeGreaterThanOrEqual(expected);
      return expectAnything(value, false);
    },

    toBeLessThan(expected: number) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeLessThan(expected);
      return expectAnything(value, false);
    },

    toBeLessThanOrEqual(expected: number) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeLessThanOrEqual(expected);
      return expectAnything(value, false);
    },

    toBeCloseTo(expected: number, numDigits?: number) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeCloseTo(expected, numDigits);
      return expectAnything(value, false);
    },

    // deno-lint-ignore no-explicit-any
    toBeInstanceOf(expected: new (...args: any[]) => any) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toBeInstanceOf(expected);
      return expectAnything(value, false);
    },

    toThrow(expected?: string | RegExp | Error) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toThrow(expected);
      return expectAnything(value, false);
    },

    toHaveProperty(
      keyPath: string | string[],
      expectedValue?: unknown,
    ) {
      if (expectedValue !== undefined) {
        (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
          .toHaveProperty(keyPath, expectedValue);
      } else {
        (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
          .toHaveProperty(keyPath);
      }
      return expectAnything(value, false);
    },

    // Mock related matchers
    toHaveBeenCalled() {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveBeenCalled();
      return expectAnything(value, false);
    },

    toHaveBeenCalledTimes(expected: number) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveBeenCalledTimes(expected);
      return expectAnything(value, false);
    },

    toHaveBeenCalledWith(...expected: unknown[]) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveBeenCalledWith(...expected);
      return expectAnything(value, false);
    },

    toHaveBeenLastCalledWith(...expected: unknown[]) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveBeenLastCalledWith(...expected);
      return expectAnything(value, false);
    },

    toHaveBeenNthCalledWith(n: number, ...expected: unknown[]) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveBeenNthCalledWith(n, ...expected);
      return expectAnything(value, false);
    },

    toHaveReturned() {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveReturned();
      return expectAnything(value, false);
    },

    toHaveReturnedTimes(expected: number) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveReturnedTimes(expected);
      return expectAnything(value, false);
    },

    toHaveReturnedWith(expected: unknown) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveReturnedWith(expected);
      return expectAnything(value, false);
    },

    toHaveLastReturnedWith(expected: unknown) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveLastReturnedWith(expected);
      return expectAnything(value, false);
    },

    toHaveNthReturnedWith(n: number, expected: unknown) {
      (stdExpect as unknown as Record<string, (...args: unknown[]) => void>)
        .toHaveNthReturnedWith(n, expected);
      return expectAnything(value, false);
    },
  };

  return self;
}
