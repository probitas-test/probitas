/**
 * CookieManager for managing HTTP cookies
 *
 * Handles storage, retrieval, and formatting of cookies,
 * including parsing Set-Cookie headers.
 *
 * @module
 */

/**
 * Manages HTTP cookies for requests and responses
 */
export class CookieManager {
  #cookies: Map<string, string> = new Map();

  /**
   * Sets or updates a cookie
   *
   * @param name - Cookie name
   * @param value - Cookie value
   */
  setCookie(name: string, value: string): void {
    this.#cookies.set(name, value);
  }

  /**
   * Gets all stored cookies as a plain object
   *
   * @returns Object with cookie name-value pairs
   */
  getCookies(): Record<string, string> {
    return Object.fromEntries(this.#cookies);
  }

  /**
   * Formats cookies for Cookie header in HTTP requests
   *
   * @returns Cookie header value (e.g., "name1=value1; name2=value2")
   */
  getCookieHeader(): string {
    if (this.#cookies.size === 0) {
      return "";
    }

    return Array.from(this.#cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  /**
   * Parses a Set-Cookie header and stores the cookie
   *
   * Extracts the cookie name and value, ignoring attributes
   * (Path, Domain, Expires, Max-Age, HttpOnly, Secure, SameSite)
   *
   * @param setCookieHeader - Set-Cookie header value
   */
  parseSetCookie(setCookieHeader: string): void {
    // Extract the first part before semicolon (name=value)
    const [cookiePart] = setCookieHeader.split(";");
    if (!cookiePart) {
      return;
    }

    // Parse name=value
    const [name, value] = cookiePart.split("=");
    if (name && value !== undefined) {
      this.#cookies.set(name.trim(), value.trim());
    }
  }

  /**
   * Clears all stored cookies
   */
  clear(): void {
    this.#cookies.clear();
  }
}
