import { assertEquals } from "@std/assert";
import { tryOk } from "./try_ok.ts";

Deno.test("tryOk - returns true when function succeeds", () => {
  const result = tryOk(() => {});
  assertEquals(result, true);
});

Deno.test("tryOk - returns false when function throws", () => {
  const result = tryOk(() => {
    throw new Error("test error");
  });
  assertEquals(result, false);
});

Deno.test("tryOk - works with @std/expect assertions", async () => {
  const { expect } = await import("@std/expect");

  assertEquals(tryOk(() => expect(42).toBe(42)), true);
  assertEquals(tryOk(() => expect(42).toBe(100)), false);
});
