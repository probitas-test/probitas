/**
 * Tests for context creation functions
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { createScenarioContext, createStepContext } from "./context.ts";
import type {
  ScenarioDefinition,
  ScenarioOptions,
  StepOptions,
} from "./types.ts";

const defaultStepOptions: StepOptions = {
  timeout: 30000,
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

describe("context creation", () => {
  describe("createScenarioContext", () => {
    it("creates mutable results array", () => {
      const scenario = createTestScenario();
      const signal = new AbortController().signal;
      const ctx = createScenarioContext(scenario, signal);

      (ctx.results as unknown[]).push("value1");
      assertEquals(ctx.results.length, 1);
      assertEquals((ctx.results as unknown[])[0], "value1");
    });

    it("creates mutable store", () => {
      const scenario = createTestScenario();
      const signal = new AbortController().signal;
      const ctx = createScenarioContext(scenario, signal);

      ctx.store.set("key", "value");
      assertEquals(ctx.store.get("key"), "value");
    });
  });

  describe("createStepContext", () => {
    it("shares store reference with scenario context", () => {
      const signal = new AbortController().signal;
      const store = new Map<string, unknown>();
      store.set("scenario-level", "value");

      const stepCtx = createStepContext({
        index: 0,
        previous: undefined,
        results: [],
        store,
        signal,
      });

      assertEquals(stepCtx.store.get("scenario-level"), "value");

      stepCtx.store.set("step-level", "data");
      assertEquals(store.get("step-level"), "data");
    });
  });
});
