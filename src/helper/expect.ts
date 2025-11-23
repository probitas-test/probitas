/**
 * Assertion utilities for scenario tests
 *
 * This module re-exports the Deno standard library's expect assertion library,
 * providing a BDD-style assertion API for writing expressive test assertions.
 *
 * @example
 * ```ts
 * import { expect } from "probitas/helper/expect";
 *
 * const response = await fetch("http://api.example.com/users/1");
 * const user = await response.json();
 *
 * expect(response.status).toBe(200);
 * expect(user).toHaveProperty("id");
 * expect(user.name).toEqual("John Doe");
 * expect(user.tags).toContain("admin");
 * ```
 *
 * @module
 */

export * from "@std/expect";
