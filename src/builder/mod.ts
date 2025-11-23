/**
 * Builder module - Public API
 *
 * Exports the scenario builder factory function and types for building scenario definitions.
 *
 * @module
 */

export type * from "./types.ts";
export * from "./scenario_builder.ts";
export * from "./defaults.ts";

import { ScenarioBuilder } from "./scenario_builder.ts";
import type { BuilderScenarioOptions } from "./types.ts";

/**
 * Create a new scenario builder with fluent API
 *
 * @param name - Human-readable scenario name
 * @param options - Optional partial scenario options
 * @returns New ScenarioBuilder instance with empty result chain
 *
 * @example
 * ```ts
 * const definition = scenario("User Registration")
 *   .step("Create user", async () => {
 *     const user = await createUser({ email: "test@example.com" });
 *     return user.id;
 *   })
 *   .step("Verify email", async (ctx) => {
 *     const userId = ctx.previous;
 *     await verifyEmail(userId);
 *   })
 *   .build();
 * ```
 */
export function scenario(
  name: string,
  options?: BuilderScenarioOptions,
): ScenarioBuilder<unknown, readonly []> {
  return new ScenarioBuilder(name, options);
}
