/**
 * Tests for ScenarioBuilder class
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { FakeTime } from "@std/testing/time";
import { ScenarioBuilder } from "./scenario_builder.ts";

describe("ScenarioBuilder", () => {
  describe("creation", () => {
    it("builds scenario definition with name", () => {
      const definition = new ScenarioBuilder("My Scenario").build();
      assertEquals(definition.name, "My Scenario");
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
  });

  describe("step addition", () => {
    it("supports named step addition", () => {
      const definition = new ScenarioBuilder("Test")
        .step("First Step", () => 42)
        .build();
      assertEquals(definition.steps.length, 1);
      assertEquals(definition.steps[0].name, "First Step");
    });

    it("supports unnamed step addition with auto-naming", () => {
      const definition = new ScenarioBuilder("Test")
        .step(() => 1)
        .step(() => 2)
        .build();
      assertEquals(definition.steps.length, 2);
      assertEquals(definition.steps[0].name, "Step 1");
      assertEquals(definition.steps[1].name, "Step 2");
    });
  });

  describe("skip conditions", () => {
    it("supports skip option as boolean", () => {
      const definition = new ScenarioBuilder("Test", {
        skip: true,
      }).build();
      assertEquals(definition.options.skip, true);
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
});
