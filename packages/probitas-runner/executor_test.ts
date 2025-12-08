/**
 * Tests for step executor functions
 *
 * @module
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { FakeTime } from "@std/testing/time";
import { executeStep } from "./executor.ts";
import { createStepContext } from "./context.ts";
import type { StepContext, StepDefinition } from "./types.ts";

const createTestStep = (
  overrides?: Partial<StepDefinition>,
): StepDefinition => ({
  name: "Test Step",
  fn: () => "result",
  timeout: 5000,
  retry: { maxAttempts: 1, backoff: "linear" },
  ...overrides,
});

const createTestStepContext = (): StepContext =>
  createStepContext({
    index: 0,
    previous: undefined,
    results: [],
    store: new Map(),
    signal: new AbortController().signal,
    resources: {},
  });

describe("executor", () => {
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

  it("handles async step functions", async () => {
    using time = new FakeTime();
    let executed = false;

    const step = createTestStep({
      fn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        executed = true;
        return "async result";
      },
    });
    const ctx = createTestStepContext();

    const resultPromise = executeStep(step, ctx);
    await time.tickAsync(10);
    const result = await resultPromise;

    assertEquals(result, "async result");
    assertEquals(executed, true);
  });
});
