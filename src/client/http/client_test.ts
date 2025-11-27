/**
 * Tests for HTTPClient
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { HTTPClient } from "./client.ts";

describe("HTTPClient", { permissions: { net: true } }, () => {
  it("configures all options with method chaining", async () => {
    await using client = new HTTPClient("https://api.example.com", {
      headers: { "X-Default": "default" },
    });

    client
      .setHeaders({ "X-Custom": "custom" })
      .setTimeout(10000)
      .setPoolSize(20);

    const options = client.getOptions();
    assertEquals(options.headers?.["X-Default"], "default");
    assertEquals(options.headers?.["X-Custom"], "custom");
    assertEquals(options.timeout, 10000);
    assertEquals(options.poolSize, 20);
  });

  it("manages cookies with set, get, and clear", async () => {
    await using client = new HTTPClient("https://api.example.com");

    assertEquals(client.getCookies(), {});

    client.setCookie("session", "abc123");
    assertEquals(client.getCookies()["session"], "abc123");

    client
      .setCookie("token", "xyz789")
      .clearCookies();

    assertEquals(client.getCookies(), {});
  });
});
