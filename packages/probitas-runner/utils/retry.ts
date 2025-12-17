/**
 * Retry utilities for handling transient failures
 *
 * This module provides retry logic with configurable backoff strategies,
 * useful for handling flaky network calls or temporary service unavailability.
 *
 * @module
 */

import { delay } from "@std/async/delay";

/**
 * Configuration options for retry behavior
 */
export type RetryOptions = {
  /** Maximum number of attempts (default: 1, meaning no retries) */
  maxAttempts?: number;

  /**
   * Backoff strategy between retries.
   * - "linear": 1s, 2s, 3s, 4s...
   * - "exponential": 1s, 2s, 4s, 8s...
   * @default "linear"
   */
  backoff?: "linear" | "exponential";

  /** AbortSignal to cancel retry delays */
  signal?: AbortSignal;
};

/**
 * Execute a function with retry logic
 *
 * Attempts to execute the provided function, retrying on failure according to the
 * specified options. Delays between retries follow either linear or exponential backoff.
 *
 * @template T - Return type of the function
 * @param fn - Function to execute (can be sync or async)
 * @param options - Retry configuration options
 * @returns Promise resolving to the function's return value
 * @throws The last error encountered if all retry attempts fail
 *
 * @example Retry up to 3 times with exponential backoff
 * ```ts
 * import { retry } from "./retry.ts";
 *
 * const mockFetch = async () => ({ ok: true });
 * const data = await retry(
 *   () => mockFetch(),
 *   { maxAttempts: 3, backoff: "exponential" }
 * );
 * console.log(data);
 * ```
 *
 * @example With abort signal
 * ```ts
 * import { retry } from "./retry.ts";
 *
 * const fetchData = async () => ({ status: "ok" });
 * const controller = new AbortController();
 * const data = await retry(
 *   () => fetchData(),
 *   { maxAttempts: 5, backoff: "linear", signal: controller.signal }
 * );
 * console.log(data);
 * ```
 */
export async function retry<T>(
  fn: () => T | Promise<T>,
  options: Readonly<RetryOptions> = {},
): Promise<T> {
  const { maxAttempts = 1, backoff = "linear", signal } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts - 1) {
        const t = backoff === "exponential"
          ? Math.pow(2, attempt) * 1000
          : (attempt + 1) * 1000;
        await delay(t, { signal });
      }
    }
  }

  throw lastError || new Error("Retry failed");
}
