/**
 * Boolean XOR utility.
 *
 * This module provides a utility function for boolean XOR (exclusive OR) operation.
 *
 * @module
 */

/**
 * Performs boolean XOR (exclusive OR) operation.
 *
 * Returns true if exactly one of the operands is true, false otherwise.
 * This is useful for negation logic in assertions where you want to flip
 * the pass/fail result based on a negate flag.
 *
 * @param a - First boolean operand
 * @param b - Second boolean operand
 * @returns true if a XOR b, false otherwise
 *
 * @example
 * ```ts
 * import { xor } from "./xor.ts";
 *
 * console.log(xor(false, false)); // false
 * console.log(xor(false, true));  // true
 * console.log(xor(true, false));  // true
 * console.log(xor(true, true));   // false
 * ```
 *
 * @example With negation logic
 * ```ts
 * const negate = true;
 * const actuallyPassed = true;
 *
 * // When negate is true, we want to invert the result
 * const shouldPass = xor(negate, actuallyPassed);
 * // negate=true, actuallyPassed=true → shouldPass=false (correct: negation failed)
 * ```
 */
export function xor(a: boolean, b: boolean): boolean {
  return a !== b;
}
