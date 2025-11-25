/**
 * Retry logic scenario example
 *
 * Demonstrates:
 * - Using retry helper for flaky operations
 * - Exponential and linear backoff
 * - Retry with validation
 * - Timeout handling
 *
 * Run with:
 *   probitas run example/scenarios/retry.scenario.ts
 */

import { client, expect, retry, scenario } from "probitas";

await using api = client.http("http://localhost:8080");

const retryScenario = scenario("Retry Logic", {
  tags: ["retry", "resilience", "example"],
})
  .step("Retry with Linear Backoff", async () => {
    let attempts = 0;

    const result = await retry(
      async () => {
        attempts++;

        // Simulate operation that succeeds after a few attempts
        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }

        const response = await api.get("/get");
        expect(response.status).toBe(200);
        return response.json;
      },
      {
        maxAttempts: 5,
        backoff: "linear", // 1s, 2s, 3s, 4s...
      },
    );

    expect(result).toBeDefined();
    expect(attempts).toBe(3);
  })
  .step("Retry with Exponential Backoff", async () => {
    let attempts = 0;

    const result = await retry(
      async () => {
        attempts++;

        if (attempts < 2) {
          throw new Error(`Attempt ${attempts} failed`);
        }

        const response = await api.get("/delay/1");
        expect(response.status).toBe(200);
        return response.json;
      },
      {
        maxAttempts: 5,
        backoff: "exponential", // 1s, 2s, 4s, 8s...
      },
    );

    expect(result).toBeDefined();
    expect(attempts).toBe(2);
  })
  .step("Retry Until Success Condition", async () => {
    const result = await retry(
      async () => {
        const response = await api.get("/uuid");
        expect(response.status).toBe(200);

        // Validate response structure
        expect(response.json.uuid).toBeDefined();
        expect(typeof response.json.uuid).toBe("string");

        return response.json;
      },
      {
        maxAttempts: 3,
        backoff: "linear",
      },
    );

    expect(result.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  })
  .step("Handle Retry Failure", async () => {
    let attempts = 0;

    try {
      await retry(
        () => {
          attempts++;
          // Always fail
          throw new Error("Operation failed");
        },
        {
          maxAttempts: 3,
          backoff: "linear",
        },
      );

      // Should not reach here
      throw new Error("Expected retry to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("Operation failed");
      expect(attempts).toBe(3);
    }
  })
  .build();

export default retryScenario;
