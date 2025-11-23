/**
 * Environment variable access utilities
 *
 * This module provides a type-safe and ergonomic interface for accessing environment variables.
 * It offers three primary functions for different use cases:
 *
 * - `must()`: For required variables that should throw if not set
 * - `get()`: For optional variables with optional default values
 * - `has()`: For checking variable existence
 *
 * @example
 * ```ts
 * import { get, has, must } from "probitas/helper/env";
 *
 * // Get required variable (throws if not set)
 * const apiKey = must("API_KEY");
 *
 * // Get optional variable with default
 * const port = get("PORT", "8080");
 *
 * // Check if variable exists
 * if (has("DEBUG")) {
 *   console.log("Debug mode enabled");
 * }
 * ```
 *
 * @module
 */

/**
 * Error thrown when a required environment variable is not set
 *
 * This error is thrown by the `must()` function when attempting to access
 * a required environment variable that hasn't been defined.
 *
 * @example
 * ```ts
 * try {
 *   const apiKey = must("API_KEY");
 * } catch (error) {
 *   if (error instanceof EnvNotFoundError) {
 *     console.error("Missing required environment variable:", error.message);
 *   }
 * }
 * ```
 */
export class EnvNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Gets a required environment variable
 *
 * @param name - The name of the environment variable
 * @returns The value of the environment variable
 * @throws {EnvNotFoundError} If the environment variable is not set
 *
 * @example
 * ```ts
 * const apiKey = must("API_KEY"); // Throws if API_KEY is not set
 * ```
 */
export function must(name: string): string {
  const value = Deno.env.get(name);
  if (value === undefined) {
    throw new EnvNotFoundError(
      `Environment variable ${name} is required but not set`,
    );
  }
  return value;
}

/**
 * Gets an optional environment variable
 *
 * @param name - The name of the environment variable
 * @returns The value of the environment variable, or undefined
 *
 * @example
 * ```ts
 * const host = get("HOST"); // Returns undefined if HOST is not set
 * ```
 */
export function get(name: string): string | undefined;

/**
 * Gets an optional environment variable with a default value
 *
 * @param name - The name of the environment variable
 * @param defaultValue - The default value to return if the variable is not set
 * @returns The value of the environment variable, or the default value
 *
 * @example
 * ```ts
 * const port = get("PORT", "8080"); // Returns "8080" if PORT is not set
 * ```
 */
export function get(name: string, defaultValue: string): string;

export function get(
  name: string,
  defaultValue?: string,
): string | undefined {
  return Deno.env.get(name) ?? defaultValue;
}

/**
 * Checks if an environment variable exists
 *
 * @param name - The name of the environment variable
 * @returns True if the environment variable is set, false otherwise
 *
 * @example
 * ```ts
 * if (has("DEBUG")) {
 *   console.log("Debug mode enabled");
 * }
 * ```
 */
export function has(name: string): boolean {
  return Deno.env.has(name);
}
