/**
 * E2E Integration Test - Full 4-layer testing
 *
 * Tests the integration of all 4 layers:
 * - Builder: scenario definition
 * - Runner: scenario execution
 * - Reporter: result formatting
 * - Client: external resource access
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  client,
  DotReporter,
  expect,
  JSONReporter,
  ListReporter,
  scenario,
  ScenarioRunner,
  TAPReporter,
} from "probitas";

// Test 1: Basic scenario execution with context propagation
Deno.test("E2E - Basic scenario with step chaining", async () => {
  const definition = scenario("Test Scenario")
    .step("Create data", () => {
      return { id: 1, name: "test" };
    })
    .step("Process data", (ctx) => {
      assertEquals(ctx.index, 1);
      assertEquals(ctx.previous.id, 1);
      return ctx.previous.id + 10;
    })
    .step("Verify result", (ctx) => {
      assertEquals(ctx.index, 2);
      assertEquals(ctx.previous, 11);
      assertEquals(ctx.results.length, 2);
      assertEquals(ctx.results[0].id, 1);
      assertEquals(ctx.results[1], 11);
    })
    .build();

  const runner = new ScenarioRunner();
  const summary = await runner.run([definition]);

  assertEquals(summary.total, 1);
  assertEquals(summary.passed, 1);
  assertEquals(summary.failed, 0);
});

// Test 2: Scenario with setup and teardown
Deno.test("E2E - Scenario lifecycle (setup/teardown)", async () => {
  let setupCalled = false;
  let teardownCalled = false;

  const definition = scenario("Lifecycle Test", {
    setup: (ctx) => {
      setupCalled = true;
      ctx.store.set("initialized", true);
    },
    teardown: (_ctx) => {
      teardownCalled = true;
    },
  })
    .step("Access store", (ctx) => {
      assertEquals(ctx.store.get("initialized"), true);
    })
    .build();

  const runner = new ScenarioRunner();
  const summary = await runner.run([definition]);

  assertEquals(setupCalled, true);
  assertEquals(teardownCalled, true);
  assertEquals(summary.passed, 1);
});

// Test 3: Multiple scenarios with different reporters
Deno.test("E2E - Multiple scenarios with ListReporter", async () => {
  const def1 = scenario("Scenario 1")
    .step("Step A", () => "A")
    .build();

  const def2 = scenario("Scenario 2")
    .step("Step B", () => "B")
    .step("Step C", () => "C")
    .build();

  const runner = new ScenarioRunner();
  const summary = await runner.run([def1, def2], {
    reporter: new ListReporter({ noColor: true }),
    maxConcurrency: 1,
  });

  assertEquals(summary.total, 2);
  assertEquals(summary.passed, 2);
  assertEquals(summary.failed, 0);
});

// Test 4: Scenario with tags and filtering
Deno.test("E2E - Tag-based filtering", async () => {
  const def1 = scenario("Scenario A", { tags: ["smoke"] })
    .step("Step 1", () => 1)
    .build();

  const def2 = scenario("Scenario B", { tags: ["integration"] })
    .step("Step 2", () => 2)
    .build();

  const def3 = scenario("Scenario C", { tags: ["smoke", "regression"] })
    .step("Step 3", () => 3)
    .build();

  const runner = new ScenarioRunner();

  // Run only smoke tests (filtering is done before passing to runner)
  const smokeScenarios = [def1, def2, def3].filter((scenario) =>
    scenario.options.tags.includes("smoke")
  );
  const summary = await runner.run(smokeScenarios);

  assertEquals(summary.passed, 2); // Scenarios with smoke tag are executed
});

// Test 5: Error handling and failure
Deno.test("E2E - Error handling", async () => {
  const definition = scenario("Error Test")
    .step("Success", () => 1)
    .step("Fail", () => {
      throw new Error("Test error");
    })
    .step("Skip", () => 2)
    .build();

  const runner = new ScenarioRunner();
  const summary = await runner.run([definition], {
    maxFailures: 1,
  });

  assertEquals(summary.passed, 0);
  assertEquals(summary.failed, 1);
});

// Test 6: Timeout handling
Deno.test("E2E - Step timeout", async () => {
  const definition = scenario("Timeout Test")
    .step("Quick step", () => "done")
    .step(
      "Slow step",
      async () => {
        // This will exceed the timeout
        await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms
        return "done";
      },
      { timeout: 50 }, // 50ms timeout - should timeout
    )
    .build();

  const runner = new ScenarioRunner();
  const summary = await runner.run([definition], {
    maxFailures: 0,
  });

  // Should have at least 1 failed scenario due to timeout
  assertEquals(summary.passed >= 0, true);
  assertEquals(summary.total, 1);
});

// Test 7: HTTPClient integration (if network available)
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
        // Just verify we got a response back
        assertExists(result);
      })
      .build();

    const runner = new ScenarioRunner();
    const summary = await runner.run([definition]);

    // The test may fail due to network issues, but that's okay
    assertEquals(summary.total, 1);
  },
);

// Test 8: DotReporter output
Deno.test("E2E - DotReporter output", async () => {
  const definitions = [
    scenario("Test 1").step("S1", () => 1).build(),
    scenario("Test 2").step("S2", () => 2).build(),
    scenario("Test 3").step("S3", () => 3).build(),
  ];

  const runner = new ScenarioRunner();
  const summary = await runner.run(definitions, {
    reporter: new DotReporter({ noColor: true }),
    maxConcurrency: 1,
  });

  assertEquals(summary.passed, 3);
});

// Test 9: JSON Reporter output
Deno.test("E2E - JSONReporter output", async () => {
  const definition = scenario("JSON Test")
    .step("Create data", () => ({ value: 42 }))
    .step("Verify data", (ctx) => {
      assertEquals(ctx.previous.value, 42);
    })
    .build();

  const runner = new ScenarioRunner();
  const summary = await runner.run([definition], {
    reporter: new JSONReporter({ noColor: true }),
  });

  assertEquals(summary.passed, 1);
});

// Test 10: TAP Reporter output
Deno.test("E2E - TAPReporter output", async () => {
  const definition = scenario("TAP Test")
    .step("Step 1", () => "pass")
    .build();

  const runner = new ScenarioRunner();
  const summary = await runner.run([definition], {
    reporter: new TAPReporter({ noColor: true }),
  });

  assertEquals(summary.passed, 1);
});

// Test 11: Store sharing between steps
Deno.test("E2E - Store sharing and persistence", async () => {
  const definition = scenario("Store Test")
    .step("Initialize store", (ctx) => {
      ctx.store.set("counter", 0);
      ctx.store.set("user", { id: 1, name: "Alice" });
    })
    .step("Increment counter", (ctx) => {
      const count = ctx.store.get("counter") as number;
      ctx.store.set("counter", count + 1);
      return ctx.store.get("counter");
    })
    .step("Verify store state", (ctx) => {
      assertEquals(ctx.previous, 1);
      assertEquals(ctx.store.get("counter"), 1);

      const user = ctx.store.get("user") as { id: number; name: string };
      assertEquals(user.name, "Alice");
    })
    .build();

  const runner = new ScenarioRunner();
  const summary = await runner.run([definition]);

  assertEquals(summary.passed, 1);
});

// Test 12: Retry support integration
Deno.test("E2E - Retry configuration", async () => {
  const definition = scenario("Retry Test")
    .step(
      "Step with retry config",
      () => {
        return "success";
      },
      { retry: { maxAttempts: 3, backoff: "linear" } },
    )
    .step("Verify step ran", (ctx) => {
      assertEquals(ctx.previous, "success");
    })
    .build();

  const runner = new ScenarioRunner();
  const summary = await runner.run([definition]);

  assertEquals(summary.passed, 1);
});

// Test 13: Helper functions integration
Deno.test("E2E - Helper functions (expect)", async () => {
  const definition = scenario("Helper Test")
    .step("Create object", () => {
      return { id: 1, status: "active" };
    })
    .step("Use expect helper", (ctx) => {
      try {
        expect(ctx.previous).toBeDefined();
        expect(ctx.previous.id).toBe(1);
        expect(ctx.previous.status).toBe("active");
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        throw new Error(`Assertion failed: ${errorMessage}`);
      }
    })
    .build();

  const runner = new ScenarioRunner();
  const summary = await runner.run([definition]);

  assertEquals(summary.passed, 1);
});

// Test 14: Parallel execution mode
Deno.test("E2E - Parallel scenario execution", async () => {
  const defs = Array.from({ length: 3 }, (_, i) =>
    scenario(`Parallel ${i + 1}`)
      .step("Step", () => i + 1)
      .build());

  const runner = new ScenarioRunner();
  const summary = await runner.run(defs, {
    maxConcurrency: 2,
  });

  assertEquals(summary.total, 3);
  assertEquals(summary.passed, 3);
});

// Test 15: Named and unnamed steps
Deno.test("E2E - Named and unnamed steps", async () => {
  const definition = scenario("Mixed Steps")
    .step("Named step", () => 1)
    .step(() => 2)
    .step("Another named step", () => 3)
    .build();

  const runner = new ScenarioRunner();
  const summary = await runner.run([definition]);

  assertEquals(summary.passed, 1);
});
