/**
 * Error handling scenario example
 *
 * Demonstrates:
 * - Handling HTTP error responses
 * - Validating error status codes
 * - Error response structure validation
 * - Graceful error handling
 *
 * Run with:
 *   probitas run example/scenarios/error-handling.scenario.ts
 */

import { client, expect, scenario } from "probitas";

await using api = client.http("http://localhost:8080");

const errorHandlingScenario = scenario("Error Handling", {
  tags: ["error", "validation", "example"],
})
  .step("Handle 404 Not Found", async () => {
    const result = await api.get("/status/404");

    expect(result.status).toBe(404);
    expect(result.statusText).toBe("Not Found");
  })
  .step("Handle 400 Bad Request", async () => {
    const result = await api.get("/status/400");

    expect(result.status).toBe(400);
    expect(result.statusText).toBe("Bad Request");
  })
  .step("Handle 401 Unauthorized", async () => {
    const result = await api.get("/status/401");

    expect(result.status).toBe(401);
    expect(result.statusText).toBe("Unauthorized");
  })
  .step("Handle 403 Forbidden", async () => {
    const result = await api.get("/status/403");

    expect(result.status).toBe(403);
    expect(result.statusText).toBe("Forbidden");
  })
  .step("Handle 500 Server Error", async () => {
    const result = await api.get("/status/500");

    // httpbin sometimes returns 502 Bad Gateway instead of 500 due to server issues
    expect(result.status >= 500 && result.status < 600).toBe(true);
  })
  .step("Handle 503 Service Unavailable", async () => {
    const result = await api.get("/status/503");

    expect(result.status).toBe(503);
    expect(result.statusText).toBe("Service Unavailable");
  })
  .step("Validate Error Response Format", async () => {
    // Most APIs return error details in JSON
    const result = await api.post("/status/422", {
      json: { invalid: "data" },
    });

    expect(result.status).toBe(422);
    // httpbin returns empty body for status endpoints
    // In real APIs, you would validate error structure:
    // expect(result.json).toHaveProperty('error');
    // expect(result.json).toHaveProperty('message');
  })
  .build();

export default errorHandlingScenario;
