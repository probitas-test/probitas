/**
 * E2E Integration Test
 *
 * Tests real integration with external resources.
 * Component-level integration is covered by unit tests.
 *
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import { client, scenario, ScenarioRunner } from "probitas";

// Real E2E: HTTPClient integration with external resource
Deno.test(
  "E2E - HTTPClient in scenario",
  { permissions: { net: true } },
  async () => {
    const definition = scenario("HTTP Test")
      .step("Create HTTP client", () => {
        return client.http("http://localhost:8080");
      })
      .step("Make GET request", async (ctx) => {
        const api = ctx.previous;
        const result = await api.get("/get");
        assertExists(result.status);
        return result;
      })
      .step("Verify response", (ctx) => {
        const result = ctx.previous;
        assertExists(result);
      })
      .build();

    const runner = new ScenarioRunner();
    const summary = await runner.run([definition]);

    assertEquals(summary.total, 1);
  },
);
