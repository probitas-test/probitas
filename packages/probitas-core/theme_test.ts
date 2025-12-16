/**
 * Tests for Theme
 *
 * @module
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { defaultTheme, noColorTheme, removeColors } from "./theme.ts";

describe("theme", () => {
  describe("defaultTheme", () => {
    it("applies ANSI color codes", () => {
      assertStringIncludes(defaultTheme.success("test"), "\x1b[32m");
      assertStringIncludes(defaultTheme.failure("test"), "\x1b[31m");
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
      assertEquals(noColorTheme.dim("test"), "test");
      assertEquals(noColorTheme.title("test"), "test");
      assertEquals(noColorTheme.info("test"), "test");
      assertEquals(noColorTheme.warning("test"), "test");
    });
  });

  describe("removeColors", () => {
    it("removes single color code", () => {
      assertEquals(removeColors("\x1b[32mtext\x1b[0m"), "text");
    });

    it("removes multiple color codes", () => {
      assertEquals(
        removeColors("\x1b[1m\x1b[31mBold Red\x1b[0m"),
        "Bold Red",
      );
    });

    it("removes combined codes", () => {
      assertEquals(
        removeColors("\x1b[1;31mBold Red\x1b[0m"),
        "Bold Red",
      );
    });

    it("handles text without escape sequences", () => {
      assertEquals(removeColors("plain text"), "plain text");
    });

    it("handles empty string", () => {
      assertEquals(removeColors(""), "");
    });

    it("removes 256-color codes", () => {
      assertEquals(
        removeColors("\x1b[38;5;243mLight Gray\x1b[0m"),
        "Light Gray",
      );
    });
  });
});
