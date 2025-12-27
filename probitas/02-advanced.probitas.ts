/**
 * Advanced Scenario Example
 *
 * This example demonstrates advanced probitas features:
 * - Resources for shared dependencies
 * - Setup/cleanup hooks with Disposable pattern
 * - Accessing ctx.results for any previous step
 * - Scenario options (tags)
 * - Step options (timeout, retry)
 * - Async operations
 * - Skip for conditional execution
 */
import { expect, scenario, Skip } from "jsr:@probitas/probitas@^0";

// Simulated database for demonstration
class MockDatabase {
  #data = new Map<string, unknown>();

  async connect(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  async disconnect(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10));
    this.#data.clear();
  }

  async set(key: string, value: unknown): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 5));
    this.#data.set(key, value);
  }

  async get<T>(key: string): Promise<T | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 5));
    return this.#data.get(key) as T | undefined;
  }
}

export default scenario("Advanced Example", {
  tags: ["integration", "database"],
})
  // Register a database resource
  .resource("db", async () => {
    const db = new MockDatabase();
    await db.connect();
    return db;
  })
  // Setup hook with cleanup using Disposable pattern
  .setup(async (ctx) => {
    const { db } = ctx.resources;
    await db.set("initialized", true);

    // Return cleanup function
    return async () => {
      await db.disconnect();
    };
  })
  .step("Create user", async (ctx) => {
    const { db } = ctx.resources;
    const user = {
      id: crypto.randomUUID(),
      name: "Test User",
      email: "test@example.com",
      createdAt: new Date().toISOString(),
    };
    await db.set(`user:${user.id}`, user);
    return user;
  })
  .step(
    "Verify user persistence",
    async (ctx) => {
      const { db } = ctx.resources;
      const { id } = ctx.previous;
      const stored = await db.get<{ id: string; name: string }>(`user:${id}`);
      expect(stored).not.toBeUndefined();
      expect(stored!.id).toBe(id);
      return { verified: true, userId: id };
    },
    {
      timeout: 5000,
      retry: { maxAttempts: 3, backoff: "exponential" },
    },
  )
  .step("Access all results", (ctx) => {
    // ctx.results contains all previous step results as a tuple
    const [createResult, verifyResult] = ctx.results;
    return {
      summary: {
        userCreated: createResult.name,
        verificationPassed: verifyResult.verified,
        totalSteps: ctx.index + 1,
      },
    };
  })
  .step("Optional analytics step", () => {
    // Skip if analytics endpoint is not configured
    // This demonstrates Skip usage for optional functionality
    if (!Deno.env.get("ANALYTICS_ENDPOINT")) {
      throw new Skip("Analytics endpoint not configured");
    }
    return { analyticsEnabled: true };
  })
  .step("Final cleanup check", (ctx) => {
    // This step runs after analytics (or after skip)
    // Note: If previous step was skipped, the entire scenario is skipped
    // and this step will NOT execute
    return {
      completed: true,
      previousStepCount: ctx.results.length,
    };
  })
  .build();
