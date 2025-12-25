/**
 * Builder module for creating scenario definitions with a fluent, type-safe API.
 *
 * This package provides the {@linkcode scenario} fn function that returns a builder
 * for constructing scenario definitions. The builder uses method chaining to define
 * resources, setup functions, and test steps with full TypeScript type inference.
 *
 * ## Links
 *
 * - [GitHub Repository](https://github.com/probitas-test/probitas)
 * - [@probitas/probitas](https://jsr.io/@probitas/probitas) - Main package (recommended for most users)
 *
 * ## Related Packages
 *
 * | Package | Description |
 * |---------|-------------|
 * | [@probitas/core](https://jsr.io/@probitas/core) | Core type definitions used by this builder |
 * | [@probitas/runner](https://jsr.io/@probitas/runner) | Executes scenarios built with this package |
 *
 * ## Key Features
 *
 * - **Fluent API**: Chain methods naturally to build complex scenarios
 * - **Type-safe context**: Each step receives typed access to previous step results
 * - **Resource management**: Register resources with automatic lifecycle handling
 * - **Setup/Cleanup**: Define setup functions with automatic cleanup support
 * - **Configurable defaults**: Override timeout and retry settings at any level
 *
 * ## Core Exports
 *
 * - {@linkcode scenario} - Factory function to create a new scenario builder
 * - {@linkcode StepContext} - Type representing the context passed to step functions
 * - {@linkcode StepFunction} - Type signature for step functions
 * - {@linkcode SetupFunction} - Type signature for setup functions
 * - {@linkcode ResourceFunction} - Type signature for resource fn functions
 * - {@linkcode BuilderScenarioOptions} - Partial options for scenario configuration
 * - {@linkcode BuilderStepOptions} - Partial options for step configuration
 * - {@linkcode DEFAULT_SCENARIO_OPTIONS} - Default values for scenario options
 * - {@linkcode DEFAULT_STEP_OPTIONS} - Default values for step options
 *
 * @example Basic scenario building
 * ```ts
 * import { scenario } from "@probitas/builder";
 *
 * export default scenario("My Scenario")
 *   .step("First step", () => {
 *     return { value: 42 };
 *   })
 *   .step("Second step", (ctx) => {
 *     console.log(ctx.previous.value); // 42 - fully typed!
 *   })
 *   .build();
 * ```
 *
 * @example With resources and setup
 * ```ts
 * import { scenario } from "@probitas/builder";
 *
 * // Mock database connection for example
 * const connectDatabase = () =>
 *   Promise.resolve({
 *     query: (_sql: string) => Promise.resolve(),
 *     async [Symbol.asyncDispose]() {},
 *   });
 *
 * export default scenario("Database Test")
 *   .resource("db", async () => {
 *     const conn = await connectDatabase();
 *     return conn; // Automatically disposed if it has [Symbol.asyncDispose]
 *   })
 *   .setup(async (ctx) => {
 *     await ctx.resources.db.query("DELETE FROM test_table");
 *     return () => ctx.resources.db.query("DROP TABLE test_table");
 *   })
 *   .step("Insert data", async (ctx) => {
 *     await ctx.resources.db.query("INSERT INTO test_table VALUES (1)");
 *   })
 *   .build();
 * ```
 *
 * @example Custom step options
 * ```ts
 * import { scenario } from "@probitas/builder";
 *
 * export default scenario("Retry Test", {
 *   stepOptions: { timeout: 30000 } // Default timeout for all steps
 * })
 *   .step("Flaky operation", async () => {
 *     // This step will retry up to 3 times with exponential backoff
 *   }, { retry: { maxAttempts: 3, backoff: "exponential" } })
 *   .build();
 * ```
 *
 * @module
 */

export type * from "./types.ts";
export { scenario } from "./scenario_builder.ts";
