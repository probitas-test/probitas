/**
 * HTTP headers scenario example
 *
 * Demonstrates:
 * - Setting custom headers
 * - Validating request headers
 * - Dynamic header configuration
 * - Authorization headers
 *
 * Run with:
 *   probitas run example/scenarios/headers.scenario.ts
 */

import { client, expect, scenario } from "probitas";

await using api = client.http("https://httpbin.org");

const headersScenario = scenario("HTTP Headers Management", {
  tags: ["headers", "api", "example"],
})
  .step("Set Default Headers", async () => {
    api.setHeaders({
      "X-API-Version": "v1",
      "X-Client-ID": "probitas-test",
    });

    const result = await api.get("/headers");
    expect(result.status).toBe(200);

    const headers = result.json.headers;
    expect(headers["X-Api-Version"]).toBe("v1");
    expect(headers["X-Client-Id"]).toBe("probitas-test");
  })
  .step("Add Authorization Header", async () => {
    api.setHeaders({
      "Authorization": "Bearer test-token-123",
    });

    const result = await api.get("/headers");
    expect(result.status).toBe(200);

    const headers = result.json.headers;
    expect(headers.Authorization).toBe("Bearer test-token-123");
  })
  .step("Override Headers Per Request", async () => {
    const result = await api.get("/headers", {
      headers: {
        "X-RequestID": "req-456", // Note: Cannot use "X-Request-ID" (filtered by Deno/HTTP2)
        "X-Custom-Header": "custom-value",
      },
    });

    expect(result.status).toBe(200);

    const headers = result.json.headers;
    expect(headers["X-Requestid"]).toBe("req-456"); // HTTP/2 normalizes to this format
    expect(headers["X-Custom-Header"]).toBe("custom-value");

    // Default headers still present
    expect(headers.Authorization).toBe("Bearer test-token-123");
  })
  .step("Send User-Agent", async () => {
    api.setHeaders({
      "User-Agent": "Probitas/1.0 (Testing Framework)",
    });

    const result = await api.get("/user-agent");
    expect(result.status).toBe(200);
    expect(result.json["user-agent"]).toBe(
      "Probitas/1.0 (Testing Framework)",
    );
  })
  .step("Content-Type Headers", async () => {
    const result = await api.post("/post", {
      json: { message: "Hello" },
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });

    expect(result.status).toBe(200);
    expect(result.json.json).toEqual({ message: "Hello" });
  })
  .step("Accept Headers", async () => {
    const result = await api.get("/headers", {
      headers: {
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
      },
    });

    expect(result.status).toBe(200);

    const headers = result.json.headers;
    expect(headers.Accept).toBe("application/json");
    expect(headers["Accept-Language"]).toBe("en-US,en;q=0.9");
  })
  .build();

export default headersScenario;
