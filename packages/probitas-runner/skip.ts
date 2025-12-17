/**
 * Skip - Exception for skipping scenario execution
 *
 * Throw this from resource/setup/step functions to skip the scenario.
 * Skipped scenarios are counted separately from passed/failed.
 *
 * @module
 */

/**
 * Exception class for conditionally skipping scenario execution.
 *
 * Throw `Skip` from any step, setup, or resource fn to skip the
 * entire scenario. Skipped scenarios are counted separately in the
 * summary and don't count as failures.
 *
 * Common use cases:
 * - Feature flags or environment checks
 * - Prerequisites not met
 * - Platform-specific tests
 * - Temporary test disabling with clear reason
 *
 * @example Skip based on environment
 * ```ts
 * import { scenario } from "@probitas/builder";
 * import { Skip } from "@probitas/runner";
 *
 * const def = scenario("Production Only")
 *   .step("Check environment", () => {
 *     if (Deno.env.get("ENV") !== "production") {
 *       throw new Skip("Only runs in production");
 *     }
 *   })
 *   .step("Production test", () => {
 *     console.log("Running in production");
 *   })
 *   .build();
 * console.log(def.name);
 * ```
 *
 * @example Skip based on resource availability
 * ```ts
 * import { scenario } from "@probitas/builder";
 * import { Skip } from "@probitas/runner";
 *
 * const Database = { connect: async () => ({ query: (sql: string) => sql }) };
 *
 * const def = scenario("Database Test")
 *   .resource("db", async () => {
 *     try {
 *       return await Database.connect();
 *     } catch {
 *       throw new Skip("Database not available");
 *     }
 *   })
 *   .step("Query data", (ctx) => ctx.resources.db.query("SELECT 1"))
 *   .build();
 * console.log(def.name);
 * ```
 *
 * @example Skip with feature flag
 * ```ts
 * import { scenario } from "@probitas/builder";
 * import { Skip } from "@probitas/runner";
 *
 * const def = scenario("Beta Feature")
 *   .step("Check feature flag", (ctx) => {
 *     if (!ctx.store.get("betaEnabled")) {
 *       throw new Skip("Beta feature not enabled");
 *     }
 *   })
 *   .build();
 * console.log(def.name);
 * ```
 */
export class Skip extends Error {
  /**
   * Human-readable reason for skipping.
   *
   * When provided, this reason is displayed in test reports.
   * If not provided, defaults to `undefined` (the error message
   * will still show "Skipped").
   */
  readonly reason?: string;

  /**
   * Create a Skip exception.
   *
   * @param reason - Optional explanation for why the scenario was skipped.
   *                 Displayed in test reports alongside the scenario name.
   *
   * @example
   * ```ts
   * import { Skip } from "@probitas/runner";
   *
   * const skip1 = new Skip();                    // message: "Skipped", reason: undefined
   * const skip2 = new Skip("Not on Windows");    // message: "Not on Windows", reason: "Not on Windows"
   * console.log(skip1.message, skip2.reason);
   * ```
   */
  constructor(reason?: string) {
    super(reason ?? "Skipped");
    this.name = "Skip";
    this.reason = reason;
  }
}
