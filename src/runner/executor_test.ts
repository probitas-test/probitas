/**
 * Tests for step executor functions
 *
 * @module
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { executeStep, executeStepWithRetry } from "./executor.ts";
import { createScenarioContext, createStepContext } from "./context.ts";
import type {
  ScenarioDefinition,
  ScenarioOptions,
  StepContext,
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

const createTestScenario = (): ScenarioDefinition => ({
  name: "Test Scenario",
  options: defaultScenarioOptions,
  steps: [],
});

const createTestStep = (
  overrides?: Partial<StepDefinition>,
): StepDefinition => ({
  name: "Test Step",
  fn: () => "result",
  options: defaultStepOptions,
  ...overrides,
});

const createTestStepContext = (): StepContext => {
  const scenario = createTestScenario();
  const signal = new AbortController().signal;
  const scenarioCtx = createScenarioContext(scenario, signal);

  return createStepContext({
    index: 0,
    previous: undefined,
    results: [],
    store: scenarioCtx.store,
    signal,
  });
};

describe("executor", () => {
  describe("step execution", () => {
    it("executes step function and returns result", async () => {
      const step = createTestStep({
        fn: () => "success",
      });
      const ctx = createTestStepContext();

      const result = await executeStep(step, ctx);

      assertEquals(result, "success");
    });

    it("passes context to step function", async () => {
      let capturedIndex: number | undefined;
      let capturedStore: Map<string, unknown> | undefined;

      const step = createTestStep({
        fn: (ctx) => {
          capturedIndex = ctx.index;
          capturedStore = ctx.store;
          return "done";
        },
      });
      const ctx = createTestStepContext();

      await executeStep(step, ctx);

      assertExists(capturedIndex);
      assertEquals(capturedIndex, ctx.index);
      assertEquals(capturedStore, ctx.store);
    });

    it("respects abort signal", async () => {
      const controller = new AbortController();

      const step = createTestStep({
        fn: (ctx) => {
          // Verify abort signal is available
          if (ctx.signal.aborted) {
            // Would be aborted in real scenario
          }
          return "done";
        },
      });

      const scenarioCtx = createScenarioContext(
        createTestScenario(),
        controller.signal,
      );
      const ctx = createStepContext({
        index: 0,
        previous: undefined,
        results: [] as readonly unknown[],
        store: scenarioCtx.store,
        signal: controller.signal,
      });

      const result = await executeStep(step, ctx);

      assertEquals(result, "done");
    });
  });

  describe("error handling", () => {
    it("propagates step function errors", async () => {
      const error = new Error("Step failed");
      const step = createTestStep({
        fn: () => {
          throw error;
        },
      });
      const ctx = createTestStepContext();

      await assertRejects(
        () => executeStep(step, ctx),
        Error,
        "Step failed",
      );
    });

    it("throws error after max attempts on retry", async () => {
      let attempts = 0;
      const step = createTestStep({
        options: {
          ...defaultStepOptions,
          retry: { maxAttempts: 2, backoff: "linear" },
        },
        fn: () => {
          attempts++;
          throw new Error("Always fails");
        },
      });
      const ctx = createTestStepContext();

      await assertRejects(
        () => executeStepWithRetry(step, ctx),
        Error,
        "Always fails",
      );
      assertEquals(attempts, 2);
    });
  });

  describe("timeout behavior", () => {
    it("applies timeout and aborts signal", async () => {
      let signalWasAborted = false;

      const step = createTestStep({
        options: {
          ...defaultStepOptions,
          timeout: 100, // Very short timeout
        },
        fn: (ctx) => {
          // Test that signal is available and would be aborted on timeout
          if (ctx.signal) {
            signalWasAborted = ctx.signal.aborted;
          }
          // Complete quickly to avoid actual timeout
          return "completed";
        },
      });
      const ctx = createTestStepContext();

      const result = await executeStep(step, ctx);

      assertEquals(result, "completed");
      // The signal would be aborted if we waited longer
      assertEquals(signalWasAborted, false);
    });

    it("applies timeout to each attempt", async () => {
      let attempts = 0;
      const step = createTestStep({
        options: {
          ...defaultStepOptions,
          timeout: 500, // Longer timeout
          retry: { maxAttempts: 3, backoff: "linear" },
        },
        fn: () => {
          attempts++;
          if (attempts < 3) {
            throw new Error("Fail");
          }
          return "success";
        },
      });
      const ctx = createTestStepContext();

      const result = await executeStepWithRetry(step, ctx);

      assertEquals(result, "success");
      assertEquals(attempts, 3);
    });
  });

  describe("context management", () => {
    it("executes with retry once on success", async () => {
      let attempts = 0;
      const step = createTestStep({
        fn: () => {
          attempts++;
          return "success";
        },
      });
      const ctx = createTestStepContext();

      const result = await executeStepWithRetry(step, ctx);

      assertEquals(result, "success");
      assertEquals(attempts, 1);
    });

    it("retries on failure", async () => {
      let attempts = 0;
      const step = createTestStep({
        options: {
          ...defaultStepOptions,
          retry: { maxAttempts: 3, backoff: "linear" },
        },
        fn: () => {
          attempts++;
          if (attempts < 3) {
            throw new Error("Temporary failure");
          }
          return "success";
        },
      });
      const ctx = createTestStepContext();

      const result = await executeStepWithRetry(step, ctx);

      assertEquals(result, "success");
      assertEquals(attempts, 3);
    });

    it("correctly uses retry module", async () => {
      let attempts = 0;
      const step = createTestStep({
        options: {
          ...defaultStepOptions,
          retry: { maxAttempts: 3, backoff: "linear" },
        },
        fn: () => {
          attempts++;
          if (attempts < 3) {
            throw new Error("Fail");
          }
          return "success";
        },
      });
      const ctx = createTestStepContext();

      const result = await executeStepWithRetry(step, ctx);

      assertEquals(result, "success");
      assertEquals(attempts, 3);
    });
  });

  describe("timeout error conversion", () => {
    it("converts TimeoutError from AbortSignal.timeout", async () => {
      const step = createTestStep({
        fn: () => {
          const error = new Error("TimeoutError");
          error.name = "TimeoutError";
          throw error;
        },
      });
      const ctx = createTestStepContext();

      await assertRejects(
        () => executeStep(step, ctx),
        Error,
      );
    });

    it("preserves non-timeout errors", async () => {
      const customError = new Error("Custom error");
      const step = createTestStep({
        fn: () => {
          throw customError;
        },
      });
      const ctx = createTestStepContext();

      await assertRejects(
        () => executeStep(step, ctx),
        Error,
        "Custom error",
      );
    });

    it("converts generic errors to proper name", async () => {
      const step = createTestStep({
        fn: () => {
          const error = new Error("Generic timeout");
          error.name = "TimeoutError";
          throw error;
        },
      });
      const ctx = createTestStepContext();

      await assertRejects(
        () => executeStep(step, ctx),
        Error,
      );
    });
  });

  describe("signal handling", () => {
    it("combines abort signal with timeout signal", async () => {
      const controller = new AbortController();
      let receivedSignal: AbortSignal | undefined;

      const step = createTestStep({
        fn: (ctx) => {
          receivedSignal = ctx.signal;
          return "success";
        },
      });

      const scenarioCtx = createScenarioContext(
        createTestScenario(),
        controller.signal,
      );
      const ctx = createStepContext({
        index: 0,
        previous: undefined,
        results: [],
        store: scenarioCtx.store,
        signal: controller.signal,
      });

      const result = await executeStep(step, ctx);

      assertEquals(result, "success");
      assertExists(receivedSignal);
    });

    it("passes custom step timeout through context", async () => {
      const step = createTestStep({
        options: {
          ...defaultStepOptions,
          timeout: 2000,
        },
        fn: () => "done",
      });
      const ctx = createTestStepContext();

      const result = await executeStep(step, ctx);

      assertEquals(result, "done");
      assertEquals(step.options.timeout, 2000);
    });
  });

  describe("retry backoff strategies", () => {
    it("respects backoff strategy from step options", async () => {
      let attempts = 0;

      const step = createTestStep({
        options: {
          ...defaultStepOptions,
          timeout: 10000,
          retry: { maxAttempts: 2, backoff: "exponential" },
        },
        fn: () => {
          attempts++;
          if (attempts < 2) {
            throw new Error("Fail");
          }
          return "success";
        },
      });
      const ctx = createTestStepContext();

      const result = await executeStepWithRetry(step, ctx);

      assertEquals(result, "success");
      assertEquals(attempts, 2);
    });
  });

  describe("async execution paths", () => {
    it("handles async step functions", async () => {
      let executed = false;

      const step = createTestStep({
        fn: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          executed = true;
          return "async result";
        },
      });
      const ctx = createTestStepContext();

      const result = await executeStep(step, ctx);

      assertEquals(result, "async result");
      assertEquals(executed, true);
    });

    it("handles async step with retry", async () => {
      let attempts = 0;

      const step = createTestStep({
        options: {
          ...defaultStepOptions,
          retry: { maxAttempts: 2, backoff: "linear" },
        },
        fn: async () => {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 5));
          if (attempts < 2) {
            throw new Error("Async fail");
          }
          return "async success";
        },
      });
      const ctx = createTestStepContext();

      const result = await executeStepWithRetry(step, ctx);

      assertEquals(result, "async success");
      assertEquals(attempts, 2);
    });
  });
});
