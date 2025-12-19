import { expect } from "@std/expect";
import { delay } from "@std/async/delay";
import { raise } from "@core/errorutil/raise";
import {
  createTestScenario,
  createTestStep,
  TestReporter,
} from "./_testutils.ts";
import { Skip } from "./skip.ts";
import { Runner } from "./runner.ts";
import { createScopedSignal } from "./utils/signal.ts";

const reporter = new TestReporter();

Deno.test("Runner run runs single scenario", async () => {
  const runner = new Runner(reporter);
  const scenarios = [
    createTestScenario({
      name: "Scenario 1",
      steps: [
        createTestStep({
          name: "Step 1",
          fn: () => "1",
        }),
      ],
    }),
  ];

  const summary = await runner.run(scenarios);
  expect(summary).toMatchObject({
    total: 1,
    passed: 1,
    skipped: 0,
    failed: 0,
  });
});

Deno.test("Runner run runs single scenario (skip)", async () => {
  const runner = new Runner(reporter);
  const scenarios = [
    createTestScenario({
      name: "Scenario 1",
      steps: [
        createTestStep({
          name: "Step 1",
          fn: () => raise(new Skip("1")),
        }),
      ],
    }),
  ];

  const summary = await runner.run(scenarios);
  expect(summary).toMatchObject({
    total: 1,
    passed: 0,
    skipped: 1,
    failed: 0,
  });
});

Deno.test("Runner run runs multiple scenarios", async () => {
  const runner = new Runner(reporter);
  const scenarios = [
    createTestScenario({
      name: "Scenario 1",
      steps: [
        createTestStep({
          name: "Step 1",
          fn: () => "1",
        }),
      ],
    }),
    createTestScenario({
      name: "Scenario 2",
      steps: [
        createTestStep({
          name: "Step 1",
          fn: () => "1",
        }),
      ],
    }),
    createTestScenario({
      name: "Scenario 3",
      steps: [
        createTestStep({
          name: "Step 1",
          fn: () => "1",
        }),
      ],
    }),
  ];

  const summary = await runner.run(scenarios);
  expect(summary).toMatchObject({
    total: 3,
    passed: 3,
    skipped: 0,
    failed: 0,
  });
});

Deno.test("Runner run runs multiple scenarios (skip)", async () => {
  const runner = new Runner(reporter);
  const scenarios = [
    createTestScenario({
      name: "Scenario 1",
      steps: [
        createTestStep({
          name: "Step 1",
          fn: () => "1",
        }),
      ],
    }),
    createTestScenario({
      name: "Scenario 2",
      steps: [
        createTestStep({
          name: "Step 1",
          fn: () => raise(new Skip("1")),
        }),
      ],
    }),
    createTestScenario({
      name: "Scenario 3",
      steps: [
        createTestStep({
          name: "Step 1",
          fn: () => "1",
        }),
      ],
    }),
  ];

  const summary = await runner.run(scenarios);
  expect(summary).toMatchObject({
    total: 3,
    passed: 2,
    skipped: 1,
    failed: 0,
  });
});

Deno.test("Runner run runs multiple scenarios (failed)", async () => {
  using signal = createScopedSignal();
  const runner = new Runner(reporter);
  const scenarios = [
    createTestScenario({
      name: "Scenario 1",
      steps: [
        createTestStep({
          name: "Step 1",
          fn: async () => {
            await delay(0, { signal });
            return "1";
          },
        }),
      ],
    }),
    createTestScenario({
      name: "Scenario 2",
      steps: [
        createTestStep({
          name: "Step 1",
          fn: async () => {
            await delay(50, { signal });
            throw "2";
          },
        }),
      ],
    }),
    createTestScenario({
      name: "Scenario 3",
      steps: [
        createTestStep({
          name: "Step 1",
          fn: async () => {
            await delay(100, { signal });
            return "3";
          },
        }),
      ],
    }),
  ];

  const summary = await runner.run(scenarios, {
    signal,
    maxFailures: 1,
  });
  expect(summary).toMatchObject({
    total: 3,
    passed: 1,
    skipped: 1,
    failed: 1,
  });
});
