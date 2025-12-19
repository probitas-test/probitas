import { expect } from "@std/expect";
import { raise } from "@core/errorutil/raise";
import {
  createTestScenario,
  createTestStep,
  TestReporter,
} from "./_testutils.ts";
import { ScenarioRunner } from "./scenario_runner.ts";

const reporter = new TestReporter();

Deno.test("ScenarioRunner run runs scenario with no step", async () => {
  const scenario = createTestScenario();
  const runner = new ScenarioRunner(
    reporter,
  );
  const scenarioResult = await runner.run(scenario);
  expect(scenarioResult).toMatchObject({
    status: "passed",
    steps: [],
    metadata: {
      name: "Test Scenario",
    },
  });
});

Deno.test("ScenarioRunner run runs scenario with single step", async () => {
  const scenario = createTestScenario({
    steps: [
      createTestStep({
        fn: () => "ok",
      }),
    ],
  });
  const runner = new ScenarioRunner(
    reporter,
  );
  const scenarioResult = await runner.run(scenario);
  expect(scenarioResult).toMatchObject({
    status: "passed",
    steps: [{
      status: "passed",
      value: "ok",
    }],
    metadata: {
      name: "Test Scenario",
    },
  });
});

Deno.test("ScenarioRunner run runs scenario with single step (fail)", async () => {
  const scenario = createTestScenario({
    steps: [
      createTestStep({
        fn: () => raise("ng"),
      }),
    ],
  });
  const runner = new ScenarioRunner(
    reporter,
  );
  const scenarioResult = await runner.run(scenario);
  expect(scenarioResult).toMatchObject({
    status: "failed",
    steps: [{
      status: "failed",
      error: new Error("ng"),
    }],
    metadata: {
      name: "Test Scenario",
    },
  });
});

Deno.test("ScenarioRunner run runs scenario with multiple steps", async () => {
  const scenario = createTestScenario({
    steps: [
      createTestStep({
        fn: () => "1",
      }),
      createTestStep({
        fn: () => "2",
      }),
      createTestStep({
        fn: () => "3",
      }),
    ],
  });
  const runner = new ScenarioRunner(
    reporter,
  );
  const scenarioResult = await runner.run(scenario);
  expect(scenarioResult).toMatchObject({
    status: "passed",
    steps: [
      {
        status: "passed",
        value: "1",
      },
      {
        status: "passed",
        value: "2",
      },
      {
        status: "passed",
        value: "3",
      },
    ],
    metadata: {
      name: "Test Scenario",
    },
  });
});

Deno.test("ScenarioRunner run runs scenario with multiple steps (fail)", async () => {
  const scenario = createTestScenario({
    steps: [
      createTestStep({
        fn: () => "1",
      }),
      createTestStep({
        fn: () => raise("2"),
      }),
      createTestStep({
        fn: () => "3",
      }),
    ],
  });
  const runner = new ScenarioRunner(
    reporter,
  );
  const scenarioResult = await runner.run(scenario);
  expect(scenarioResult).toMatchObject({
    status: "failed",
    steps: [
      {
        status: "passed",
        value: "1",
      },
      {
        status: "failed",
        error: new Error("2"),
      },
    ],
    metadata: {
      name: "Test Scenario",
    },
  });
});
