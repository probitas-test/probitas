/**
 * Environment-based scenario example
 *
 * Demonstrates:
 * - Using environment variables
 * - Conditional scenario skipping
 * - Environment-specific configuration
 * - Dynamic base URLs
 *
 * Run with:
 *   TEST_ENV=production probitas run example/scenarios/environment.scenario.ts
 */

import { client, env, expect, scenario } from "probitas";

// Use environment variable for base URL
const API_BASE = env.get("API_URL", "https://httpbin.org");
const TEST_ENV = env.get("TEST_ENV", "development");

await using api = client.http(API_BASE);

// Scenario that runs only in production
const prodOnlyScenario = scenario("Production Only Features", {
  tags: ["environment", "production", "example"],
  skip: () => {
    if (TEST_ENV !== "production") {
      return `Skipped: Only runs in production (current: ${TEST_ENV})`;
    }
    return false;
  },
})
  .step("Test Production Feature", async () => {
    const result = await api.get("/get");
    expect(result.status).toBe(200);
    console.log(`Running in ${TEST_ENV} environment`);
  })
  .build();

// Scenario that skips in production
const devOnlyScenario = scenario("Development Only Features", {
  tags: ["environment", "development", "example"],
  skip: () => {
    if (TEST_ENV === "production") {
      return "Skipped: Not safe for production";
    }
    return false;
  },
})
  .step("Test Debug Features", async () => {
    const result = await api.get("/delay/1");
    expect(result.status).toBe(200);
    console.log("Debug mode enabled");
  })
  .build();

// Scenario that always runs
const envConfigScenario = scenario("Environment Configuration", {
  tags: ["environment", "config", "example"],
})
  .step("Check Environment Variables", () => {
    const hasApiUrl = env.has("API_URL");
    const hasApiKey = env.has("API_KEY");
    const testEnv = env.get("TEST_ENV", "development");

    console.log("Environment variables:");
    console.log(
      `  API_URL: ${hasApiUrl ? API_BASE : "not set (using default)"}`,
    );
    console.log(`  API_KEY: ${hasApiKey ? "present" : "not set"}`);
    console.log(`  TEST_ENV: ${testEnv}`);

    return { testEnv, hasApiUrl, hasApiKey };
  })
  .step("Verify API Connection", async (ctx) => {
    const config = ctx.previous;

    const result = await api.get("/get");
    expect(result.status).toBe(200);

    console.log(`Successfully connected to ${API_BASE}`);
    return config;
  })
  .step("Environment-Specific Settings", (ctx) => {
    const config = ctx.previous;

    const settings = {
      timeout: config.testEnv === "production" ? 30000 : 60000,
      retryAttempts: config.testEnv === "production" ? 3 : 1,
      logLevel: config.testEnv === "production" ? "error" : "debug",
    };

    console.log("Environment settings:");
    console.log(`  Timeout: ${settings.timeout}ms`);
    console.log(`  Retry attempts: ${settings.retryAttempts}`);
    console.log(`  Log level: ${settings.logLevel}`);

    return settings;
  })
  .build();

// Conditional timeout based on environment
const timeoutScenario = scenario("Environment-Based Timeout", {
  tags: ["environment", "timeout", "example"],
  stepOptions: {
    timeout: TEST_ENV === "production" ? 10000 : 30000,
  },
})
  .step("Test with Environment Timeout", async () => {
    const result = await api.get("/delay/1");
    expect(result.status).toBe(200);
    console.log(
      `Timeout: ${TEST_ENV === "production" ? "10s (prod)" : "30s (dev)"}`,
    );
  })
  .build();

export default [
  prodOnlyScenario,
  devOnlyScenario,
  envConfigScenario,
  timeoutScenario,
];
