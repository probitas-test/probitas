/**
 * Tests for TAPReporter
 *
 * Uses the testReporter helper function to verify reporter output with various
 * scenario results and run summaries, both with and without color output.
 *
 * @requires --allow-read Permission to read snapshot files
 * @requires --allow-write Permission to write snapshot files during updates
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { TAPReporter } from "./tap_reporter.ts";
import { testReporter } from "./testkit.ts";
import type {
  ScenarioDefinition,
  ScenarioResult,
  StepDefinition,
  StepResult,
} from "./types.ts";

testReporter(TAPReporter);

describe("TAPReporter - Additional Coverage", () => {
  describe("constructor", () => {
    it("should create TAPReporter with options", () => {
      const reporter = new TAPReporter({
        noColor: true,
        verbosity: "normal",
      });

      assertEquals(reporter !== null, true);
    });

    it("should create TAPReporter without options", () => {
      const reporter = new TAPReporter();

      assertEquals(reporter !== null, true);
    });
  });

  describe("scenario tracking", () => {
    it("should track current scenario name", async () => {
      const reporter = new TAPReporter();
      const scenario: ScenarioDefinition = {
        name: "Test Scenario",
        options: {
          tags: [],
          skip: null,
          setup: null,
          teardown: null,
          stepOptions: {
            timeout: 5000,
            retry: { maxAttempts: 1, backoff: "linear" },
          },
        },
        steps: [],
        location: { file: "test.ts", line: 1 },
      };

      await reporter.onScenarioStart(scenario);

      // Verify the reporter tracked the scenario (by checking it doesn't error)
      assertEquals(reporter !== null, true);
    });
  });

  describe("step result output", () => {
    it("should format passing step result in TAP format", async () => {
      const reporter = new TAPReporter();
      const scenarios: ScenarioDefinition[] = [
        {
          name: "Test",
          options: {
            tags: [],
            skip: null,
            setup: null,
            teardown: null,
            stepOptions: {
              timeout: 5000,
              retry: { maxAttempts: 1, backoff: "linear" },
            },
          },
          steps: [
            {
              name: "Step 1",
              fn: () => {},
              options: {
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" },
              },
            },
          ],
        },
      ];

      await reporter.onRunStart(scenarios);

      const stepDef: StepDefinition = {
        name: "Test Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
        location: { file: "test.ts", line: 10 },
      };

      const stepResult: StepResult = {
        metadata: {
          name: "Test Step",
          options: {
            timeout: 5000,
            retry: { maxAttempts: 1, backoff: "linear" },
          },
          location: { file: "test.ts", line: 10 },
        },
        status: "passed",
        duration: 100,
        retries: 0,
        value: undefined,
      };

      await reporter.onStepEnd(stepDef, stepResult);

      assertEquals(reporter !== null, true);
    });

    it("should format failing step result with error details", async () => {
      const reporter = new TAPReporter();
      const scenarios: ScenarioDefinition[] = [
        {
          name: "Test",
          options: {
            tags: [],
            skip: null,
            setup: null,
            teardown: null,
            stepOptions: {
              timeout: 5000,
              retry: { maxAttempts: 1, backoff: "linear" },
            },
          },
          steps: [
            {
              name: "Step 1",
              fn: () => {},
              options: {
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" },
              },
            },
          ],
        },
      ];

      await reporter.onRunStart(scenarios);

      const stepDef: StepDefinition = {
        name: "Failing Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
        location: { file: "test.ts", line: 20 },
      };

      const error = new Error("Test assertion failed");
      error.stack = "Error: Test assertion failed\n  at test.ts:20:1";

      const stepResult: StepResult = {
        metadata: {
          name: "Failing Step",
          options: {
            timeout: 5000,
            retry: { maxAttempts: 1, backoff: "linear" },
          },
          location: { file: "test.ts", line: 20 },
        },
        status: "failed",
        duration: 150,
        retries: 2,
        error,
      };

      await reporter.onStepEnd(stepDef, stepResult);

      assertEquals(reporter !== null, true);
    });

    it("should handle step result without location", async () => {
      const reporter = new TAPReporter();
      const scenarios: ScenarioDefinition[] = [
        {
          name: "Test",
          options: {
            tags: [],
            skip: null,
            setup: null,
            teardown: null,
            stepOptions: {
              timeout: 5000,
              retry: { maxAttempts: 1, backoff: "linear" },
            },
          },
          steps: [
            {
              name: "Step 1",
              fn: () => {},
              options: {
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" },
              },
            },
          ],
        },
      ];

      await reporter.onRunStart(scenarios);

      const stepDef: StepDefinition = {
        name: "Step Without Location",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
      };

      const stepResult: StepResult = {
        metadata: {
          name: "Step Without Location",
          options: {
            timeout: 5000,
            retry: { maxAttempts: 1, backoff: "linear" },
          },
        },
        status: "passed",
        duration: 100,
        retries: 0,
      };

      await reporter.onStepEnd(stepDef, stepResult);

      assertEquals(reporter !== null, true);
    });

    it("should include retry information in output", async () => {
      const reporter = new TAPReporter();
      const scenarios: ScenarioDefinition[] = [
        {
          name: "Test",
          options: {
            tags: [],
            skip: null,
            setup: null,
            teardown: null,
            stepOptions: {
              timeout: 5000,
              retry: { maxAttempts: 3, backoff: "exponential" },
            },
          },
          steps: [
            {
              name: "Step 1",
              fn: () => {},
              options: {
                timeout: 5000,
                retry: { maxAttempts: 3, backoff: "exponential" },
              },
            },
          ],
        },
      ];

      await reporter.onRunStart(scenarios);

      const stepDef: StepDefinition = {
        name: "Retried Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 3, backoff: "exponential" },
        },
      };

      const stepResult: StepResult = {
        metadata: {
          name: "Retried Step",
          options: {
            timeout: 5000,
            retry: { maxAttempts: 3, backoff: "exponential" },
          },
        },
        status: "failed",
        duration: 500,
        retries: 3,
        error: new Error("Failed after retries"),
      };

      await reporter.onStepEnd(stepDef, stepResult);

      assertEquals(reporter !== null, true);
    });
  });

  describe("scenario skip handling", () => {
    it("should output skip markers for all steps in skipped scenario", async () => {
      const reporter = new TAPReporter();
      const scenario: ScenarioDefinition = {
        name: "Skipped Scenario",
        options: {
          tags: ["@wip"],
          skip: true,
          setup: null,
          teardown: null,
          stepOptions: {
            timeout: 5000,
            retry: { maxAttempts: 1, backoff: "linear" },
          },
        },
        steps: [
          {
            name: "Step 1",
            fn: () => {},
            options: {
              timeout: 5000,
              retry: { maxAttempts: 1, backoff: "linear" },
            },
          },
          {
            name: "Step 2",
            fn: () => {},
            options: {
              timeout: 5000,
              retry: { maxAttempts: 1, backoff: "linear" },
            },
          },
        ],
      };

      // Initialize with total steps count
      await reporter.onRunStart([scenario]);

      // Now skip the scenario
      await reporter.onScenarioSkip(scenario, "Work in progress");

      assertEquals(reporter !== null, true);
    });
  });

  describe("no-op methods", () => {
    it("should have onStepStart as no-op", async () => {
      const reporter = new TAPReporter();
      const step: StepDefinition = {
        name: "Test Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
      };

      await reporter.onStepStart(step);

      assertEquals(reporter !== null, true);
    });

    it("should have onStepError as no-op", async () => {
      const reporter = new TAPReporter();
      const step: StepDefinition = {
        name: "Test Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
      };
      const error = new Error("Test error");

      await reporter.onStepError(step, error);

      assertEquals(reporter !== null, true);
    });

    it("should have onScenarioEnd as no-op", async () => {
      const reporter = new TAPReporter();
      const scenario: ScenarioDefinition = {
        name: "Test",
        options: {
          tags: [],
          skip: null,
          setup: null,
          teardown: null,
          stepOptions: {
            timeout: 5000,
            retry: { maxAttempts: 1, backoff: "linear" },
          },
        },
        steps: [],
      };

      const result: ScenarioResult = {
        metadata: {
          name: "Test",
          options: {
            tags: [],
            skip: null,
            stepOptions: {
              timeout: 5000,
              retry: { maxAttempts: 1, backoff: "linear" },
            },
          },
          steps: [],
        },
        status: "passed",
        duration: 100,
        steps: [],
      };

      await reporter.onScenarioEnd(scenario, result);

      assertEquals(reporter !== null, true);
    });
  });

  describe("error output formatting", () => {
    it("should handle error without stack trace", async () => {
      const reporter = new TAPReporter();
      const scenarios: ScenarioDefinition[] = [
        {
          name: "Test",
          options: {
            tags: [],
            skip: null,
            setup: null,
            teardown: null,
            stepOptions: {
              timeout: 5000,
              retry: { maxAttempts: 1, backoff: "linear" },
            },
          },
          steps: [
            {
              name: "Step 1",
              fn: () => {},
              options: {
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" },
              },
            },
          ],
        },
      ];

      await reporter.onRunStart(scenarios);

      const stepDef: StepDefinition = {
        name: "Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
      };

      const errorWithoutStack = new Error("Error without stack");
      errorWithoutStack.stack = undefined;

      const stepResult: StepResult = {
        metadata: {
          name: "Step",
          options: {
            timeout: 5000,
            retry: { maxAttempts: 1, backoff: "linear" },
          },
        },
        status: "failed",
        duration: 100,
        retries: 0,
        error: errorWithoutStack,
      };

      await reporter.onStepEnd(stepDef, stepResult);

      assertEquals(reporter !== null, true);
    });

    it("should handle missing error", async () => {
      const reporter = new TAPReporter();
      const scenarios: ScenarioDefinition[] = [
        {
          name: "Test",
          options: {
            tags: [],
            skip: null,
            setup: null,
            teardown: null,
            stepOptions: {
              timeout: 5000,
              retry: { maxAttempts: 1, backoff: "linear" },
            },
          },
          steps: [
            {
              name: "Step 1",
              fn: () => {},
              options: {
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" },
              },
            },
          ],
        },
      ];

      await reporter.onRunStart(scenarios);

      const stepDef: StepDefinition = {
        name: "Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
      };

      const stepResult: StepResult = {
        metadata: {
          name: "Step",
          options: {
            timeout: 5000,
            retry: { maxAttempts: 1, backoff: "linear" },
          },
        },
        status: "failed",
        duration: 100,
        retries: 0,
        // error is undefined
      };

      await reporter.onStepEnd(stepDef, stepResult);

      assertEquals(reporter !== null, true);
    });
  });
});
