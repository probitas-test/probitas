/**
 * ConnectionPool for managing HTTP connections
 *
 * Manages connection pooling for HTTP requests.
 * Currently a simplified implementation that configures
 * pool size settings while delegating actual connection
 * management to the fetch() API.
 *
 * @module
 */

/**
 * Manages a pool of connections for HTTP requests
 *
 * This is a simplified implementation that sets pool size configuration
 * and provides lifecycle management. The actual connection pooling
 * is delegated to the underlying HTTP client (fetch API).
 */
export class ConnectionPool {
  #poolSize: number;

  /**
   * Creates a new connection pool
   *
   * @param poolSize - Maximum number of connections in the pool (default: 10)
   */
  constructor(poolSize: number = 10) {
    this.#poolSize = poolSize;
  }

  /**
   * Gets the configured pool size
   *
   * @returns The current pool size configuration
   */
  getPoolSize(): number {
    return this.#poolSize;
  }

  /**
   * Sets the pool size
   *
   * @param size - New pool size
   */
  setPoolSize(size: number): void {
    this.#poolSize = size;
  }

  /**
   * Closes all connections in the pool
   *
   * Currently a no-op as connection management is delegated
   * to the fetch() API. This method ensures consistent interface
   * and allows for future enhancement.
   */
  async closeAll(): Promise<void> {
    // Connection management is delegated to fetch()
  }
}
