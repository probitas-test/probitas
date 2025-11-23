import { assertEquals, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { EnvNotFoundError, get, has, must } from "probitas/helper/env";

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

    it("throws EnvNotFoundError when environment variable is not set", () => {
      Deno.env.delete("NON_EXISTENT_VAR");
      assertThrows(
        () => must("NON_EXISTENT_VAR"),
        EnvNotFoundError,
        "Environment variable NON_EXISTENT_VAR is required but not set",
      );
    });

    it("handles empty string value", () => {
      Deno.env.set("EMPTY_VAR", "");
      try {
        assertEquals(must("EMPTY_VAR"), "");
      } finally {
        Deno.env.delete("EMPTY_VAR");
      }
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

    it("handles empty string value", () => {
      Deno.env.set("EMPTY_VAR", "");
      try {
        assertEquals(get("EMPTY_VAR"), "");
        assertEquals(get("EMPTY_VAR", "default"), "");
      } finally {
        Deno.env.delete("EMPTY_VAR");
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

  describe("EnvNotFoundError", () => {
    it("has correct name property", () => {
      const error = new EnvNotFoundError("test message");
      assertEquals(error.name, "EnvNotFoundError");
      assertEquals(error.message, "test message");
    });

    it("is instance of Error", () => {
      const error = new EnvNotFoundError("test message");
      assertEquals(error instanceof Error, true);
      assertEquals(error instanceof EnvNotFoundError, true);
    });
  });

  describe("integration", () => {
    it("typical usage pattern", () => {
      Deno.env.set("API_KEY", "secret123");
      Deno.env.set("PORT", "8080");
      Deno.env.delete("OPTIONAL_FEATURE");

      try {
        const apiKey = must("API_KEY");
        assertEquals(apiKey, "secret123");

        const port = get("PORT", "3000");
        assertEquals(port, "8080");

        const feature = get("OPTIONAL_FEATURE");
        assertEquals(feature, undefined);

        assertEquals(has("API_KEY"), true);
        assertEquals(has("OPTIONAL_FEATURE"), false);
      } finally {
        Deno.env.delete("API_KEY");
        Deno.env.delete("PORT");
      }
    });
  });
});
