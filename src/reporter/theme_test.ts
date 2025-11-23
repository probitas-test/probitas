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
    it("has all required functions", () => {
      assertEquals(typeof defaultTheme.success, "function");
      assertEquals(typeof defaultTheme.failure, "function");
      assertEquals(typeof defaultTheme.skip, "function");
      assertEquals(typeof defaultTheme.dim, "function");
      assertEquals(typeof defaultTheme.title, "function");
      assertEquals(typeof defaultTheme.info, "function");
      assertEquals(typeof defaultTheme.warning, "function");
    });

    it("success - contains green ANSI code", () => {
      const result = defaultTheme.success("test");
      assertStringIncludes(result, "test");
      assertStringIncludes(result, "\x1b[32m");
    });

    it("failure - contains red ANSI code", () => {
      const result = defaultTheme.failure("test");
      assertStringIncludes(result, "test");
      assertStringIncludes(result, "\x1b[31m");
    });

    it("skip - contains yellow ANSI code", () => {
      const result = defaultTheme.skip("test");
      assertStringIncludes(result, "test");
      assertStringIncludes(result, "\x1b[33m");
    });

    it("dim - contains gray ANSI code", () => {
      const result = defaultTheme.dim("test");
      assertStringIncludes(result, "test");
      assertStringIncludes(result, "\x1b[90m");
    });

    it("title - contains bold ANSI code", () => {
      const result = defaultTheme.title("test");
      assertStringIncludes(result, "test");
      assertStringIncludes(result, "\x1b[1m");
    });

    it("info - contains cyan ANSI code", () => {
      const result = defaultTheme.info("test");
      assertStringIncludes(result, "test");
      assertStringIncludes(result, "\x1b[36m");
    });

    it("warning - contains yellow ANSI code", () => {
      const result = defaultTheme.warning("test");
      assertStringIncludes(result, "test");
      assertStringIncludes(result, "\x1b[33m");
    });
  });

  describe("noColorTheme", () => {
    it("has all required functions", () => {
      assertEquals(typeof noColorTheme.success, "function");
      assertEquals(typeof noColorTheme.failure, "function");
      assertEquals(typeof noColorTheme.skip, "function");
      assertEquals(typeof noColorTheme.dim, "function");
      assertEquals(typeof noColorTheme.title, "function");
      assertEquals(typeof noColorTheme.info, "function");
      assertEquals(typeof noColorTheme.warning, "function");
    });

    it("success - returns plain text", () => {
      assertEquals(noColorTheme.success("test"), "test");
    });

    it("failure - returns plain text", () => {
      assertEquals(noColorTheme.failure("test"), "test");
    });

    it("skip - returns plain text", () => {
      assertEquals(noColorTheme.skip("test"), "test");
    });

    it("dim - returns plain text", () => {
      assertEquals(noColorTheme.dim("test"), "test");
    });

    it("title - returns plain text", () => {
      assertEquals(noColorTheme.title("test"), "test");
    });

    it("info - returns plain text", () => {
      assertEquals(noColorTheme.info("test"), "test");
    });

    it("warning - returns plain text", () => {
      assertEquals(noColorTheme.warning("test"), "test");
    });
  });
});
