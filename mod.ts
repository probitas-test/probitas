/**
 * Probitas - Scenario-based testing and workflow execution framework
 *
 * A 5-layer architecture framework for scenario-based testing:
 * - Builder: Fluent API for scenario definition
 * - Runner: Execution engine with lifecycle management
 * - Reporter: Multiple output formats (TAP, JSON, List, Live, Dot)
 * - Theme: Semantic color functions for output formatting
 * - Client: High-level APIs for external resources (HTTP, etc.)
 *
 * @example Basic usage
 * ```ts
 * import { scenario } from "probitas";
 *
 * export default scenario("My Test")
 *   .step("Step 1", () => {
 *     return { value: 42 };
 *   })
 *   .step("Step 2", (ctx) => {
 *     assertEquals(ctx.previous.value, 42);
 *   })
 *   .build();
 * ```
 *
 * @module
 */

export * from "./src/builder/mod.ts";
export * from "./src/runner/mod.ts";
export * from "./src/reporter/mod.ts";
export * from "./src/client/mod.ts";
export * from "./src/helper/mod.ts";
