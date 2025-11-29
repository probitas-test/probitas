/**
 * Type-safety tests for ScenarioBuilder
 *
 * Verifies that the builder API has correct type inference.
 *
 * @module
 */

import { scenario } from "./scenario_builder.ts";

/**
 * All patterns are now permitted - no state machine restrictions
 */

// Pattern: setup → step
{
  const _definition = scenario("test")
    .setup(() => {})
    .step("step", () => {})
    .build();
}

// Pattern: setup can be called multiple times
{
  const _definition = scenario("test")
    .setup(() => {})
    .step("step", () => {})
    .setup(() => {})
    .build();
}

// Pattern: step → setup (setup can be called after steps)
{
  const _definition = scenario("test")
    .step("step", () => {})
    .setup(() => {})
    .build();
}

// Pattern: step only
{
  const _definition = scenario("test")
    .step("step", () => {})
    .build();
}

// Pattern: multiple steps
{
  const _definition = scenario("test")
    .step("step1", () => {})
    .step("step2", () => {})
    .build();
}

// Pattern: resource → setup → step
{
  const _definition = scenario("test")
    .resource("api", () => ({ [Symbol.dispose]() {} }))
    .setup((ctx) => {
      const _api = ctx.resources.api;
    })
    .step("step", (ctx) => {
      const _api = ctx.resources.api;
    })
    .build();
}

// Pattern: resource at any point
{
  const _definition = scenario("test")
    .step("step1", () => {})
    .resource("api", () => ({ [Symbol.dispose]() {} }))
    .step("step2", (ctx) => {
      const _api = ctx.resources.api;
    })
    .build();
}

// Pattern: setup returns cleanup function
{
  const _definition = scenario("test")
    .setup(() => {
      return () => {
        // cleanup
      };
    })
    .step("step", () => {})
    .build();
}

// Pattern: setup returns Disposable
{
  const _definition = scenario("test")
    .setup(() => {
      return {
        [Symbol.asyncDispose]: async () => {
          // cleanup
        },
      };
    })
    .step("step", () => {})
    .build();
}

// Pattern: Interleaved steps, resources, and setups preserve context types
{
  const _definition = scenario("test")
    .step("step1", () => ({ a: 1 }))
    .resource("res1", (ctx) => {
      // Check types from step1
      const _p: { a: number } = ctx.previous;
      const _r: readonly [{ a: number }] = ctx.results;
      return { name: "r1" };
    })
    .setup((ctx) => {
      // Check types from step1 and res1
      const _p: { a: number } = ctx.previous;
      const _r: readonly [{ a: number }] = ctx.results;
      const _res: { res1: { name: string } } = ctx.resources;
    })
    .step("step2", (ctx) => {
      // Check types from step1 and res1
      const _p: { a: number } = ctx.previous;
      const _r: readonly [{ a: number }] = ctx.results;
      const _res: { res1: { name: string } } = ctx.resources;
      return { b: 2 };
    })
    .build();
}
