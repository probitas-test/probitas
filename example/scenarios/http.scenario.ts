/**
 * HTTP Client scenario example
 *
 * This example demonstrates HTTP client usage with scenarios:
 * - Creating HTTP clients with AsyncDisposable pattern
 * - Making various HTTP requests (GET, POST, PUT, DELETE)
 * - Handling responses and assertions
 * - Header and Cookie management
 * - Error handling
 *
 * Run with Probitas CLI:
 *   probitas run examples/http.scenario.ts
 * Or run directly:
 *   deno run -A examples/http.scenario.ts
 */

import { client, expect, scenario } from "probitas";

// Example 1: Basic GET request
const basicGetScenario = scenario("Basic HTTP GET", {
  tags: ["http", "get"],
})
  .step("Create HTTP client", () => {
    return client.http("http://localhost:8080");
  })
  .step("Make GET request", async (ctx) => {
    const api = ctx.previous;
    const result = await api.get("/get?foo=bar");
    return result;
  })
  .step("Verify response", (ctx) => {
    const result = ctx.previous;
    expect(result.status).toBe(200);
    expect(result.headers).toBeDefined();
  })
  .build();

// Example 2: POST request with headers
const postScenario = scenario("HTTP POST with headers", {
  tags: ["http", "post"],
})
  .step("Create HTTP client", () => {
    return client.http("http://localhost:8080");
  })
  .step("Make POST request", async (ctx) => {
    const api = ctx.previous;
    api.setHeaders({
      "Content-Type": "application/json",
      "X-Custom-Header": "test-value",
    });

    const result = await api.post("/post", {
      json: { name: "test", value: 42 },
    });

    return result;
  })
  .step("Verify response", (ctx) => {
    const result = ctx.previous;
    expect(result.status).toBe(200);
    // Verify request body was received
    const json = result.json as Record<string, unknown>;
    expect(json.headers).toBeDefined();
  })
  .build();

// Example 3: Handling response bodies
const responseBodyScenario = scenario("HTTP response body parsing", {
  tags: ["http", "response"],
})
  .step("Create HTTP client", () => {
    return client.http("http://localhost:8080");
  })
  .step("Fetch JSON response", async (ctx) => {
    const api = ctx.previous;
    const result = await api.get("/json");
    return result;
  })
  .step("Parse and verify JSON", (ctx) => {
    const result = ctx.previous;
    expect(result.status).toBe(200);

    // Access different body formats
    const text = result.text;
    const json = result.json;

    expect(typeof text).toBe("string");
    expect(json).toBeDefined();
  })
  .build();

// Example 4: Multiple requests in sequence
const multipleRequestsScenario = scenario("Multiple HTTP requests", {
  tags: ["http", "multiple"],
})
  .step("Create HTTP client", () => {
    return client.http("http://localhost:8080");
  })
  .step("First GET request", async (ctx) => {
    const api = ctx.previous;
    return await api.get("/get");
  })
  .step("Second GET request", async (ctx) => {
    const api = ctx.results[0];
    return await api.get("/status/200");
  })
  .step("Verify results", (ctx) => {
    const firstResult = ctx.results[1];
    const secondResult = ctx.previous;

    expect(firstResult.status).toBe(200);
    expect(secondResult.status).toBe(200);
  })
  .build();

// Example 5: Error handling
const errorHandlingScenario = scenario("HTTP error handling", {
  tags: ["http", "error"],
})
  .step("Create HTTP client", () => {
    return client.http("http://localhost:8080");
  })
  .step("Request non-existent endpoint", async (ctx) => {
    const api = ctx.previous;
    try {
      const result = await api.get("/status/404");
      // 404 is still a successful response, just with error status
      return { status: result.status, ok: result.status < 400 };
    } catch (error) {
      return { error: String(error) };
    }
  })
  .step("Verify error status", (ctx) => {
    const result = ctx.previous;
    if ("ok" in result) {
      expect(result.ok).toBe(false);
    }
  })
  .build();

// Example 6: Custom timeout configuration
const timeoutScenario = scenario("HTTP with timeout", {
  tags: ["http", "timeout"],
})
  .step("Create HTTP client with timeout", () => {
    const api = client.http("http://localhost:8080");
    api.setTimeout(5000); // 5 second timeout
    return api;
  })
  .step("Make request with timeout", async (ctx) => {
    const api = ctx.previous;
    // This endpoint responds quickly, so should succeed
    return await api.get("/get");
  })
  .step("Verify success", (ctx) => {
    expect(ctx.previous.status).toBe(200);
  })
  .build();

export default [
  basicGetScenario,
  postScenario,
  responseBodyScenario,
  multipleRequestsScenario,
  errorHandlingScenario,
  timeoutScenario,
];

// Run directly with Deno
if (import.meta.main) {
  const { ScenarioRunner, ListReporter } = await import("probitas");
  const runner = new ScenarioRunner();
  const summary = await runner.run(
    [
      basicGetScenario,
      postScenario,
      responseBodyScenario,
      multipleRequestsScenario,
      errorHandlingScenario,
      timeoutScenario,
    ],
    {
      reporter: new ListReporter(),
    },
  );

  console.log(
    `\n${summary.passed}/${summary.total} scenarios passed`,
  );
  if (summary.failed > 0) {
    console.log(`${summary.failed} scenarios failed`);
  }
}
