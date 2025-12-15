/**
 * Probitas - Scenario-based testing and workflow execution framework.
 *
 * This is the main entry point for the Probitas framework. It provides a fluent API
 * for building and executing scenario-based tests with support for:
 *
 * - **Sequential steps**: Define test steps that execute in order with type-safe context passing
 * - **Skip conditions**: Conditionally skip steps or entire scenarios
 * - **Rich assertions**: Built-in expect utilities for comprehensive assertions
 * - **External clients**: Pre-configured clients for HTTP, databases, message queues, and more
 * - **Test utilities**: Faker for test data, time mocking, and function spies
 *
 * ## Links
 *
 * - [GitHub Repository](https://github.com/jsr-probitas/probitas)
 * - [Documentation](./.claude/README.md)
 *
 * ## Related Packages
 *
 * | Package | Description |
 * |---------|-------------|
 * | [@probitas/builder](https://jsr.io/@probitas/builder) | Fluent API for building scenario definitions |
 * | [@probitas/runner](https://jsr.io/@probitas/runner) | Test execution engine with retry and concurrency |
 * | [@probitas/reporter](https://jsr.io/@probitas/reporter) | Output formatters (list, dot, TAP, JSON) |
 * | [@probitas/core](https://jsr.io/@probitas/core) | Core type definitions and utilities |
 * | [@probitas/discover](https://jsr.io/@probitas/discover) | Scenario file discovery |
 * | [@probitas/logger](https://jsr.io/@probitas/logger) | Unified logging interface |
 * | [@probitas/cli](https://jsr.io/@probitas/cli) | Command-line interface |
 *
 * ## Core Exports
 *
 * - {@linkcode scenario} - Factory function to create scenario builders
 * - {@linkcode Skip} - Utility to skip steps or scenarios conditionally
 * - {@linkcode StepContext} - Type representing the context passed to each step
 * - {@linkcode client} - Namespace containing all available client implementations
 * - {@linkcode expect} - Assertion utilities (from `@std/expect`)
 *
 * ## Re-exported Utilities
 *
 * For convenience, this module also re-exports commonly used testing utilities:
 *
 * - `faker` - Fake data generation from `@jackfiszr/faker`
 * - `FakeTime` - Time mocking utilities from `@std/testing/time`
 * - `spy`, `stub`, `assertSpyCalls` - Mock utilities from `@std/testing/mock`
 * - `tryOr`, `raise` - Error handling utilities from `@core/errorutil`
 * - `outdent` - Template literal tag for removing indentation
 *
 * @example Basic scenario with steps
 * ```ts
 * import { scenario, expect } from "@probitas/probitas";
 *
 * export default scenario("User registration flow")
 *   .step("Create user", async () => {
 *     const user = await createUser({ name: "Alice" });
 *     return { userId: user.id };
 *   })
 *   .step("Verify user exists", async (ctx) => {
 *     const user = await getUser(ctx.previous.userId);
 *     expect(user.name).toBe("Alice");
 *   })
 *   .build();
 * ```
 *
 * @example Using Skip for conditional execution
 * ```ts
 * import { scenario, Skip } from "@probitas/probitas";
 *
 * export default scenario("Feature test")
 *   .step("Check prerequisites", () => {
 *     if (!process.env.FEATURE_FLAG) {
 *       throw new Skip("Feature flag not enabled");
 *     }
 *   })
 *   .step("Test feature", () => {
 *     // This step runs only if the previous step didn't skip
 *   })
 *   .build();
 * ```
 *
 * @example Using HTTP client
 * ```ts
 * import { scenario, expect, client } from "@probitas/probitas";
 *
 * const http = client.http({ baseUrl: "https://api.example.com" });
 *
 * export default scenario("API test")
 *   .step("Fetch users", async () => {
 *     const response = await http.get("/users");
 *     expect(response.status).toBe(200);
 *     return { users: await response.data() };
 *   })
 *   .build();
 * ```
 *
 * @module
 */

export { scenario } from "@probitas/builder";
export { Skip } from "@probitas/runner";
export type { BuilderStepContext as StepContext } from "@probitas/builder";

export * as client from "./client/mod.ts";
export * from "./expect.ts";

// Re-export useful library for testing
export * from "@jackfiszr/faker";
export * from "@std/testing/time";
export * from "@std/testing/mock";
export * from "@core/errorutil";
export * from "@cspotcode/outdent";
