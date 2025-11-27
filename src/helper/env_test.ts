import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { get, has, must } from "probitas/helper/env";

describe("env", () => {
  describe("must()", () => {
    it("returns value when environment variable is set", () => {
      Deno.env.set("TEST_VAR", "test_value");
      try {
        assertEquals(must("TEST_VAR"), "test_value");
      } finally {
        Deno.env.delete("TEST_VAR");
      }
    });

    it("throws error when environment variable is not set", () => {
      Deno.env.delete("NON_EXISTENT_VAR");
      let errorThrown = false;
      try {
        must("NON_EXISTENT_VAR");
      } catch {
        errorThrown = true;
      }
      assertEquals(errorThrown, true);
    });
  });

  describe("get()", () => {
    it("returns value when environment variable is set", () => {
      Deno.env.set("TEST_VAR", "test_value");
      try {
        assertEquals(get("TEST_VAR"), "test_value");
      } finally {
        Deno.env.delete("TEST_VAR");
      }
    });

    it("returns undefined when environment variable is not set and no default", () => {
      Deno.env.delete("NON_EXISTENT_VAR");
      assertEquals(get("NON_EXISTENT_VAR"), undefined);
    });

    it("returns default value when environment variable is not set", () => {
      Deno.env.delete("NON_EXISTENT_VAR");
      assertEquals(get("NON_EXISTENT_VAR", "default"), "default");
    });

    it("returns actual value over default when environment variable is set", () => {
      Deno.env.set("TEST_VAR", "actual");
      try {
        assertEquals(get("TEST_VAR", "default"), "actual");
      } finally {
        Deno.env.delete("TEST_VAR");
      }
    });
  });

  describe("has()", () => {
    it("returns true when environment variable is set", () => {
      Deno.env.set("TEST_VAR", "test_value");
      try {
        assertEquals(has("TEST_VAR"), true);
      } finally {
        Deno.env.delete("TEST_VAR");
      }
    });

    it("returns false when environment variable is not set", () => {
      Deno.env.delete("NON_EXISTENT_VAR");
      assertEquals(has("NON_EXISTENT_VAR"), false);
    });

    it("returns true even for empty string value", () => {
      Deno.env.set("EMPTY_VAR", "");
      try {
        assertEquals(has("EMPTY_VAR"), true);
      } finally {
        Deno.env.delete("EMPTY_VAR");
      }
    });
  });
});
