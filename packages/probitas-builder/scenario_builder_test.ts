/**
 * Tests for ScenarioBuilder class
 *
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import { FakeTime } from "@std/testing/time";
import type { StepDefinition } from "@probitas/core";
import { scenario } from "./scenario_builder.ts";

// Helper to extract steps from steps
function getSteps(steps: readonly StepDefinition[]) {
  return steps.filter((v) => v.kind === "step");
}

// Helper to extract resources from steps
function getResources(steps: readonly StepDefinition[]) {
  return steps.filter((v) => v.kind === "resource");
}

// Helper to extract setups from steps
function getSetups(steps: readonly StepDefinition[]) {
  return steps.filter((v) => v.kind === "setup");
}

Deno.test("ScenarioBuilder creation builds scenario definition with name", () => {
  const definition = scenario("My Scenario").build();
  assertEquals(definition.name, "My Scenario");
});

Deno.test("ScenarioBuilder creation captures scenario origin at build time", () => {
  const definition = scenario("Test").build();
  assertExists(definition.origin);
  // Location should point to the test file where build() was called
  assertEquals(
    definition.origin.path.includes("scenario_builder_test.ts"),
    true,
  );
});

Deno.test("ScenarioBuilder options applies default options to scenario", () => {
  const definition = scenario("Test").build();
  assertEquals(definition.tags.length, 0);
});

Deno.test("ScenarioBuilder options allows partial scenario options override", () => {
  const definition = scenario("Test", {
    tags: ["api", "integration"],
  }).build();
  assertEquals(definition.tags.length, 2);
  assertEquals(definition.tags[0], "api");
  assertEquals(definition.tags[1], "integration");
});

Deno.test("ScenarioBuilder options applies default step options", () => {
  const definition = scenario("Test")
    .step("Test Step", () => {})
    .build();
  const steps = getSteps(definition.steps);
  assertEquals(steps[0].timeout, 30000);
  assertEquals(steps[0].retry.maxAttempts, 1);
  assertEquals(steps[0].retry.backoff, "linear");
});

Deno.test("ScenarioBuilder options allows step-level options override", () => {
  const definition = scenario("Test")
    .step("Test Step", () => {}, {
      timeout: 5000,
      retry: { maxAttempts: 3, backoff: "exponential" },
    })
    .build();
  const steps = getSteps(definition.steps);
  assertEquals(steps[0].timeout, 5000);
  assertEquals(steps[0].retry.maxAttempts, 3);
  assertEquals(steps[0].retry.backoff, "exponential");
});

Deno.test("ScenarioBuilder step addition supports named step addition", () => {
  const definition = scenario("Test")
    .step("First Step", () => 42)
    .build();
  const steps = getSteps(definition.steps);
  assertEquals(steps.length, 1);
  assertEquals(steps[0].name, "First Step");
});

Deno.test("ScenarioBuilder step addition supports unnamed step addition with auto-naming", () => {
  const definition = scenario("Test")
    .step(() => 1)
    .step(() => 2)
    .build();
  const steps = getSteps(definition.steps);
  assertEquals(steps.length, 2);
  assertEquals(steps[0].name, "Execution step 1");
  assertEquals(steps[1].name, "Execution step 2");
});

Deno.test("ScenarioBuilder step execution step functions receive typed context", () => {
  const results: unknown[] = [];

  const definition = scenario("Test")
    .step("Step 1", () => 42)
    .step("Step 2", (ctx) => {
      results.push({
        index: ctx.index,
        previous: ctx.previous,
      });
      return "hello";
    })
    .build();

  const steps = getSteps(definition.steps);
  assertEquals(steps.length, 2);
  assertEquals(steps[0].name, "Step 1");
  assertEquals(steps[1].name, "Step 2");
});

Deno.test("ScenarioBuilder step execution supports async step functions", async () => {
  using time = new FakeTime();
  const definition = scenario("Test")
    .step("Async", () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve("done"), 10);
      });
    })
    .build();

  const steps = getSteps(definition.steps);
  const promise = steps[0].fn({
    index: 0,
    previous: undefined,
    results: [],
    store: new Map(),
    signal: new AbortController().signal,
    resources: {},
  });

  await time.tickAsync(10);
  const result = await promise;

  assertEquals(result, "done");
});

Deno.test("ScenarioBuilder setup method adds setup entry", () => {
  const setupFn = () => {};
  const definition = scenario("Test")
    .setup(setupFn)
    .build();

  const setups = getSetups(definition.steps);
  assertEquals(setups.length, 1);
  assertEquals(typeof setups[0].fn, "function");
});

Deno.test("ScenarioBuilder setup can be called multiple times", () => {
  const definition = scenario("Test")
    .setup(() => {})
    .step("Step 1", () => 42)
    .setup(() => {})
    .build();

  const setups = getSetups(definition.steps);
  assertEquals(setups.length, 2);
});

Deno.test("ScenarioBuilder setup can be chained with steps", () => {
  const setupFn = () => {};

  const definition = scenario("Test")
    .setup(setupFn)
    .step("Step 1", () => 42)
    .build();

  const setups = getSetups(definition.steps);
  const steps = getSteps(definition.steps);
  assertEquals(setups.length, 1);
  assertEquals(steps.length, 1);
});

Deno.test("ScenarioBuilder setup and step can be called in any order", () => {
  const definition = scenario("Test")
    .step("Step 1", () => 42)
    .setup(() => {})
    .step("Step 2", () => "hello")
    .build();

  const steps = getSteps(definition.steps);
  const setups = getSetups(definition.steps);
  assertEquals(steps.length, 2);
  assertEquals(setups.length, 1);
});

Deno.test("ScenarioBuilder setup supports async functions", () => {
  const asyncSetup = async () => {
    await Promise.resolve();
  };

  const definition = scenario("Test")
    .setup(asyncSetup)
    .step("Step 1", () => 42)
    .build();

  const setups = getSetups(definition.steps);
  assertEquals(setups.length, 1);
});

Deno.test("ScenarioBuilder step can be called directly without setup", () => {
  const definition = scenario("Test")
    .step("Step 1", () => 42)
    .build();

  const setups = getSetups(definition.steps);
  const steps = getSteps(definition.steps);
  assertEquals(setups.length, 0);
  assertEquals(steps.length, 1);
});

Deno.test("ScenarioBuilder branching allows branching from a common base", () => {
  const base = scenario("Base")
    .setup(() => {})
    .step("Common step 1", () => 1)
    .step("Common step 2", () => 2);

  const scenarioA = base
    .step("A specific step", () => 3)
    .build();

  const scenarioB = base
    .step("B specific step", () => 4)
    .build();

  assertEquals(scenarioA.name, "Base");
  const stepsA = getSteps(scenarioA.steps);
  assertEquals(stepsA.length, 3);
  assertEquals(stepsA[2].name, "A specific step");

  assertEquals(scenarioB.name, "Base");
  const stepsB = getSteps(scenarioB.steps);
  assertEquals(stepsB.length, 3);
  assertEquals(stepsB[2].name, "B specific step");
});

Deno.test("ScenarioBuilder branching does not mutate the original builder", () => {
  const base = scenario("Test")
    .step("Step 1", () => 1);

  const branch1 = base.step("Step 2a", () => 2);
  const branch2 = base.step("Step 2b", () => 3);

  const defBase = base.build();
  const def1 = branch1.build();
  const def2 = branch2.build();

  const stepsBase = getSteps(defBase.steps);
  assertEquals(stepsBase.length, 1);
  assertEquals(stepsBase[0].name, "Step 1");

  const steps1 = getSteps(def1.steps);
  assertEquals(steps1.length, 2);
  assertEquals(steps1[1].name, "Step 2a");

  const steps2 = getSteps(def2.steps);
  assertEquals(steps2.length, 2);
  assertEquals(steps2[1].name, "Step 2b");
});

Deno.test("ScenarioBuilder branching allows branching from setup", () => {
  const baseWithSetup = scenario("Test").setup(() => {});

  const withStep1 = baseWithSetup.step("Step A", () => 1);
  const withStep2 = baseWithSetup.step("Step B", () => 2);

  const def1 = withStep1.build();
  const def2 = withStep2.build();

  const setups1 = getSetups(def1.steps);
  const steps1 = getSteps(def1.steps);
  assertEquals(setups1.length, 1);
  assertEquals(steps1.length, 1);
  assertEquals(steps1[0].name, "Step A");

  const setups2 = getSetups(def2.steps);
  const steps2 = getSteps(def2.steps);
  assertEquals(setups2.length, 1);
  assertEquals(steps2.length, 1);
  assertEquals(steps2[0].name, "Step B");
});

Deno.test("ScenarioBuilder branching allows complex branching scenarios", () => {
  const common = scenario("API Test")
    .setup(() => {})
    .step("Login", () => ({ token: "abc" }))
    .step("Setup data", () => ({ dataId: 123 }));

  const successCase = common
    .step("Perform valid action", () => ({ status: 200 }))
    .step("Verify success", () => {});

  const errorCase = common
    .step("Perform invalid action", () => ({ status: 400 }))
    .step("Verify error", () => {});

  const defSuccess = successCase.build();
  const defError = errorCase.build();

  const setupsSuccess = getSetups(defSuccess.steps);
  const stepsSuccess = getSteps(defSuccess.steps);
  assertEquals(setupsSuccess.length, 1);
  assertEquals(stepsSuccess.length, 4);
  assertEquals(stepsSuccess[2].name, "Perform valid action");

  const setupsError = getSetups(defError.steps);
  const stepsError = getSteps(defError.steps);
  assertEquals(setupsError.length, 1);
  assertEquals(stepsError.length, 4);
  assertEquals(stepsError[2].name, "Perform invalid action");
});

Deno.test("ScenarioBuilder resource management registers resources", () => {
  const definition = scenario("Test")
    .resource("api", () => ({
      name: "api",
      [Symbol.dispose]() {},
    }))
    .step("Use", (ctx) => {
      const _api = ctx.resources.api;
    })
    .build();

  const resources = getResources(definition.steps);
  assertEquals(resources.length, 1);
  assertEquals(resources[0].name, "api");
});

Deno.test("ScenarioBuilder resource management supports multiple resources", () => {
  const definition = scenario("Test")
    .resource("api", () => ({ [Symbol.dispose]() {} }))
    .resource("db", () => ({ [Symbol.dispose]() {} }))
    .step("Use", (ctx) => {
      const _api = ctx.resources.api;
      const _db = ctx.resources.db;
    })
    .build();

  const resources = getResources(definition.steps);
  assertEquals(resources.length, 2);
});

Deno.test("ScenarioBuilder resource management allows resource dependencies", () => {
  const definition = scenario("Test")
    .resource("pool", () => ({
      type: "pool",
      [Symbol.dispose]() {},
    }))
    .resource("api", ({ resources }) => ({
      type: "api",
      pool: resources.pool,
      [Symbol.dispose]() {},
    }))
    .step("Check", (ctx) => {
      const _pool = ctx.resources.pool;
      const _api = ctx.resources.api;
    })
    .build();

  const resources = getResources(definition.steps);
  assertEquals(resources.length, 2);
});

Deno.test("ScenarioBuilder resource management allows resource() before setup()", () => {
  const definition = scenario("Test")
    .resource("api", () => ({ [Symbol.dispose]() {} }))
    .setup((ctx) => {
      const _api = ctx.resources.api;
    })
    .step("Test", () => {})
    .build();

  const resources = getResources(definition.steps);
  const setups = getSetups(definition.steps);
  assertEquals(resources.length, 1);
  assertEquals(setups.length, 1);
});

Deno.test("ScenarioBuilder resource management allows resource() at any point", () => {
  const definition = scenario("Test")
    .resource("api", () => ({ [Symbol.dispose]() {} }))
    .step("Test", (ctx) => {
      const _api = ctx.resources.api;
    })
    .resource("db", () => ({ [Symbol.dispose]() {} }))
    .build();

  const resources = getResources(definition.steps);
  assertEquals(resources.length, 2);
});
