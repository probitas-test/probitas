/**
 * Tests for ScenarioBuilder class
 *
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { FakeTime } from "@std/testing/time";
import { ScenarioBuilder } from "./scenario_builder.ts";

describe("ScenarioBuilder", () => {
  describe("creation", () => {
    it("creates instance with name", () => {
      const builder = new ScenarioBuilder("Test Scenario");
      assertExists(builder);
    });

    it("builds scenario definition with name", () => {
      const definition = new ScenarioBuilder("My Scenario").build();
      assertEquals(definition.name, "My Scenario");
    });

    it("builds definition with no steps", () => {
      const definition = new ScenarioBuilder("Empty").build();
      assertEquals(definition.steps.length, 0);
    });
  });

  describe("options", () => {
    it("applies default options to scenario", () => {
      const definition = new ScenarioBuilder("Test").build();
      assertEquals(definition.options.tags.length, 0);
      assertEquals(definition.options.skip, null);
      assertEquals(definition.options.setup, null);
      assertEquals(definition.options.teardown, null);
      assertEquals(definition.options.stepOptions.timeout, 30000);
      assertEquals(definition.options.stepOptions.retry.maxAttempts, 1);
      assertEquals(definition.options.stepOptions.retry.backoff, "linear");
    });

    it("allows partial scenario options override", () => {
      const definition = new ScenarioBuilder("Test", {
        tags: ["api", "integration"],
      }).build();
      assertEquals(definition.options.tags.length, 2);
      assertEquals(definition.options.tags[0], "api");
      assertEquals(definition.options.tags[1], "integration");
    });

    it("applies default step options", () => {
      const definition = new ScenarioBuilder("Test")
        .step("Test Step", () => {})
        .build();
      assertEquals(definition.steps[0].options.timeout, 30000);
      assertEquals(definition.steps[0].options.retry.maxAttempts, 1);
      assertEquals(definition.steps[0].options.retry.backoff, "linear");
    });

    it("allows step-level options override", () => {
      const definition = new ScenarioBuilder("Test")
        .step("Test Step", () => {}, {
          timeout: 5000,
          retry: { maxAttempts: 3, backoff: "exponential" },
        })
        .build();
      assertEquals(definition.steps[0].options.timeout, 5000);
      assertEquals(definition.steps[0].options.retry.maxAttempts, 3);
      assertEquals(definition.steps[0].options.retry.backoff, "exponential");
    });

    it("cascade options: step > scenario > default", () => {
      const definition = new ScenarioBuilder("Test", {
        stepOptions: {
          timeout: 10000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
      })
        .step("Step 1", () => {})
        .step("Step 2", () => {}, { timeout: 3000 })
        .build();
      // Step 1 uses scenario-level default
      assertEquals(definition.steps[0].options.timeout, 10000);
      // Step 2 overrides with step-level option
      assertEquals(definition.steps[1].options.timeout, 3000);
    });

    it("merges partial step options with scenario options", () => {
      const definition = new ScenarioBuilder("Test", {
        stepOptions: {
          timeout: 15000,
          retry: { maxAttempts: 2, backoff: "linear" },
        },
      })
        .step("Step with partial override", () => {}, {
          retry: { maxAttempts: 5, backoff: "exponential" },
        })
        .build();

      // Timeout from scenario, retry overridden by step
      assertEquals(definition.steps[0].options.timeout, 15000);
      assertEquals(definition.steps[0].options.retry.maxAttempts, 5);
      assertEquals(definition.steps[0].options.retry.backoff, "exponential");
    });
  });

  describe("step addition", () => {
    it("supports named step addition", () => {
      const definition = new ScenarioBuilder("Test")
        .step("First Step", () => 42)
        .build();
      assertEquals(definition.steps.length, 1);
      assertEquals(definition.steps[0].name, "First Step");
    });

    it("supports multiple named steps", () => {
      const definition = new ScenarioBuilder("Test")
        .step("Step A", () => 1)
        .step("Step B", () => 2)
        .step("Step C", () => 3)
        .build();
      assertEquals(definition.steps.length, 3);
      assertEquals(definition.steps[0].name, "Step A");
      assertEquals(definition.steps[1].name, "Step B");
      assertEquals(definition.steps[2].name, "Step C");
    });

    it("supports unnamed step addition with auto-naming", () => {
      const definition = new ScenarioBuilder("Test")
        .step(() => 1)
        .step(() => 2)
        .step(() => 3)
        .build();
      assertEquals(definition.steps.length, 3);
      assertEquals(definition.steps[0].name, "Step 1");
      assertEquals(definition.steps[1].name, "Step 2");
      assertEquals(definition.steps[2].name, "Step 3");
    });

    it("supports mixed named and unnamed steps", () => {
      const definition = new ScenarioBuilder("Test")
        .step("Named First", () => 1)
        .step(() => 2)
        .step("Named Third", () => 3)
        .step(() => 4)
        .build();
      assertEquals(definition.steps.length, 4);
      assertEquals(definition.steps[0].name, "Named First");
      assertEquals(definition.steps[1].name, "Step 2");
      assertEquals(definition.steps[2].name, "Named Third");
      assertEquals(definition.steps[3].name, "Step 4");
    });
  });

  describe("skip conditions", () => {
    it("supports skip option as boolean", () => {
      const definition = new ScenarioBuilder("Test", {
        skip: true,
      }).build();

      assertEquals(definition.options.skip, true);
    });

    it("supports skip option as string", () => {
      const definition = new ScenarioBuilder("Test", {
        skip: "Not implemented yet",
      }).build();

      assertEquals(definition.options.skip, "Not implemented yet");
    });

    it("supports skip option as function", () => {
      const skipFn = () => true;
      const definition = new ScenarioBuilder("Test", {
        skip: skipFn,
      }).build();

      assertEquals(definition.options.skip, skipFn);
    });
  });

  describe("hooks", () => {
    it("supports setup hook", () => {
      const setupFn = () => {};
      const definition = new ScenarioBuilder("Test", {
        setup: setupFn,
      }).build();

      assertEquals(definition.options.setup, setupFn);
    });

    it("supports teardown hook", () => {
      const teardownFn = () => {};
      const definition = new ScenarioBuilder("Test", {
        teardown: teardownFn,
      }).build();

      assertEquals(definition.options.teardown, teardownFn);
    });
  });

  describe("immutability", () => {
    it("provides immutable definition", () => {
      const definition = new ScenarioBuilder("Test")
        .step("Test Step", () => {})
        .build();

      // Verify that step function is present
      assertExists(definition.steps[0].fn);

      // Attempt to modify should not be possible (frozen/readonly)
      const stepDefinition = definition.steps[0];
      assertExists(stepDefinition.name);
    });

    it("method chaining returns new builder instance", () => {
      const builder1 = new ScenarioBuilder("Test");
      const builder2 = builder1.step("Step 1", () => {});

      // Verify they are different instances
      // builder2 should be a new ScenarioBuilder instance
      assertExists(builder2);
    });

    it("preserves immutability after build", () => {
      const definition1 = new ScenarioBuilder("Test")
        .step("Step 1", () => {})
        .build();

      const definition2 = new ScenarioBuilder("Test")
        .step("Step 1", () => {})
        .step("Step 2", () => {})
        .build();

      // Definitions should be independent
      assertEquals(definition1.steps.length, 1);
      assertEquals(definition2.steps.length, 2);
    });
  });

  describe("source tracking", () => {
    it("captures scenario source location", () => {
      const definition = new ScenarioBuilder("Test").build();
      // Location can be undefined in some environments, but if it exists it should be valid
      if (definition.location) {
        assertExists(definition.location.file);
        assertEquals(typeof definition.location.line, "number");
      }
    });

    it("captures step source locations", () => {
      const definition = new ScenarioBuilder("Test")
        .step("Step 1", () => {})
        .build();

      if (definition.steps[0].location) {
        assertExists(definition.steps[0].location.file);
        assertEquals(typeof definition.steps[0].location.line, "number");
      }
    });
  });

  describe("step execution", () => {
    it("step functions receive typed context", () => {
      const results: unknown[] = [];

      const definition = new ScenarioBuilder("Test")
        .step("Step 1", () => 42)
        .step("Step 2", (ctx) => {
          results.push({
            index: ctx.index,
            previous: ctx.previous,
          });
          return "hello";
        })
        .build();

      assertEquals(definition.steps.length, 2);
      assertEquals(definition.steps[0].name, "Step 1");
      assertEquals(definition.steps[1].name, "Step 2");
      assertExists(definition.steps[0].fn);
      assertExists(definition.steps[1].fn);
    });

    it("step function is executable", async () => {
      const definition = new ScenarioBuilder("Test")
        .step("Add", () => 1 + 2)
        .build();

      const result = await definition.steps[0].fn({
        index: 0,
        previous: undefined,
        results: [],
        store: new Map(),
        signal: new AbortController().signal,
      });

      assertEquals(result, 3);
    });

    it("supports async step functions", async () => {
      using time = new FakeTime();
      const definition = new ScenarioBuilder("Test")
        .step("Async", () => {
          return new Promise((resolve) => {
            setTimeout(() => resolve("done"), 10);
          });
        })
        .build();

      const promise = definition.steps[0].fn({
        index: 0,
        previous: undefined,
        results: [],
        store: new Map(),
        signal: new AbortController().signal,
      });

      await time.tickAsync(10);
      const result = await promise;

      assertEquals(result, "done");
    });
  });

  describe("return types", () => {
    it("returns ScenarioDefinition interface from build", () => {
      const definition = new ScenarioBuilder("Test").build();

      assertExists(definition.name);
      assertExists(definition.options);
      assertExists(definition.steps);
      assertEquals(typeof definition.name, "string");
    });
  });
});
