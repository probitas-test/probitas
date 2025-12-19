import { expect } from "@std/expect";
import { raise } from "@core/errorutil/raise";
import { assertSpyCalls, spy, type SpyLike } from "@std/testing/mock";
import {
  createTestScenario,
  createTestScenarioContext,
  createTestStep,
  TestReporter,
} from "./_testutils.ts";
import { StepRunner } from "./step_runner.ts";

const reporter = new TestReporter();
const scenario = createTestScenario();

Deno.test("StepRunner run runs resource step", async () => {
  await using stack = new AsyncDisposableStack();
  const scenarioCtx = createTestScenarioContext(scenario);
  const runner = new StepRunner(
    reporter,
    scenario,
    scenarioCtx,
  );
  const step = createTestStep({
    kind: "resource",
    name: "foo",
    fn: spy(() => "bar"),
  });
  const stepResult = await runner.run(step, stack);
  assertSpyCalls(step.fn as SpyLike, 1);
  expect(stepResult).toMatchObject({
    status: "passed",
    value: "bar",
    metadata: {
      kind: "resource",
      name: "foo",
    },
  });
  expect(scenarioCtx.resources).toEqual({
    foo: "bar",
  });
});

Deno.test("StepRunner run runs resource step (fail)", async () => {
  await using stack = new AsyncDisposableStack();
  const scenarioCtx = createTestScenarioContext(scenario);
  const runner = new StepRunner(
    reporter,
    scenario,
    scenarioCtx,
  );
  const step = createTestStep({
    kind: "resource",
    name: "foo",
    fn: spy(() => raise("bar")),
  });
  const stepResult = await runner.run(step, stack);
  assertSpyCalls(step.fn as SpyLike, 1);
  expect(stepResult).toMatchObject({
    status: "failed",
    error: new Error("bar"),
    metadata: {
      kind: "resource",
      name: "foo",
    },
  });
  expect(scenarioCtx.resources).toEqual({});
});

Deno.test("StepRunner run runs setup step", async () => {
  await using stack = new AsyncDisposableStack();
  const scenarioCtx = createTestScenarioContext(scenario);
  const runner = new StepRunner(
    reporter,
    scenario,
    scenarioCtx,
  );
  const step = createTestStep({
    kind: "setup",
    name: "foo",
    fn: spy(() => "bar"),
  });
  const stepResult = await runner.run(step, stack);
  assertSpyCalls(step.fn as SpyLike, 1);
  expect(stepResult).toMatchObject({
    status: "passed",
    value: undefined,
    metadata: {
      kind: "setup",
      name: "foo",
    },
  });
  expect(scenarioCtx.resources).toEqual({});
});

Deno.test("StepRunner run runs setup step (fail)", async () => {
  await using stack = new AsyncDisposableStack();
  const scenarioCtx = createTestScenarioContext(scenario);
  const runner = new StepRunner(
    reporter,
    scenario,
    scenarioCtx,
  );
  const step = createTestStep({
    kind: "setup",
    name: "foo",
    fn: spy(() => raise("bar")),
  });
  const stepResult = await runner.run(step, stack);
  assertSpyCalls(step.fn as SpyLike, 1);
  expect(stepResult).toMatchObject({
    status: "failed",
    error: new Error("bar"),
    metadata: {
      kind: "setup",
      name: "foo",
    },
  });
  expect(scenarioCtx.resources).toEqual({});
});

Deno.test("StepRunner run runs execution step", async () => {
  await using stack = new AsyncDisposableStack();
  const scenarioCtx = createTestScenarioContext(scenario);
  const runner = new StepRunner(
    reporter,
    scenario,
    scenarioCtx,
  );
  const step = createTestStep({
    kind: "step",
    name: "foo",
    fn: spy(() => "bar"),
  });
  const stepResult = await runner.run(step, stack);
  assertSpyCalls(step.fn as SpyLike, 1);
  expect(stepResult).toMatchObject({
    status: "passed",
    value: "bar",
    metadata: {
      kind: "step",
      name: "foo",
    },
  });
  expect(scenarioCtx.resources).toEqual({});
});

Deno.test("StepRunner run runs execution step (fail)", async () => {
  await using stack = new AsyncDisposableStack();
  const scenarioCtx = createTestScenarioContext(scenario);
  const runner = new StepRunner(
    reporter,
    scenario,
    scenarioCtx,
  );
  const step = createTestStep({
    kind: "step",
    name: "foo",
    fn: spy(() => raise("bar")),
  });
  const stepResult = await runner.run(step, stack);
  assertSpyCalls(step.fn as SpyLike, 1);
  expect(stepResult).toMatchObject({
    status: "failed",
    error: new Error("bar"),
    metadata: {
      kind: "step",
      name: "foo",
    },
  });
  expect(scenarioCtx.resources).toEqual({});
});
