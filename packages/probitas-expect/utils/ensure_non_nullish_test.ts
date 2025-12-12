/**
 * Tests for ensureNonNullish utility function.
 *
 * @module
 */

import { assertEquals, assertThrows } from "@std/assert";
import { ensureNonNullish } from "./ensure_non_nullish.ts";

Deno.test("ensureNonNullish", async (t) => {
  await t.step("returns value when not null or undefined", () => {
    assertEquals(ensureNonNullish(42, "number"), 42);
    assertEquals(ensureNonNullish("hello", "string"), "hello");
    assertEquals(ensureNonNullish(true, "boolean"), true);
    assertEquals(ensureNonNullish(0, "zero"), 0);
    assertEquals(ensureNonNullish("", "empty string"), "");
    assertEquals(ensureNonNullish(false, "false"), false);
  });

  await t.step("throws when value is null", () => {
    assertThrows(
      () => ensureNonNullish(null, "value"),
      Error,
      "Expected value to exist, but got null",
    );
  });

  await t.step("throws when value is undefined", () => {
    assertThrows(
      () => ensureNonNullish(undefined, "value"),
      Error,
      "Expected value to exist, but got undefined",
    );
  });

  await t.step("works with objects", () => {
    const obj = { key: "value" };
    assertEquals(ensureNonNullish(obj, "object"), obj);
  });

  await t.step("works with arrays", () => {
    const arr = [1, 2, 3];
    assertEquals(ensureNonNullish(arr, "array"), arr);
  });

  await t.step("preserves type information", () => {
    const value: string | null = "test";
    const result: string = ensureNonNullish(value, "value");
    assertEquals(result, "test");
  });
});
