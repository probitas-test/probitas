/**
 * HTTPClient for making HTTP requests with automatic resource management
 *
 * Provides high-level HTTP client with features like:
 * - Automatic cookie management
 * - Default headers
 * - Connection pooling
 * - Redirect handling
 * - AsyncDisposable for automatic cleanup
 *
 * @module
 */

import type { HTTPClientOptions, HTTPResult, RequestOptions } from "./types.ts";
import { CookieManager } from "./cookie_manager.ts";
import { ConnectionPool } from "./connection_pool.ts";

/**
 * Internal mutable version of HTTPClientOptions
 */
interface MutableHTTPClientOptions {
  headers?: Record<string, string>;
  timeout?: number;
  poolSize?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
}

/**
 * HTTP client for REST API testing with automatic resource management
 *
 * Provides methods for GET, POST, PUT, PATCH, DELETE, and HEAD requests
 * with automatic cookie management, default headers, and connection pooling.
 */
export class HTTPClient implements AsyncDisposable {
  #baseURL: string;
  #options: MutableHTTPClientOptions;
  #cookieManager: CookieManager;
  #connectionPool: ConnectionPool;

  /**
   * Creates a new HTTP client
   *
   * @param baseURL - Base URL for all requests
   * @param options - Client configuration options
   */
  constructor(baseURL: string, options?: HTTPClientOptions) {
    this.#baseURL = baseURL;
    this.#options = {
      timeout: 30000,
      poolSize: 10,
      followRedirects: true,
      maxRedirects: 5,
      ...options,
    };
    this.#cookieManager = new CookieManager();
    this.#connectionPool = new ConnectionPool(this.#options.poolSize ?? 10);
  }

  /**
   * Makes a GET request
   *
   * @param path - Request path (appended to baseURL)
   * @param options - Request options
   * @returns HTTP result with status, headers, and body
   */
  // deno-lint-ignore no-explicit-any
  get<T = any>(
    path: string,
    options?: RequestOptions,
  ): Promise<HTTPResult<T>> {
    return this.#request<T>("GET", path, options);
  }

  /**
   * Makes a POST request
   *
   * @param path - Request path (appended to baseURL)
   * @param options - Request options
   * @returns HTTP result with status, headers, and body
   */
  // deno-lint-ignore no-explicit-any
  post<T = any>(
    path: string,
    options?: RequestOptions,
  ): Promise<HTTPResult<T>> {
    return this.#request<T>("POST", path, options);
  }

  /**
   * Makes a PUT request
   *
   * @param path - Request path (appended to baseURL)
   * @param options - Request options
   * @returns HTTP result with status, headers, and body
   */
  // deno-lint-ignore no-explicit-any
  put<T = any>(
    path: string,
    options?: RequestOptions,
  ): Promise<HTTPResult<T>> {
    return this.#request<T>("PUT", path, options);
  }

  /**
   * Makes a PATCH request
   *
   * @param path - Request path (appended to baseURL)
   * @param options - Request options
   * @returns HTTP result with status, headers, and body
   */
  // deno-lint-ignore no-explicit-any
  patch<T = any>(
    path: string,
    options?: RequestOptions,
  ): Promise<HTTPResult<T>> {
    return this.#request<T>("PATCH", path, options);
  }

  /**
   * Makes a DELETE request
   *
   * @param path - Request path (appended to baseURL)
   * @param options - Request options
   * @returns HTTP result with status, headers, and body
   */
  // deno-lint-ignore no-explicit-any
  delete<T = any>(
    path: string,
    options?: RequestOptions,
  ): Promise<HTTPResult<T>> {
    return this.#request<T>("DELETE", path, options);
  }

  /**
   * Makes a HEAD request
   *
   * @param path - Request path (appended to baseURL)
   * @param options - Request options
   * @returns HTTP result with status and headers (no body)
   */
  // deno-lint-ignore no-explicit-any
  head<T = any>(
    path: string,
    options?: RequestOptions,
  ): Promise<HTTPResult<T>> {
    return this.#request<T>("HEAD", path, options);
  }

  /**
   * Sets default headers for all requests
   *
   * Merges with existing default headers.
   *
   * @param headers - Headers to set
   * @returns This client instance for method chaining
   */
  setHeaders(headers: Record<string, string>): this {
    this.#options.headers = {
      ...this.#options.headers,
      ...headers,
    };
    return this;
  }

  /**
   * Sets the default timeout for requests
   *
   * @param timeout - Timeout in milliseconds
   * @returns This client instance for method chaining
   */
  setTimeout(timeout: number): this {
    this.#options.timeout = timeout;
    return this;
  }

  /**
   * Sets the connection pool size
   *
   * @param size - Pool size
   * @returns This client instance for method chaining
   */
  setPoolSize(size: number): this {
    this.#options.poolSize = size;
    this.#connectionPool.setPoolSize(size);
    return this;
  }

  /**
   * Gets the current client options
   *
   * @returns Current options (read-only)
   */
  getOptions(): Readonly<HTTPClientOptions> {
    return { ...this.#options };
  }

  /**
   * Gets all stored cookies
   *
   * @returns Object with cookie name-value pairs
   */
  getCookies(): Record<string, string> {
    return this.#cookieManager.getCookies();
  }

  /**
   * Sets or updates a cookie
   *
   * @param name - Cookie name
   * @param value - Cookie value
   * @returns This client instance for method chaining
   */
  setCookie(name: string, value: string): this {
    this.#cookieManager.setCookie(name, value);
    return this;
  }

  /**
   * Clears all stored cookies
   *
   * @returns This client instance for method chaining
   */
  clearCookies(): this {
    this.#cookieManager.clear();
    return this;
  }

  /**
   * Cleans up resources
   *
   * Closes all connections in the pool and clears cookies.
   */
  async [Symbol.asyncDispose](): Promise<void> {
    await this.#connectionPool.closeAll();
    this.#cookieManager.clear();
  }

  /**
   * Makes an HTTP request
   *
   * @param method - HTTP method
   * @param path - Request path
   * @param options - Request options
   * @returns HTTP result
   */
  async #request<T>(
    method: string,
    path: string,
    options?: RequestOptions,
  ): Promise<HTTPResult<T>> {
    const url = this.#buildURL(path, options?.query);
    const headers = this.#mergeHeaders(options);
    const timeout = options?.timeout ?? this.#options.timeout ?? 30000;
    const followRedirects = options?.followRedirects ??
      this.#options.followRedirects ?? true;

    // Add body if provided
    if (options?.json !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(timeout),
    };

    if (options?.json !== undefined) {
      fetchOptions.body = JSON.stringify(options.json);
    } else if (options?.body !== undefined) {
      fetchOptions.body = options.body;
    }

    // Handle redirects
    if (!followRedirects) {
      fetchOptions.redirect = "manual";
    }

    const startTime = performance.now();
    const response = await fetch(url, fetchOptions);
    const duration = performance.now() - startTime;

    // Parse Set-Cookie headers
    const setCookieHeaders = response.headers.getSetCookie?.() ?? [];
    for (const setCookieHeader of setCookieHeaders) {
      this.#cookieManager.parseSetCookie(setCookieHeader);
    }

    // Handle response body
    const arrayBuffer = await response.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);
    const text = new TextDecoder().decode(body);

    // Parse JSON
    let json: T = undefined as unknown as T;
    try {
      if (text) {
        json = JSON.parse(text) as T;
      }
    } catch {
      // If JSON parsing fails, json remains undefined
    }

    const blob = new Blob([body], {
      type: response.headers.get("Content-Type") || "application/octet-stream",
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      body,
      text,
      json,
      blob,
      duration,
    };
  }

  /**
   * Builds the full request URL
   *
   * @param path - Request path
   * @param query - Query parameters
   * @returns Full URL
   */
  #buildURL(path: string, query?: Record<string, string>): string {
    const url = new URL(path, this.#baseURL);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.append(key, value);
      }
    }

    return url.toString();
  }

  /**
   * Merges default headers with request headers
   *
   * @param options - Request options
   * @returns Merged headers
   */
  #mergeHeaders(options?: RequestOptions): Record<string, string> {
    const headers = { ...this.#options.headers };

    // Add cookies
    const cookieHeader = this.#cookieManager.getCookieHeader();
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    // Merge request headers
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }
}
