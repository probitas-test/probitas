/**
 * Tests for diff_any module
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { Any } from "./diff_any.ts";

Deno.test("Any displays as [Any] when inspected", () => {
  const result = Deno.inspect(Any);
  assertEquals(result, "[Any]");
});

Deno.test("Any displays as [Any] inside object", () => {
  const obj = { foo: Any };
  const result = Deno.inspect(obj);
  assertEquals(result, "{ foo: [Any] }");
});

Deno.test("Any displays as [Any] inside array", () => {
  const arr = [1, Any, 3];
  const result = Deno.inspect(arr);
  assertEquals(result, "[ 1, [Any], 3 ]");
});

Deno.test("Any is a singleton", () => {
  // Any should always be the same instance
  assertEquals(Any, Any);
});
