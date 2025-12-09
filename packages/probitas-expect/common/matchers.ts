/**
 * Matching utilities for expect implementations.
 *
 * This module provides functions for checking if values contain
 * expected subsets, subarrays, or patterns.
 *
 * @module
 */

/**
 * Check if an object contains all properties from subset (deep partial match).
 *
 * @param obj - The object to check
 * @param subset - The subset of properties to match
 * @returns True if obj contains all properties from subset
 */
export function containsSubset(
  obj: unknown,
  subset: unknown,
): boolean {
  // Handle primitives and null
  if (subset === null) {
    return obj === null;
  }
  if (typeof subset !== "object") {
    return obj === subset;
  }

  // subset is a non-null object, obj must also be a non-null object
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  // Handle arrays: require exact match (order and length matter)
  if (Array.isArray(subset)) {
    if (!Array.isArray(obj)) return false;
    if (obj.length !== subset.length) return false;
    for (let i = 0; i < subset.length; i++) {
      if (!containsSubset(obj[i], subset[i])) return false;
    }
    return true;
  }

  // Handle objects: recursive partial match
  for (const [key, expectedValue] of Object.entries(subset)) {
    if (!(key in obj)) return false;
    const actualValue = (obj as Record<string, unknown>)[key];
    if (!containsSubset(actualValue, expectedValue)) return false;
  }
  return true;
}

/**
 * Check if an array contains a contiguous subarray.
 *
 * @param arr - The array to search
 * @param sub - The subarray to find
 * @returns True if arr contains sub as a contiguous sequence
 */
export function containsSubarray(arr: Uint8Array, sub: Uint8Array): boolean {
  if (sub.length === 0) return true;
  if (sub.length > arr.length) return false;

  outer: for (let i = 0; i <= arr.length - sub.length; i++) {
    for (let j = 0; j < sub.length; j++) {
      if (arr[i + j] !== sub[j]) continue outer;
    }
    return true;
  }
  return false;
}
