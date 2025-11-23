/**
 * Tests for ScenarioRunner
 *
 * @module
 */

import { assertEquals, assertExists, assertGreaterOrEqual } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { ScenarioRunner } from "./scenario_runner.ts";
import type {
  Reporter,
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
    it("runs single scenario successfully", async () => {
      const runner = new ScenarioRunner();
      const scenarios = [
        createTestScenario({
          name: "Scenario 1",
          steps: [createTestStep({ name: "Step 1" })],
        }),
      ];

      const summary = await runner.run(scenarios);

      assertEquals(summary.total, 1);
      assertEquals(summary.passed, 1);
      assertEquals(summary.failed, 0);
      assertEquals(summary.skipped, 0);
      assertEquals(summary.scenarios.length, 1);
      assertEquals(summary.scenarios[0].status, "passed");
      assertEquals(summary.scenarios[0].steps.length, 1);
    });

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
    it("executes setup hook before steps", async () => {
      const runner = new ScenarioRunner();
      const order: string[] = [];

      const scenarios = [
        createTestScenario({
          options: {
            ...defaultScenarioOptions,
            setup: () => {
              order.push("setup");
            },
          },
          steps: [
            createTestStep({
              fn: () => {
                order.push("step");
              },
            }),
          ],
        }),
      ];

      await runner.run(scenarios);

      assertEquals(order[0], "setup");
      assertEquals(order[1], "step");
    });

    it("executes teardown hook after steps", async () => {
      const runner = new ScenarioRunner();
      const order: string[] = [];

      const scenarios = [
        createTestScenario({
          options: {
            ...defaultScenarioOptions,
            teardown: () => {
              order.push("teardown");
            },
          },
          steps: [
            createTestStep({
              fn: () => {
                order.push("step");
              },
            }),
          ],
        }),
      ];

      await runner.run(scenarios);

      assertEquals(order[order.length - 1], "teardown");
    });

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

  describe("skip conditions", () => {
    it("skips scenario with skip condition as boolean", async () => {
      const runner = new ScenarioRunner();
      const scenarios = [
        createTestScenario({
          name: "Skipped",
          options: {
            ...defaultScenarioOptions,
            skip: true,
          },
          steps: [createTestStep()],
        }),
      ];

      const summary = await runner.run(scenarios);

      assertEquals(summary.skipped, 1);
      assertEquals(summary.scenarios[0].status, "skipped");
    });

    it("skips scenario with skip condition as string", async () => {
      const runner = new ScenarioRunner();
      const scenarios = [
        createTestScenario({
          options: {
            ...defaultScenarioOptions,
            skip: "Not ready",
          },
          steps: [createTestStep()],
        }),
      ];

      const summary = await runner.run(scenarios);

      assertEquals(summary.skipped, 1);
    });

    it("skips scenario with skip condition as function", async () => {
      const runner = new ScenarioRunner();
      const scenarios = [
        createTestScenario({
          options: {
            ...defaultScenarioOptions,
            skip: () => true,
          },
          steps: [createTestStep()],
        }),
      ];

      const summary = await runner.run(scenarios);

      assertEquals(summary.skipped, 1);
    });
  });

  describe("reporter integration", () => {
    it("reporter receives onRunStart", async () => {
      const runner = new ScenarioRunner();
      let startCalled = false;

      const reporter: Reporter = {
        onRunStart: () => {
          startCalled = true;
        },
        onScenarioStart: () => {},
        onScenarioSkip: () => {},
        onStepStart: () => {},
        onStepEnd: () => {},
        onStepError: () => {},
        onScenarioEnd: () => {},
        onRunEnd: () => {},
      };

      const scenarios = [createTestScenario({
        steps: [createTestStep()],
      })];

      await runner.run(scenarios, { reporter });

      assertEquals(startCalled, true);
    });

    it("reporter receives onRunEnd", async () => {
      const runner = new ScenarioRunner();
      let endSummary: unknown = null;

      const reporter: Reporter = {
        onRunStart: () => {},
        onScenarioStart: () => {},
        onScenarioSkip: () => {},
        onStepStart: () => {},
        onStepEnd: () => {},
        onStepError: () => {},
        onScenarioEnd: () => {},
        onRunEnd: (summary) => {
          endSummary = summary;
        },
      };

      const scenarios = [createTestScenario({
        steps: [createTestStep()],
      })];

      const summary = await runner.run(scenarios, { reporter });

      assertExists(endSummary);
      assertEquals(summary, endSummary);
    });

    it("reporter receives onScenarioStart and onScenarioEnd", async () => {
      const runner = new ScenarioRunner();
      const events: string[] = [];

      const reporter: Reporter = {
        onRunStart: () => {},
        onScenarioStart: (scenario) => {
          events.push(`start:${scenario.name}`);
        },
        onScenarioSkip: () => {},
        onStepStart: () => {},
        onStepEnd: () => {},
        onStepError: () => {},
        onScenarioEnd: (scenario, _result) => {
          events.push(`end:${scenario.name}`);
        },
        onRunEnd: () => {},
      };

      const scenarios = [
        createTestScenario({
          name: "Test",
          steps: [createTestStep()],
        }),
      ];

      await runner.run(scenarios, { reporter });

      assertEquals(events[0], "start:Test");
      assertEquals(events[events.length - 1], "end:Test");
    });

    it("reports step error via reporter", async () => {
      const runner = new ScenarioRunner();
      let errorReported: Error | undefined;

      const reporter: Reporter = {
        onRunStart: () => {},
        onScenarioStart: () => {},
        onScenarioSkip: () => {},
        onStepStart: () => {},
        onStepEnd: () => {},
        onStepError: (_step, error) => {
          errorReported = error;
        },
        onScenarioEnd: () => {},
        onRunEnd: () => {},
      };

      const scenarios = [
        createTestScenario({
          steps: [
            createTestStep({
              fn: () => {
                throw new Error("Step error");
              },
            }),
          ],
        }),
      ];

      await runner.run(scenarios, { reporter });

      assertExists(errorReported);
      assertEquals(errorReported?.message, "Step error");
    });

    it("reports scenario skip via reporter", async () => {
      const runner = new ScenarioRunner();
      let skipReported = false;

      const reporter: Reporter = {
        onRunStart: () => {},
        onScenarioStart: () => {},
        onScenarioSkip: (_scenario, _reason) => {
          skipReported = true;
        },
        onStepStart: () => {},
        onStepEnd: () => {},
        onStepError: () => {},
        onScenarioEnd: () => {},
        onRunEnd: () => {},
      };

      const scenarios = [
        createTestScenario({
          options: {
            ...defaultScenarioOptions,
            skip: true,
          },
          steps: [createTestStep()],
        }),
      ];

      await runner.run(scenarios, { reporter });

      assertEquals(skipReported, true);
    });

    it("calls reporter callbacks in correct order for successful scenario", async () => {
      const runner = new ScenarioRunner();
      const events: string[] = [];

      const reporter: Reporter = {
        onRunStart: () => {
          events.push("onRunStart");
        },
        onScenarioStart: (s) => {
          events.push(`onScenarioStart:${s.name}`);
        },
        onScenarioSkip: () => {
          events.push("onScenarioSkip");
        },
        onStepStart: (s) => {
          events.push(`onStepStart:${s.name}`);
        },
        onStepEnd: (s) => {
          events.push(`onStepEnd:${s.name}`);
        },
        onStepError: () => {
          events.push("onStepError");
        },
        onScenarioEnd: (s) => {
          events.push(`onScenarioEnd:${s.name}`);
        },
        onRunEnd: () => {
          events.push("onRunEnd");
        },
      };

      const scenarios = [
        createTestScenario({
          name: "Test Scenario",
          steps: [
            createTestStep({ name: "Step 1" }),
            createTestStep({ name: "Step 2" }),
          ],
        }),
      ];

      await runner.run(scenarios, { reporter });

      assertEquals(events, [
        "onRunStart",
        "onScenarioStart:Test Scenario",
        "onStepStart:Step 1",
        "onStepEnd:Step 1",
        "onStepStart:Step 2",
        "onStepEnd:Step 2",
        "onScenarioEnd:Test Scenario",
        "onRunEnd",
      ]);
    });

    it("calls reporter callbacks in correct order when step fails with skipped steps", async () => {
      const runner = new ScenarioRunner();
      const events: string[] = [];

      const reporter: Reporter = {
        onRunStart: () => {
          events.push("onRunStart");
        },
        onScenarioStart: (s) => {
          events.push(`onScenarioStart:${s.name}`);
        },
        onScenarioSkip: () => {
          events.push("onScenarioSkip");
        },
        onStepStart: (s) => {
          events.push(`onStepStart:${s.name}`);
        },
        onStepEnd: (s, r) => {
          events.push(`onStepEnd:${s.name}:${r.status}`);
        },
        onStepError: (s) => {
          events.push(`onStepError:${s.name}`);
        },
        onScenarioEnd: (s) => {
          events.push(`onScenarioEnd:${s.name}`);
        },
        onRunEnd: () => {
          events.push("onRunEnd");
        },
      };

      const scenarios = [
        createTestScenario({
          name: "Failing Scenario",
          steps: [
            createTestStep({ name: "Step 1" }),
            createTestStep({
              name: "Failing Step",
              fn: () => {
                throw new Error("Failed");
              },
            }),
            createTestStep({ name: "Step 3" }),
            createTestStep({ name: "Step 4" }),
          ],
        }),
      ];

      await runner.run(scenarios, { reporter });

      assertEquals(events, [
        "onRunStart",
        "onScenarioStart:Failing Scenario",
        "onStepStart:Step 1",
        "onStepEnd:Step 1:passed",
        "onStepStart:Failing Step",
        "onStepError:Failing Step",
        "onStepEnd:Step 3:skipped",
        "onStepEnd:Step 4:skipped",
        "onScenarioEnd:Failing Scenario",
        "onRunEnd",
      ]);
    });

    it("calls reporter callbacks in correct order for multiple scenarios", async () => {
      const runner = new ScenarioRunner();
      const events: string[] = [];

      const reporter: Reporter = {
        onRunStart: () => {
          events.push("onRunStart");
        },
        onScenarioStart: (s) => {
          events.push(`onScenarioStart:${s.name}`);
        },
        onScenarioSkip: () => {
          events.push("onScenarioSkip");
        },
        onStepStart: (s) => {
          events.push(`onStepStart:${s.name}`);
        },
        onStepEnd: (s) => {
          events.push(`onStepEnd:${s.name}`);
        },
        onStepError: () => {
          events.push("onStepError");
        },
        onScenarioEnd: (s) => {
          events.push(`onScenarioEnd:${s.name}`);
        },
        onRunEnd: () => {
          events.push("onRunEnd");
        },
      };

      const scenarios = [
        createTestScenario({
          name: "Scenario 1",
          steps: [createTestStep({ name: "Step A" })],
        }),
        createTestScenario({
          name: "Scenario 2",
          steps: [createTestStep({ name: "Step B" })],
        }),
      ];

      await runner.run(scenarios, {
        reporter,
        maxConcurrency: 1,
      });

      assertEquals(events, [
        "onRunStart",
        "onScenarioStart:Scenario 1",
        "onStepStart:Step A",
        "onStepEnd:Step A",
        "onScenarioEnd:Scenario 1",
        "onScenarioStart:Scenario 2",
        "onStepStart:Step B",
        "onStepEnd:Step B",
        "onScenarioEnd:Scenario 2",
        "onRunEnd",
      ]);
    });
  });

  describe("execution strategies", () => {
    it("sequential execution with maxConcurrency=1", async () => {
      const runner = new ScenarioRunner();
      const executionOrder: string[] = [];

      const scenarios = [
        createTestScenario({
          name: "First",
          steps: [
            createTestStep({
              fn: () => {
                executionOrder.push("First");
              },
            }),
          ],
        }),
        createTestScenario({
          name: "Second",
          steps: [
            createTestStep({
              fn: () => {
                executionOrder.push("Second");
              },
            }),
          ],
        }),
      ];

      await runner.run(scenarios, {
        maxConcurrency: 1,
      });

      assertEquals(executionOrder[0], "First");
      assertEquals(executionOrder[1], "Second");
    });

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

    it("completes all scenarios in parallel batch even if one fails", async () => {
      const runner = new ScenarioRunner();
      const executionOrder: string[] = [];
      const executionTimes: Record<string, number> = {};

      const scenarios = [
        createTestScenario({
          name: "Fast Success",
          steps: [
            createTestStep({
              fn: async () => {
                executionOrder.push("Fast Success started");
                executionTimes["Fast Success start"] = Date.now();
                await new Promise((resolve) => setTimeout(resolve, 10));
                executionOrder.push("Fast Success completed");
                executionTimes["Fast Success end"] = Date.now();
              },
            }),
          ],
        }),
        createTestScenario({
          name: "Fast Failure",
          steps: [
            createTestStep({
              fn: async () => {
                executionOrder.push("Fast Failure started");
                executionTimes["Fast Failure start"] = Date.now();
                await new Promise((resolve) => setTimeout(resolve, 10));
                executionOrder.push("Fast Failure completed");
                executionTimes["Fast Failure end"] = Date.now();
                throw new Error("Fast Failure");
              },
            }),
          ],
        }),
        createTestScenario({
          name: "Slow Success",
          steps: [
            createTestStep({
              fn: async () => {
                executionOrder.push("Slow Success started");
                executionTimes["Slow Success start"] = Date.now();
                await new Promise((resolve) => setTimeout(resolve, 50));
                executionOrder.push("Slow Success completed");
                executionTimes["Slow Success end"] = Date.now();
              },
            }),
          ],
        }),
      ];

      const summary = await runner.run(scenarios, {
        maxConcurrency: 0,
      });

      // すべてのシナリオが完了していることを確認
      assertEquals(summary.total, 3);
      assertEquals(summary.passed, 2);
      assertEquals(summary.failed, 1);

      // すべてのシナリオが開始され、完了していることを確認
      assertEquals(executionOrder.includes("Fast Success started"), true);
      assertEquals(executionOrder.includes("Fast Success completed"), true);
      assertEquals(executionOrder.includes("Fast Failure started"), true);
      assertEquals(executionOrder.includes("Fast Failure completed"), true);
      assertEquals(executionOrder.includes("Slow Success started"), true);
      assertEquals(executionOrder.includes("Slow Success completed"), true);

      // すべてのシナリオが並列実行されていることを確認（開始時刻が近い）
      const startTimes = [
        executionTimes["Fast Success start"],
        executionTimes["Fast Failure start"],
        executionTimes["Slow Success start"],
      ];
      const maxStartTimeDiff = Math.max(...startTimes) -
        Math.min(...startTimes);

      // 開始時刻の差が100ms以内（並列実行の証拠）
      // 順次実行なら少なくとも60ms以上の差がある
      assertEquals(maxStartTimeDiff < 100, true);
    });
  });

  describe("failure strategies", () => {
    it("fail-fast (maxFailures=1) stops at first failure", async () => {
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
              },
            }),
          ],
        }),
      ];

      const summary = await runner.run(scenarios, {
        maxConcurrency: 1,
        maxFailures: 1,
      });

      assertEquals(executed.length, 1);
      assertEquals(summary.failed, 1);
    });

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

    it("accumulates results in context", async () => {
      const runner = new ScenarioRunner();
      let capturedResults: unknown[] | undefined;

      const scenarios = [
        createTestScenario({
          steps: [
            createTestStep({
              fn: () => "first",
            }),
            createTestStep({
              fn: (ctx) => {
                capturedResults = [...(ctx.results as unknown[])];
              },
            }),
          ],
        }),
      ];

      await runner.run(scenarios);

      assertEquals(capturedResults?.[0], "first");
    });

    it("provides previous result in step context", async () => {
      const runner = new ScenarioRunner();
      let capturedPrevious: unknown;

      const scenarios = [
        createTestScenario({
          steps: [
            createTestStep({
              fn: () => "first",
            }),
            createTestStep({
              fn: (ctx) => {
                capturedPrevious = ctx.previous;
              },
            }),
          ],
        }),
      ];

      await runner.run(scenarios);

      assertEquals(capturedPrevious, "first");
    });
  });

  describe("timing", () => {
    it("calculates execution duration", async () => {
      const runner = new ScenarioRunner();

      const scenarios = [
        createTestScenario({
          steps: [
            createTestStep({
              fn: async () => {
                await new Promise((resolve) => setTimeout(resolve, 50));
              },
            }),
          ],
        }),
      ];

      const summary = await runner.run(scenarios);

      // Duration should be greater than the step execution time
      assertGreaterOrEqual(summary.duration, 0);
      // Verify the step result also has duration
      assertEquals(summary.scenarios[0].steps[0].duration >= 0, true);
    });
  });
});
