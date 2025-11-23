/**
 * Advanced scenario example
 *
 * This example demonstrates advanced features:
 * - Step-level retry with exponential backoff
 * - Step timeout configuration
 * - Conditional skipping
 * - Environment variable usage
 * - Error handling with proper cleanup
 * - Running with different reporters
 *
 * Run with Probitas CLI:
 *   probitas run examples/advanced.scenario.ts
 * Or run directly:
 *   deno run -A examples/advanced.scenario.ts
 */

import { defer, env, expect, retry, scenario } from "probitas";

// Example: Retry with exponential backoff
const retryScenario = scenario("Advanced Retry Example", {
  tags: ["example", "advanced", "retry"],
  stepOptions: {
    timeout: 5000, // Default timeout for all steps
    retry: { maxAttempts: 1, backoff: "linear" },
  },
})
  .step("Simulate flaky operation", async () => {
    // Use retry helper directly for more control
    return await retry(
      () => {
        const random = Math.random();
        // Reduced failure rate from 70% to 50% for more reliable testing
        if (random < 0.5) {
          throw new Error("Temporary failure (simulated)");
        }
        return { success: true, value: random };
      },
      {
        maxAttempts: 10, // Increased from 5 to 10 for higher success rate
        backoff: "exponential",
      },
    );
  })
  .step("Verify retry result", (ctx) => {
    expect(ctx.previous.success).toBe(true);
    expect(ctx.previous.value).toBeGreaterThanOrEqual(0);
  })
  .build();

// Example: Environment variables and conditional skip
const envScenario = scenario("Environment Variables Example", {
  tags: ["example", "advanced", "env"],

  // Skip this scenario if TEST_ENV is not set to "production"
  skip: () => env.get("TEST_ENV", "development") !== "production",
})
  .step("Read environment variables", () => {
    // Get optional environment variable with default
    const environment = env.get("TEST_ENV", "development");

    // Check if variable exists
    const hasDebug = env.has("DEBUG");

    return { environment, hasDebug };
  })
  .step("Use environment config", (ctx) => {
    expect(ctx.previous.environment).toBe("production");
  })
  .build();

// Example: Resource cleanup with defer
const cleanupScenario = scenario("Resource Cleanup Example", {
  tags: ["example", "advanced", "cleanup"],
})
  .step("Acquire and release resources", async () => {
    // Simulate resource acquisition
    const resource = { id: "resource-123", active: true };

    // Ensure cleanup happens even if step fails
    await using _cleanup = defer(async () => {
      resource.active = false;
      await new Promise((resolve) => setTimeout(resolve, 5));
    });

    expect(resource.active).toBe(true);

    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 10));

    return { resourceId: resource.id };
  })
  .step("Verify cleanup", (ctx) => {
    expect(ctx.previous.resourceId).toBe("resource-123");
  })
  .build();

// Example: Timeout and retry configuration
const timeoutScenario = scenario("Timeout Example", {
  tags: ["example", "advanced", "timeout"],
})
  .step(
    "Fast operation",
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return "fast";
    },
    { timeout: 1000 }, // 1 second timeout
  )
  .step(
    "Operation with custom retry",
    async () => {
      let attempts = 0;
      return await retry(
        () => {
          attempts++;
          if (attempts < 2) {
            throw new Error("First attempt fails");
          }
          return "success";
        },
        {
          maxAttempts: 3,
          backoff: "linear",
        },
      );
    },
    {
      timeout: 10000,
      retry: {
        maxAttempts: 3,
        backoff: "exponential",
      },
    },
  )
  .step("Final verification", (ctx) => {
    expect(ctx.results[0]).toBe("fast");
    expect(ctx.results[1]).toBe("success");
  })
  .build();

export default [retryScenario, envScenario, cleanupScenario, timeoutScenario];

// Run directly with Deno
if (import.meta.main) {
  const { ScenarioRunner, ListReporter } = await import("probitas");
  const runner = new ScenarioRunner();
  await runner.run(
    [retryScenario, envScenario, cleanupScenario, timeoutScenario],
    {
      reporter: new ListReporter(),
    },
  );
}
