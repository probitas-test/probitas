/**
 * Probitas - Scenario-based testing and workflow execution framework
 *
 * A framework for scenario-based testing:
 * - Builder: Fluent API for scenario definition
 * - Runner: Execution engine with lifecycle management
 * - Reporter: Multiple output formats (TAP, JSON, List, Dot)
 * - Theme: Semantic color functions for output formatting
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
 *     if (ctx.previous.value !== 42) throw new Error("Unexpected value");
 *   })
 *   .build();
 * ```
 *
 * @module
 */

export * from "./src/builder/mod.ts";
export * from "./src/runner/mod.ts";
export * from "./src/reporter/mod.ts";
