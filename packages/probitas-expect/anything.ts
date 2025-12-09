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
   */
  readonly not: this;

  // Common matchers
  toBe(expected: unknown): this;
  toEqual(expected: unknown): this;
  toStrictEqual(expected: unknown): this;
  toMatch(expected: string | RegExp): this;
  toMatchObject(expected: Record<string, unknown>): this;
  toBeDefined(): this;
  toBeUndefined(): this;
  toBeNull(): this;
  toBeNaN(): this;
  toBeTruthy(): this;
  toBeFalsy(): this;
  toContain(expected: unknown): this;
  toContainEqual(expected: unknown): this;
  toHaveLength(expected: number): this;
  toBeGreaterThan(expected: number): this;
  toBeGreaterThanOrEqual(expected: number): this;
  toBeLessThan(expected: number): this;
  toBeLessThanOrEqual(expected: number): this;
  toBeCloseTo(expected: number, numDigits?: number): this;
  // deno-lint-ignore no-explicit-any
  toBeInstanceOf(expected: new (...args: any[]) => any): this;
  toThrow(expected?: string | RegExp | Error): this;
  toHaveProperty(
    keyPath: string | string[],
    expectedValue?: unknown,
  ): this;

  // Mock related matchers
  toHaveBeenCalled(): this;
  toHaveBeenCalledTimes(expected: number): this;
  toHaveBeenCalledWith(...expected: unknown[]): this;
  toHaveBeenLastCalledWith(...expected: unknown[]): this;
  toHaveBeenNthCalledWith(n: number, ...expected: unknown[]): this;
  toHaveReturned(): this;
  toHaveReturnedTimes(expected: number): this;
  toHaveReturnedWith(expected: unknown): this;
  toHaveLastReturnedWith(expected: unknown): this;
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
