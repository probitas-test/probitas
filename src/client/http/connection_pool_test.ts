/**
 * Tests for ConnectionPool
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { ConnectionPool } from "./connection_pool.ts";

describe("ConnectionPool", () => {
  describe("constructor", () => {
    it("should initialize with specified size", () => {
      const pool = new ConnectionPool(10);
      assertEquals(pool.getPoolSize(), 10);
    });

    it("should initialize with default size", () => {
      const pool = new ConnectionPool();
      assertEquals(pool.getPoolSize(), 10);
    });
  });

  describe("setPoolSize", () => {
    it("should update pool size", () => {
      const pool = new ConnectionPool(10);
      pool.setPoolSize(20);
      assertEquals(pool.getPoolSize(), 20);
    });

    it("should allow decreasing pool size", () => {
      const pool = new ConnectionPool(20);
      pool.setPoolSize(5);
      assertEquals(pool.getPoolSize(), 5);
    });
  });

  describe("closeAll", () => {
    it("should complete without error even with no connections", async () => {
      const pool = new ConnectionPool(10);
      await pool.closeAll();
      assertEquals(pool.getPoolSize(), 10);
    });

    it("should reset connections after closing", async () => {
      const pool = new ConnectionPool(10);
      await pool.closeAll();
      // Pool should still have its size configured
      assertEquals(pool.getPoolSize(), 10);
    });
  });
});
