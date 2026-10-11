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
 * - [GitHub Repository](https://github.com/probitas-test/probitas)
 * - [Documentation](https://probitas-test.github.io/)
 *
 * ## Installation
 *
 * Scenarios run on the `probitas` CLI, a single binary (see the
 * documentation). Install this package for editor support and type checking:
 *
 * ```bash
 * npm install --save-dev @probitas-test/probitas
 * ```
 *
 * ## Related Packages
 *
 * | Package | Description |
 * |---------|-------------|
 * | [@probitas-test/builder](https://www.npmjs.com/package/@probitas-test/builder) | Fluent API for building scenario definitions |
 * | [@probitas-test/runner](https://www.npmjs.com/package/@probitas-test/runner) | Test execution engine with retry and concurrency |
 * | [@probitas-test/core](https://www.npmjs.com/package/@probitas-test/core) | Core type definitions and utilities |
 * | [@probitas-test/discover](https://www.npmjs.com/package/@probitas-test/discover) | Scenario file discovery |
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
 * - `faker` - Fake data generation from `@faker-js/faker`
 * - `FakeTime` - Time mocking utilities from `@std/testing/time`
 * - `spy`, `stub`, `assertSpyCalls` - Mock utilities from `@std/testing/mock`
 * - `tryOr`, `raise` - Error handling utilities from `@core/errorutil`
 * - `outdent` - Template literal tag for removing indentation
 *
 * @example Basic scenario with steps
 * ```ts
 * import { client, expect, scenario } from "@probitas-test/probitas";
 *
 * export default scenario("User API Test")
 *   .resource("http", () =>
 *     client.http.createHttpClient({ url: "https://api.example.com" }))
 *   .step("Create user", async (ctx) => {
 *     const response = await ctx.resources.http.post("/users", {
 *       body: { name: "Alice" },
 *     });
 *     expect(response).toBeOk().toHaveStatus(201);
 *     return response.json as { id: string };
 *   })
 *   .step("Verify user exists", async (ctx) => {
 *     const { id } = ctx.previous!;
 *     const response = await ctx.resources.http.get(`/users/${id}`);
 *     expect(response).toBeOk().toHaveJsonProperty("name", "Alice");
 *   })
 *   .build();
 * ```
 *
 * @example Using Skip for conditional execution
 * ```ts
 * import { scenario, Skip } from "@probitas-test/probitas";
 *
 * // Mock process.env for this example
 * const getEnv = (key: string): string | undefined =>
 *   key === "FEATURE_FLAG" ? undefined : "value";
 *
 * export default scenario("Feature test")
 *   .step("Check prerequisites", () => {
 *     if (!getEnv("FEATURE_FLAG")) {
 *       throw new Skip("Feature flag not enabled");
 *     }
 *   })
 *   .step("Test feature", () => {
 *     // This step runs only if the previous step didn't skip
 *   })
 *   .build();
 * ```
 *
 * @example Using HTTP client with resource
 * ```ts
 * import { client, expect, scenario } from "@probitas-test/probitas";
 *
 * export default scenario("API test")
 *   .resource("http", () =>
 *     client.http.createHttpClient({ url: "https://api.example.com" }))
 *   .step("Fetch users", async (ctx) => {
 *     const response = await ctx.resources.http.get("/users");
 *     expect(response).toBeOk().toHaveStatus(200);
 *     return { users: response.json as { id: string; name: string }[] };
 *   })
 *   .build();
 * ```
 *
 * @module
 */

export { scenario } from "@probitas-test/builder";
export { Skip } from "@probitas-test/runner";
export type { BuilderStepContext as StepContext } from "@probitas-test/builder";

export * as client from "./client.ts";
export * from "./expect.ts";

// Re-export useful library for testing
/**
 * Faker library for generating fake data.
 *
 * Re-exported from {@link https://www.npmjs.com/package/@faker-js/faker | @faker-js/faker}.
 *
 * @see {@link https://fakerjs.dev/ | Faker Documentation}
 */
export { faker } from "@faker-js/faker";
/**
 * Time mocking utilities.
 *
 * Re-exported from {@link https://jsr.io/@std/testing | @std/testing/time}.
 */
export * from "./_vendor/std_testing/time.ts";
/**
 * Mock and spy utilities.
 *
 * Re-exported from {@link https://jsr.io/@std/testing | @std/testing/mock}.
 */
export * from "./_vendor/std_testing/mock.ts";
/**
 * Error handling utilities.
 *
 * Re-exported from {@link https://jsr.io/@core/errorutil | @core/errorutil}.
 */
export * from "./_vendor/core_errorutil/mod.ts";
/**
 * Template literal tag for removing indentation.
 *
 * Re-exported from {@link https://www.npmjs.com/package/outdent | outdent}.
 */
export { outdent } from "outdent";
