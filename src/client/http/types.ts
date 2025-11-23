/**
 * Type definitions for the Client layer
 *
 * Types for HTTP and other external resource clients.
 *
 * @module
 */

/**
 * Options for HTTPClient initialization
 */
export interface HTTPClientOptions {
  /**
   * Default headers applied to all requests
   */
  readonly headers?: Record<string, string>;

  /**
   * Default timeout for requests in milliseconds
   *
   * Can be overridden per request.
   */
  readonly timeout?: number;

  /**
   * Connection pool size
   *
   * @default 10
   */
  readonly poolSize?: number;

  /**
   * Whether to automatically follow redirects
   *
   * @default true
   */
  readonly followRedirects?: boolean;

  /**
   * Maximum number of redirects to follow
   *
   * @default 5
   */
  readonly maxRedirects?: number;
}

/**
 * Options for individual HTTP requests
 */
export interface RequestOptions {
  /**
   * Custom headers for this request
   *
   * Merged with default headers.
   */
  readonly headers?: Record<string, string>;

  /**
   * Query parameters to append to URL
   */
  readonly query?: Record<string, string>;

  /**
   * JSON body (automatically serialized)
   *
   * Mutually exclusive with body.
   */
  readonly json?: unknown;

  /**
   * Raw request body
   *
   * Mutually exclusive with json.
   */
  readonly body?: BodyInit;

  /**
   * Request timeout in milliseconds
   *
   * Overrides default timeout.
   */
  readonly timeout?: number;

  /**
   * Whether to follow redirects for this request
   *
   * Overrides default setting.
   */
  readonly followRedirects?: boolean;
}

/**
 * Result from an HTTP request
 */
// deno-lint-ignore no-explicit-any
export interface HTTPResult<T = any> {
  /** HTTP status code */
  readonly status: number;

  /** HTTP status text */
  readonly statusText: string;

  /** Response headers */
  readonly headers: Headers;

  /** Raw response body as bytes */
  readonly body: Uint8Array;

  /** Response body as text */
  readonly text: string;

  /** Response body parsed as JSON */
  readonly json: T;

  /** Response body as Blob */
  readonly blob: Blob;

  /** Request duration in milliseconds */
  readonly duration: number;
}
