/**
 * Basic scenario example
 *
 * This example demonstrates the fundamental features of Probitas:
 * - Creating scenarios with setup and teardown
 * - Defining steps with type-safe result passing
 * - Using helper functions (defer, expect)
 * - Accessing shared state via context.store
 * - Running with ScenarioRunner and ListReporter
 *
 * Run with Probitas CLI:
 *   probitas run examples/basic.scenario.ts
 * Or run directly:
 *   deno run -A examples/basic.scenario.ts
 */

import { defer, expect, scenario } from "probitas";

// Create a basic scenario
const basicScenario = scenario("Basic Example", {
  tags: ["example", "basic"],

  setup: (ctx) => {
    ctx.store.set("startTime", Date.now());
    ctx.store.set("counter", 0);
  },

  teardown: (_ctx) => {
    // Cleanup if needed
  },
})
  .step("Initialize data", () => {
    return {
      value: 42,
      message: "Hello, Probitas!",
    };
  })
  .step("Process data", (ctx) => {
    // Access previous step's result with full type safety
    expect(ctx.previous.value).toBe(42);
    expect(ctx.previous.message).toContain("Probitas");

    // Update shared state
    const counter = (ctx.store.get("counter") as number) + 1;
    ctx.store.set("counter", counter);

    return ctx.previous.value * 2;
  })
  .step("Verify results", (ctx) => {
    // Access previous step's result
    expect(ctx.previous).toBe(84);

    // Access all previous results via ctx.results
    expect(ctx.results[0].value).toBe(42);
    expect(ctx.results[0].message).toBe("Hello, Probitas!");
    expect(ctx.results[1]).toBe(84);

    // Update counter
    const counter = (ctx.store.get("counter") as number) + 1;
    ctx.store.set("counter", counter);
  })
  .step("Cleanup with defer", async () => {
    // Use defer for automatic cleanup
    await using _cleanup = defer(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 10));
  })
  .build();

export default basicScenario;

// Run directly with Deno
if (import.meta.main) {
  const { ScenarioRunner, ListReporter } = await import("probitas");
  const runner = new ScenarioRunner();
  await runner.run([basicScenario], {
    reporter: new ListReporter(),
  });
}
