/**
 * Tests for ScenarioRunner
 *
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { ScenarioRunner } from "./scenario_runner.ts";
import type {
  ScenarioDefinition,
  ScenarioOptions,
  StepDefinition,
  StepOptions,
} from "./types.ts";

const defaultStepOptions: StepOptions = {
  timeout: 5000,
  retry: { maxAttempts: 1, backoff: "linear" },
};

const defaultScenarioOptions: ScenarioOptions = {
  tags: [],
  skip: null,
  setup: null,
  teardown: null,
  stepOptions: defaultStepOptions,
};

const createTestScenario = (
  overrides?: Partial<ScenarioDefinition>,
): ScenarioDefinition => ({
  name: "Test Scenario",
  options: defaultScenarioOptions,
  steps: [],
  ...overrides,
});

const createTestStep = (
  overrides?: Partial<StepDefinition>,
): StepDefinition => ({
  name: "Test Step",
  fn: () => "result",
  options: defaultStepOptions,
  ...overrides,
});

describe("ScenarioRunner", () => {
  describe("execution", () => {
    it("runs multiple scenarios", async () => {
      const runner = new ScenarioRunner();
      const scenarios = [
        createTestScenario({
          name: "Scenario 1",
          steps: [createTestStep()],
        }),
        createTestScenario({
          name: "Scenario 2",
          steps: [createTestStep()],
        }),
        createTestScenario({
          name: "Scenario 3",
          steps: [createTestStep()],
        }),
      ];

      const summary = await runner.run(scenarios);

      assertEquals(summary.total, 3);
      assertEquals(summary.passed, 3);
      assertEquals(summary.failed, 0);
      assertEquals(summary.skipped, 0);
    });
  });

  describe("hooks", () => {
    it("executes teardown even on step failure", async () => {
      const runner = new ScenarioRunner();
      const teardownExecuted: boolean[] = [];

      const scenarios = [
        createTestScenario({
          options: {
            ...defaultScenarioOptions,
            teardown: () => {
              teardownExecuted.push(true);
            },
          },
          steps: [
            createTestStep({
              fn: () => {
                throw new Error("Step failed");
              },
            }),
          ],
        }),
      ];

      const summary = await runner.run(scenarios);

      assertEquals(teardownExecuted.length, 1);
      assertEquals(summary.scenarios[0].status, "failed");
    });
  });

  describe("failure handling", () => {
    it("marks scenario as failed when step fails", async () => {
      const runner = new ScenarioRunner();
      const scenarios = [
        createTestScenario({
          steps: [
            createTestStep({
              name: "Failing step",
              fn: () => {
                throw new Error("Test failed");
              },
            }),
          ],
        }),
      ];

      const summary = await runner.run(scenarios);

      assertEquals(summary.failed, 1);
      assertEquals(summary.passed, 0);
      assertEquals(summary.scenarios[0].status, "failed");
      assertEquals(summary.scenarios[0].steps.length, 1);
      assertEquals(summary.scenarios[0].steps[0].status, "failed");
      assertExists(summary.scenarios[0].steps[0].error);
      assertEquals(summary.scenarios[0].steps[0].error?.message, "Test failed");
    });

    it("marks remaining steps as skipped when a step fails", async () => {
      const runner = new ScenarioRunner();
      const scenarios = [
        createTestScenario({
          steps: [
            createTestStep({ name: "Step 1" }),
            createTestStep({ name: "Step 2" }),
            createTestStep({
              name: "Failing step",
              fn: () => {
                throw new Error("Step 3 failed");
              },
            }),
            createTestStep({ name: "Step 4" }),
            createTestStep({ name: "Step 5" }),
          ],
        }),
      ];

      const summary = await runner.run(scenarios);

      assertEquals(summary.scenarios[0].status, "failed");
      assertEquals(summary.scenarios[0].steps.length, 5);
      assertEquals(summary.scenarios[0].steps[0].status, "passed");
      assertEquals(summary.scenarios[0].steps[1].status, "passed");
      assertEquals(summary.scenarios[0].steps[2].status, "failed");
      assertEquals(summary.scenarios[0].steps[3].status, "skipped");
      assertEquals(summary.scenarios[0].steps[4].status, "skipped");
    });
  });

  describe("execution strategies", () => {
    it("parallel execution with maxConcurrency=0 (unlimited)", async () => {
      const runner = new ScenarioRunner();

      const scenarios = [
        createTestScenario({
          name: "Parallel 1",
          steps: [createTestStep()],
        }),
        createTestScenario({
          name: "Parallel 2",
          steps: [createTestStep()],
        }),
      ];

      const summary = await runner.run(scenarios, {
        maxConcurrency: 0,
      });

      assertEquals(summary.total, 2);
      assertEquals(summary.passed, 2);
    });
  });

  describe("failure strategies", () => {
    it("maxFailures stops after count", async () => {
      const runner = new ScenarioRunner();
      const executed: string[] = [];

      const scenarios = [
        createTestScenario({
          name: "Test 1",
          steps: [
            createTestStep({
              fn: () => {
                executed.push("Test 1");
                throw new Error("Failed");
              },
            }),
          ],
        }),
        createTestScenario({
          name: "Test 2",
          steps: [
            createTestStep({
              fn: () => {
                executed.push("Test 2");
                throw new Error("Failed");
              },
            }),
          ],
        }),
        createTestScenario({
          name: "Test 3",
          steps: [
            createTestStep({
              fn: () => {
                executed.push("Test 3");
              },
            }),
          ],
        }),
      ];

      const summary = await runner.run(scenarios, {
        maxConcurrency: 1,
        maxFailures: 2,
      });

      assertEquals(summary.failed, 2);
      assertEquals(executed.includes("Test 3"), false);
    });

    it("continueAll (maxFailures=0) executes all scenarios", async () => {
      const runner = new ScenarioRunner();

      const scenarios = [
        createTestScenario({
          name: "Test 1",
          steps: [
            createTestStep({
              fn: () => {
                throw new Error("Failed");
              },
            }),
          ],
        }),
        createTestScenario({
          name: "Test 2",
          steps: [createTestStep()],
        }),
        createTestScenario({
          name: "Test 3",
          steps: [createTestStep()],
        }),
      ];

      const summary = await runner.run(scenarios, {
        maxConcurrency: 1,
        maxFailures: 0,
      });

      assertEquals(summary.total, 3);
      assertEquals(summary.failed, 1);
      assertEquals(summary.passed, 2);
    });
  });

  describe("context/store", () => {
    it("includes step results in scenario result", async () => {
      const runner = new ScenarioRunner();

      const scenarios = [
        createTestScenario({
          steps: [
            createTestStep({
              name: "Step 1",
              fn: () => "value1",
            }),
            createTestStep({
              name: "Step 2",
              fn: () => "value2",
            }),
          ],
        }),
      ];

      const summary = await runner.run(scenarios);

      assertEquals(summary.scenarios[0].steps.length, 2);
      assertEquals(summary.scenarios[0].steps[0].metadata.name, "Step 1");
      assertEquals(summary.scenarios[0].steps[1].metadata.name, "Step 2");
      assertEquals(summary.scenarios[0].steps[0].value, "value1");
      assertEquals(summary.scenarios[0].steps[1].value, "value2");
    });

    it("shares store between steps", async () => {
      const runner = new ScenarioRunner();

      const scenarios = [
        createTestScenario({
          steps: [
            createTestStep({
              fn: (ctx) => {
                ctx.store.set("key", "value");
              },
            }),
            createTestStep({
              fn: (ctx) => {
                return ctx.store.get("key");
              },
            }),
          ],
        }),
      ];

      const summary = await runner.run(scenarios);

      assertEquals(summary.scenarios[0].steps[1].value, "value");
    });
  });
});
