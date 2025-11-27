/**
 * Tests for Theme
 *
 * @module
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { defaultTheme, noColorTheme } from "./theme.ts";

describe("theme", () => {
  describe("defaultTheme", () => {
    it("applies ANSI color codes", () => {
      assertStringIncludes(defaultTheme.success("test"), "\x1b[32m");
      assertStringIncludes(defaultTheme.failure("test"), "\x1b[31m");
      assertStringIncludes(defaultTheme.skip("test"), "\x1b[33m");
      assertStringIncludes(defaultTheme.dim("test"), "\x1b[90m");
      assertStringIncludes(defaultTheme.title("test"), "\x1b[1m");
      assertStringIncludes(defaultTheme.info("test"), "\x1b[36m");
      assertStringIncludes(defaultTheme.warning("test"), "\x1b[33m");
    });
  });

  describe("noColorTheme", () => {
    it("returns plain text without modification", () => {
      assertEquals(noColorTheme.success("test"), "test");
      assertEquals(noColorTheme.failure("test"), "test");
      assertEquals(noColorTheme.skip("test"), "test");
      assertEquals(noColorTheme.dim("test"), "test");
      assertEquals(noColorTheme.title("test"), "test");
      assertEquals(noColorTheme.info("test"), "test");
      assertEquals(noColorTheme.warning("test"), "test");
    });
  });
});
