/**
 * Probitas - Scenario-based testing and workflow execution framework
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

export { scenario } from "@probitas/builder";
export { Skip } from "@probitas/runner";
export type { StepContext } from "@probitas/builder";
