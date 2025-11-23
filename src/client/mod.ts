/**
 * Client layer - HTTP client and other external resource clients
 *
 * Provides high-level, user-friendly APIs for interacting with external
 * resources like HTTP APIs, databases, and message queues.
 *
 * @module
 */

import { HTTPClient, type HTTPClientOptions } from "./http/mod.ts";

/**
 * Client factory for creating resource clients
 *
 * Provides convenient factory functions for creating typed clients
 * for various external resources.
 */
export const client = {
  /**
   * Creates an HTTP client for REST API testing
   *
   * @param baseURL - Base URL for all requests
   * @param options - Client configuration options
   * @returns HTTP client instance
   *
   * @example
   * ```typescript
   * await using api = client.http("https://api.example.com");
   * const result = await api.get("/users");
   * ```
   */
  http: (baseURL: string, options?: HTTPClientOptions): HTTPClient => {
    return new HTTPClient(baseURL, options);
  },
};
