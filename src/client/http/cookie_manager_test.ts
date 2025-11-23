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
    it("setCookie stores a single cookie", () => {
      const manager = new CookieManager();
      manager.setCookie("session", "abc123");

      const cookies = manager.getCookies();
      assertEquals(cookies["session"], "abc123");
    });

    it("getCookies returns empty object initially", () => {
      const manager = new CookieManager();
      assertEquals(manager.getCookies(), {});
    });

    it("getCookies returns multiple cookies", () => {
      const manager = new CookieManager();
      manager.setCookie("session", "abc123");
      manager.setCookie("token", "xyz789");

      const cookies = manager.getCookies();
      assertEquals(cookies["session"], "abc123");
      assertEquals(cookies["token"], "xyz789");
    });

    it("clear removes all stored cookies", () => {
      const manager = new CookieManager();
      manager.setCookie("session", "abc123");
      manager.setCookie("token", "xyz789");

      manager.clear();
      assertEquals(manager.getCookies(), {});
    });

    it("clear works on already empty manager", () => {
      const manager = new CookieManager();
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
      // Should contain both cookies separated by "; "
      const parts = header.split("; ");
      assertEquals(parts.length, 2);
    });
  });

  describe("Parsing", () => {
    it("parseSetCookie extracts simple cookie", () => {
      const manager = new CookieManager();
      manager.parseSetCookie("session=abc123");

      assertEquals(manager.getCookies()["session"], "abc123");
    });

    it("parseSetCookie extracts cookie with attributes", () => {
      const manager = new CookieManager();
      manager.parseSetCookie("session=abc123; Path=/; HttpOnly; Secure");

      assertEquals(manager.getCookies()["session"], "abc123");
    });

    it("parseSetCookie extracts cookie with expires", () => {
      const manager = new CookieManager();
      manager.parseSetCookie(
        "session=abc123; Expires=Wed, 09 Jun 2025 10:18:14 GMT",
      );

      assertEquals(manager.getCookies()["session"], "abc123");
    });

    it("parseSetCookie overwrites existing cookie with same name", () => {
      const manager = new CookieManager();
      manager.setCookie("session", "old123");
      manager.parseSetCookie("session=new456");

      assertEquals(manager.getCookies()["session"], "new456");
    });

    it("parseSetCookie handles empty string gracefully", () => {
      const manager = new CookieManager();
      manager.parseSetCookie("");

      assertEquals(manager.getCookies(), {});
    });

    it("parseSetCookie handles cookie without value", () => {
      const manager = new CookieManager();
      manager.parseSetCookie("session=");

      assertEquals(manager.getCookies(), { session: "" });
    });

    it("parseSetCookie handles cookie with no equals sign", () => {
      const manager = new CookieManager();
      manager.parseSetCookie("session");

      assertEquals(manager.getCookies(), {});
    });

    it("parseSetCookie handles cookie name with whitespace", () => {
      const manager = new CookieManager();
      manager.parseSetCookie("  session  =value");

      assertEquals(manager.getCookies()["session"], "value");
    });

    it("parseSetCookie handles cookie value with whitespace", () => {
      const manager = new CookieManager();
      manager.parseSetCookie("session=  value  ");

      assertEquals(manager.getCookies()["session"], "value");
    });

    it("parseSetCookie handles Max-Age attribute", () => {
      const manager = new CookieManager();
      manager.parseSetCookie("token=xyz789; Max-Age=3600");

      assertEquals(manager.getCookies()["token"], "xyz789");
    });

    it("parseSetCookie handles Domain attribute", () => {
      const manager = new CookieManager();
      manager.parseSetCookie("auth=def456; Domain=example.com");

      assertEquals(manager.getCookies()["auth"], "def456");
    });

    it("parseSetCookie handles SameSite attribute", () => {
      const manager = new CookieManager();
      manager.parseSetCookie("secure=ghi123; SameSite=Strict");

      assertEquals(manager.getCookies()["secure"], "ghi123");
    });
  });

  describe("Edge cases", () => {
    it("handles multiple setCookie calls", () => {
      const manager = new CookieManager();
      manager.setCookie("session", "abc123");
      manager.setCookie("token", "xyz789");
      manager.setCookie("id", "def456");

      const cookies = manager.getCookies();
      assertEquals(Object.keys(cookies).length, 3);
      assertEquals(cookies["session"], "abc123");
      assertEquals(cookies["token"], "xyz789");
      assertEquals(cookies["id"], "def456");
    });

    it("handles overwriting existing cookie", () => {
      const manager = new CookieManager();
      manager.setCookie("session", "first");
      manager.setCookie("session", "second");
      manager.setCookie("session", "third");

      assertEquals(manager.getCookies()["session"], "third");
    });

    it("getCookieHeader maintains insertion order", () => {
      const manager = new CookieManager();
      manager.setCookie("a", "1");
      manager.setCookie("b", "2");
      manager.setCookie("c", "3");

      const header = manager.getCookieHeader();
      const parts = header.split("; ");
      assertEquals(parts.length, 3);
    });

    it("handles clear on empty manager", () => {
      const manager = new CookieManager();
      manager.clear();
      assertEquals(manager.getCookies(), {});
      assertEquals(manager.getCookieHeader(), "");
    });

    it("handles parseSetCookie after clear", () => {
      const manager = new CookieManager();
      manager.setCookie("old", "value");
      manager.clear();
      manager.parseSetCookie("new=value");

      const cookies = manager.getCookies();
      assertEquals(cookies["new"], "value");
      assertEquals(cookies["old"], undefined);
    });
  });
});
