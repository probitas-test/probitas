/**
 * Slow scenario example
 *
 * This example demonstrates the progress visualization and timing:
 * - Each step takes some time to complete
 * - Watch the progress while the scenario runs
 * - See how step-level timing is reported
 *
 * Run with Probitas CLI:
 *   probitas run examples/slow.scenario.ts
 * Or run directly:
 *   deno run -A examples/slow.scenario.ts
 */

import { scenario } from "probitas";

const migrationScenario = scenario("Database Migration")
  .step("Connect to database", async () => {
    // Simulate connection time
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { connected: true, host: "localhost:5432" };
  })
  .step("Backup existing data", async () => {
    // Simulate backup operation
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return { backupFile: "backup-2025-11-23.sql", size: "42MB" };
  })
  .step("Run migrations", async () => {
    // Simulate running migrations
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { migrationsRun: 5, tablesUpdated: 3 };
  })
  .step("Verify schema", async () => {
    // Simulate schema verification
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { valid: true, version: "1.5.0" };
  })
  .step("Update indexes", async () => {
    // Simulate index update
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { indexesUpdated: 7 };
  })
  .build();

export default migrationScenario;

// Run directly with Deno
if (import.meta.main) {
  const { ScenarioRunner, LiveReporter } = await import("probitas");
  const runner = new ScenarioRunner();
  const summary = await runner.run([migrationScenario], {
    reporter: new LiveReporter(),
  });

  console.log(
    `\n${summary.passed}/${summary.total} scenarios passed`,
  );
}
