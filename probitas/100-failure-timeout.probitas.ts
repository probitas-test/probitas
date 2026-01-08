/**
 * Timeout Failure Examples
 *
 * This file demonstrates timeout scenarios for step-level and scenario-level timeouts.
 * All scenarios are expected to fail due to timeouts.
 *
 * ## Step Timeout
 * Individual steps can specify a timeout via step options.
 * When a step exceeds its timeout, it fails with StepTimeoutError.
 *
 * ## Scenario Timeout
 * Scenario timeout is configured via CLI (`--timeout 2s`) or config file (`timeout: "2s"`).
 * To test scenario timeout, run:
 * ```
 * deno task probitas run probitas/100-failure-timeout.probitas.ts -s "Scenario timeout test$" --timeout 2s
 * ```
 * The `scenarioTimeoutTest` scenario takes ~3 seconds and will timeout with 2s limit.
 */
import { delay } from "@std/async/delay";
import { scenario } from "../src/mod.ts";

export const stepTimeout = scenario("Timeout - Step timeout", {
  tags: ["failure", "timeout"],
})
  .step(
    "Step exceeds timeout",
    async () => {
      // Wait 2 seconds but timeout is set to 1 second
      await delay(2000);
      return { completed: true };
    },
    {
      timeout: 1000, // 1 second timeout
    },
  )
  .build();

export const stepTimeoutWithRetry = scenario(
  "Timeout - Step timeout with retry",
  {
    tags: ["failure", "timeout"],
  },
)
  .step(
    "Step times out on all retry attempts",
    async (ctx) => {
      // Each attempt will timeout
      await delay(2000);
      return { attempt: ctx.index };
    },
    {
      timeout: 1000, // 1 second timeout
      retry: {
        maxAttempts: 3,
        backoff: "linear",
      },
    },
  )
  .build();

export const scenarioTimeoutTest = scenario("Timeout - Scenario timeout test", {
  tags: ["failure", "timeout"],
})
  .step("First step - 1s", async () => {
    await delay(1000);
    return { step: 1 };
  }, { timeout: 60000 }) // Long step timeout to let scenario timeout trigger first
  .step("Second step - 1s", async () => {
    await delay(1000);
    return { step: 2 };
  }, { timeout: 60000 })
  .step("Third step - 1s", async () => {
    // When run with --timeout 2s, scenario timeout triggers during this step
    await delay(1000);
    return { step: 3 };
  }, { timeout: 60000 })
  .build();

export const scenarioTimeoutTestMultipleSteps = scenario(
  "Timeout - Scenario timeout with many steps",
  {
    tags: ["failure", "timeout"],
  },
)
  .step("Step 1 - 500ms", async () => {
    await delay(500);
    return { step: 1 };
  })
  .step("Step 2 - 500ms", async () => {
    await delay(500);
    return { step: 2 };
  })
  .step("Step 3 - 500ms", async () => {
    await delay(500);
    return { step: 3 };
  })
  .step("Step 4 - 500ms", async () => {
    await delay(500);
    return { step: 4 };
  })
  .step("Step 5 - 500ms", async () => {
    // When run with --timeout 1.5s, scenario timeout triggers during this step
    await delay(500);
    return { step: 5 };
  })
  .build();

export default [
  stepTimeout,
  stepTimeoutWithRetry,
  scenarioTimeoutTest,
  scenarioTimeoutTestMultipleSteps,
];
