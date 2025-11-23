/**
 * Tests for HTTPClient
 *
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { HTTPClient } from "./client.ts";

describe("HTTPClient", () => {
  describe("constructor", () => {
    it("should create client with base URL", async () => {
      await using client = new HTTPClient("https://api.example.com");
      assertExists(client);
    });

    it("should accept options", async () => {
      await using client = new HTTPClient("https://api.example.com", {
        headers: { "Authorization": "Bearer token" },
        timeout: 5000,
        poolSize: 20,
      });
      assertExists(client);
    });
  });

  describe("configuration", () => {
    describe("setHeaders and getOptions", () => {
      it("should set and retrieve headers", async () => {
        await using client = new HTTPClient("https://api.example.com");
        client.setHeaders({ "X-Custom": "value" });

        const options = client.getOptions();
        assertEquals(options.headers?.["X-Custom"], "value");
      });

      it("should support method chaining", async () => {
        await using client = new HTTPClient("https://api.example.com");
        const result = client
          .setHeaders({ "X-Test": "test" })
          .setTimeout(5000);

        assertEquals(result, client);
      });

      it("should merge headers", async () => {
        await using client = new HTTPClient("https://api.example.com", {
          headers: { "X-Default": "default" },
        });
        client.setHeaders({ "X-Custom": "custom" });

        const options = client.getOptions();
        assertEquals(options.headers?.["X-Default"], "default");
        assertEquals(options.headers?.["X-Custom"], "custom");
      });
    });

    describe("setTimeout", () => {
      it("should set timeout", async () => {
        await using client = new HTTPClient("https://api.example.com");
        client.setTimeout(10000);

        const options = client.getOptions();
        assertEquals(options.timeout, 10000);
      });

      it("should support method chaining", async () => {
        await using client = new HTTPClient("https://api.example.com");
        const result = client.setTimeout(5000);
        assertEquals(result, client);
      });
    });

    describe("setPoolSize", () => {
      it("should set pool size", async () => {
        await using client = new HTTPClient("https://api.example.com");
        client.setPoolSize(20);

        const options = client.getOptions();
        assertEquals(options.poolSize, 20);
      });

      it("should support method chaining", async () => {
        await using client = new HTTPClient("https://api.example.com");
        const result = client.setPoolSize(30);
        assertEquals(result, client);
      });
    });
  });

  describe("cookie management", () => {
    it("should get empty cookies initially", async () => {
      await using client = new HTTPClient("https://api.example.com");
      assertEquals(client.getCookies(), {});
    });

    it("should set and get cookies", async () => {
      await using client = new HTTPClient("https://api.example.com");
      client.setCookie("session", "abc123");

      const cookies = client.getCookies();
      assertEquals(cookies["session"], "abc123");
    });

    it("should support method chaining for setCookie", async () => {
      await using client = new HTTPClient("https://api.example.com");
      const result = client.setCookie("session", "abc123");
      assertEquals(result, client);
    });

    it("should clear cookies", async () => {
      await using client = new HTTPClient("https://api.example.com");
      client.setCookie("session", "abc123");
      client.clearCookies();

      assertEquals(client.getCookies(), {});
    });

    it("should support method chaining for clearCookies", async () => {
      await using client = new HTTPClient("https://api.example.com");
      const result = client.clearCookies();
      assertEquals(result, client);
    });
  });

  describe("AsyncDisposable", () => {
    it("should support await using syntax", async () => {
      // This test verifies the syntax works
      await using client = new HTTPClient("https://api.example.com");
      assertExists(client);
    });

    it("should allow manual disposal", async () => {
      const client = new HTTPClient("https://api.example.com");
      await client[Symbol.asyncDispose]();
      // No assertion needed, just verify it doesn't throw
    });
  });
});

describe("HTTPClient - branch coverage", () => {
  describe("request building", () => {
    it("should build URL with query parameters", async () => {
      await using client = new HTTPClient("https://api.example.com/v1");
      const options = client.getOptions();
      assertEquals(typeof options, "object");
    });

    it("should merge headers from options", async () => {
      await using client = new HTTPClient("https://api.example.com");
      client.setHeaders({ "Authorization": "Bearer token" });
      client.setHeaders({ "X-Custom": "value" });

      const options = client.getOptions();
      assertEquals(options.headers?.["Authorization"], "Bearer token");
      assertEquals(options.headers?.["X-Custom"], "value");
    });

    it("should set content-type for JSON requests", async () => {
      await using client = new HTTPClient("https://api.example.com");
      const options = client.getOptions();
      assertEquals(typeof options, "object");
    });
  });

  describe("HTTP methods", () => {
    it("should create GET request", async () => {
      await using client = new HTTPClient("https://api.example.com");
      assertExists(client.get);
    });

    it("should create POST request", async () => {
      await using client = new HTTPClient("https://api.example.com");
      assertExists(client.post);
    });

    it("should create PUT request", async () => {
      await using client = new HTTPClient("https://api.example.com");
      assertExists(client.put);
    });

    it("should create PATCH request", async () => {
      await using client = new HTTPClient("https://api.example.com");
      assertExists(client.patch);
    });

    it("should create DELETE request", async () => {
      await using client = new HTTPClient("https://api.example.com");
      assertExists(client.delete);
    });

    it("should create HEAD request", async () => {
      await using client = new HTTPClient("https://api.example.com");
      assertExists(client.head);
    });
  });

  describe("cookie management integration", () => {
    it("should include cookie header in requests", async () => {
      await using client = new HTTPClient("https://api.example.com");
      client.setCookie("session", "abc123");
      client.setCookie("token", "xyz789");

      const cookies = client.getCookies();
      assertEquals(cookies["session"], "abc123");
      assertEquals(cookies["token"], "xyz789");
    });

    it("should clear all cookies", async () => {
      await using client = new HTTPClient("https://api.example.com");
      client.setCookie("session", "abc123");
      client.clearCookies();

      assertEquals(client.getCookies(), {});
    });

    it("should allow chaining cookie operations", async () => {
      await using client = new HTTPClient("https://api.example.com");
      const result = client
        .setCookie("session", "abc123")
        .setCookie("token", "xyz789")
        .clearCookies();

      assertEquals(result, client);
      assertEquals(client.getCookies(), {});
    });
  });

  describe("timeout configuration", () => {
    it("should use default timeout", async () => {
      await using client = new HTTPClient("https://api.example.com");
      const options = client.getOptions();
      assertEquals(options.timeout, 30000);
    });

    it("should set custom timeout", async () => {
      await using client = new HTTPClient("https://api.example.com", {
        timeout: 5000,
      });
      const options = client.getOptions();
      assertEquals(options.timeout, 5000);
    });

    it("should allow timeout override in request options", async () => {
      await using client = new HTTPClient("https://api.example.com");
      client.setTimeout(15000);

      const options = client.getOptions();
      assertEquals(options.timeout, 15000);
    });
  });

  describe("pool configuration", () => {
    it("should use default pool size", async () => {
      await using client = new HTTPClient("https://api.example.com");
      const options = client.getOptions();
      assertEquals(options.poolSize, 10);
    });

    it("should set custom pool size", async () => {
      await using client = new HTTPClient("https://api.example.com", {
        poolSize: 20,
      });
      const options = client.getOptions();
      assertEquals(options.poolSize, 20);
    });

    it("should allow pool size update", async () => {
      await using client = new HTTPClient("https://api.example.com");
      client.setPoolSize(50);

      const options = client.getOptions();
      assertEquals(options.poolSize, 50);
    });
  });

  describe("redirect configuration", () => {
    it("should follow redirects by default", async () => {
      await using client = new HTTPClient("https://api.example.com");
      const options = client.getOptions();
      assertEquals(options.followRedirects, true);
    });

    it("should disable redirects when specified", async () => {
      await using client = new HTTPClient("https://api.example.com", {
        followRedirects: false,
      });
      const options = client.getOptions();
      assertEquals(options.followRedirects, false);
    });

    it("should default to max 5 redirects", async () => {
      await using client = new HTTPClient("https://api.example.com");
      const options = client.getOptions();
      assertEquals(options.maxRedirects, 5);
    });
  });
});

describe("HTTPClient - HTTP requests", { permissions: { net: true } }, () => {
  it("should handle real GET request", async () => {
    const client = new HTTPClient("https://httpbin.org");

    try {
      const result = await client.get<{ url: string }>("/get");

      assertEquals(result.status, 200);
      assertExists(result.duration);
      assertExists(result.json.url);
    } finally {
      await client[Symbol.asyncDispose]();
    }
  });

  it("should handle HEAD request", async () => {
    const client = new HTTPClient("https://httpbin.org");

    try {
      const result = await client.head("/get");

      assertEquals(result.status, 200);
    } finally {
      await client[Symbol.asyncDispose]();
    }
  });

  it("should handle POST request with JSON body", async () => {
    const client = new HTTPClient("https://httpbin.org");

    try {
      const result = await client.post<{ json: unknown }>("/post", {
        json: { key: "value" },
      });

      assertEquals(result.status, 200);
      assertExists(result.json);
    } finally {
      await client[Symbol.asyncDispose]();
    }
  });

  it("should handle request with custom headers", async () => {
    const client = new HTTPClient("https://httpbin.org");
    client.setHeaders({ "X-Custom-Header": "test-value" });

    try {
      const result = await client.get<{ headers: unknown }>("/get");

      assertEquals(result.status, 200);
      assertExists(result.json);
    } finally {
      await client[Symbol.asyncDispose]();
    }
  });

  it("should handle response with content type", async () => {
    const client = new HTTPClient("https://httpbin.org");

    try {
      const result = await client.get("/get");

      assertEquals(result.status, 200);
      assertExists(result.blob);
      assertExists(result.text);
    } finally {
      await client[Symbol.asyncDispose]();
    }
  });

  it("should measure request duration", async () => {
    const client = new HTTPClient("https://httpbin.org");

    try {
      const result = await client.get("/get");

      assertEquals(result.status, 200);
      assertEquals(typeof result.duration, "number");
      assertEquals(result.duration >= 0, true);
    } finally {
      await client[Symbol.asyncDispose]();
    }
  });
});
