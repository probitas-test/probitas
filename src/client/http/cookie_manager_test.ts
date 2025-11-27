/**
 * Tests for CookieManager
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { CookieManager } from "./cookie_manager.ts";

describe("CookieManager", () => {
  describe("Basic Operations", () => {
    it("sets, gets, and clears cookies", () => {
      const manager = new CookieManager();

      assertEquals(manager.getCookies(), {});

      manager.setCookie("session", "abc123");
      manager.setCookie("token", "xyz789");

      const cookies = manager.getCookies();
      assertEquals(cookies["session"], "abc123");
      assertEquals(cookies["token"], "xyz789");

      manager.clear();
      assertEquals(manager.getCookies(), {});
    });
  });

  describe("Formatting", () => {
    it("getCookieHeader returns empty string when no cookies", () => {
      const manager = new CookieManager();
      assertEquals(manager.getCookieHeader(), "");
    });

    it("getCookieHeader formats single cookie", () => {
      const manager = new CookieManager();
      manager.setCookie("session", "abc123");
      assertEquals(manager.getCookieHeader(), "session=abc123");
    });

    it("getCookieHeader formats multiple cookies with semicolon separator", () => {
      const manager = new CookieManager();
      manager.setCookie("session", "abc123");
      manager.setCookie("token", "xyz789");

      const header = manager.getCookieHeader();
      const parts = header.split("; ");
      assertEquals(parts.length, 2);
    });
  });

  describe("Parsing", () => {
    const parseTestCases: {
      description: string;
      input: string;
      expected: Record<string, string>;
    }[] = [
      {
        description: "simple cookie",
        input: "session=abc123",
        expected: { session: "abc123" },
      },
      {
        description: "cookie with attributes",
        input: "session=abc123; Path=/; HttpOnly; Secure",
        expected: { session: "abc123" },
      },
      {
        description: "cookie without value",
        input: "session=",
        expected: { session: "" },
      },
      {
        description: "empty string",
        input: "",
        expected: {},
      },
    ];

    for (const testCase of parseTestCases) {
      it(`parseSetCookie extracts ${testCase.description}`, () => {
        const manager = new CookieManager();
        manager.parseSetCookie(testCase.input);
        assertEquals(manager.getCookies(), testCase.expected);
      });
    }

    it("parseSetCookie overwrites existing cookie", () => {
      const manager = new CookieManager();
      manager.setCookie("session", "old123");
      manager.parseSetCookie("session=new456");

      assertEquals(manager.getCookies()["session"], "new456");
    });
  });
});
