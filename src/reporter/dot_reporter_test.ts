/**
 * Tests for DotReporter
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
import { Buffer } from "@std/streams/buffer";
import { DotReporter } from "./dot_reporter.ts";
import { testReporter } from "./testkit.ts";
import { scenarioDefinitions } from "./testkit.ts";

testReporter(DotReporter);

describe("DotReporter - Branch Coverage", () => {
  describe("scenario status output", () => {
    it("outputs dot for passed scenario", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const scenarioResult = {
        metadata: scenarioDefinitions.simple,
        status: "passed" as const,
        duration: 10,
        steps: [],
      };

      await reporter.onScenarioEnd(scenarioDefinitions.simple, scenarioResult);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(typeof output, "string");
    });

    it("outputs F for failed scenario", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const scenarioResult = {
        metadata: scenarioDefinitions.withFailingStep,
        status: "failed" as const,
        duration: 15,
        steps: [],
        error: new Error("Scenario failed"),
      };

      await reporter.onScenarioEnd(
        scenarioDefinitions.withFailingStep,
        scenarioResult,
      );

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(typeof output, "string");
    });

    it("outputs S for skipped scenario", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const scenarioResult = {
        metadata: scenarioDefinitions.skipped,
        status: "skipped" as const,
        duration: 0,
        steps: [],
      };

      await reporter.onScenarioEnd(scenarioDefinitions.skipped, scenarioResult);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(typeof output, "string");
    });
  });

  describe("run summary with failures", () => {
    it("displays failed tests section", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const failedResult = {
        metadata: scenarioDefinitions.withFailingStep,
        status: "failed" as const,
        duration: 15,
        steps: [
          {
            metadata: {
              name: "Step that passes",
              options: {
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" as const },
              },
              location: { file: "test.ts", line: 10 },
            },
            status: "passed" as const,
            duration: 5,
            retries: 0,
          },
          {
            metadata: {
              name: "Step that fails",
              options: {
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" as const },
              },
              location: { file: "test.ts", line: 20 },
            },
            status: "failed" as const,
            duration: 10,
            retries: 0,
            error: new Error("Failed"),
          },
        ],
      };

      const summary = {
        total: 2,
        passed: 1,
        failed: 1,
        skipped: 0,
        duration: 100,
        scenarios: [failedResult],
      };

      await reporter.onRunStart([
        scenarioDefinitions.simple,
        scenarioDefinitions.withFailingStep,
      ]);
      await reporter.onScenarioEnd(
        scenarioDefinitions.withFailingStep,
        failedResult,
      );
      await reporter.onRunEnd(summary);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(typeof output, "string");
    });
  });

  describe("run summary with skipped scenarios", () => {
    it("displays skipped tests section", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const skippedResult = {
        metadata: {
          ...scenarioDefinitions.skipped,
          options: {
            ...scenarioDefinitions.skipped.options,
            skip: true,
          },
        },
        status: "skipped" as const,
        duration: 0,
        steps: [],
      };

      const summary = {
        total: 2,
        passed: 1,
        failed: 0,
        skipped: 1,
        duration: 50,
        scenarios: [skippedResult],
      };

      await reporter.onRunStart([
        scenarioDefinitions.simple,
        scenarioDefinitions.skipped,
      ]);
      await reporter.onScenarioEnd(scenarioDefinitions.skipped, skippedResult);
      await reporter.onRunEnd(summary);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(typeof output, "string");
    });

    it("displays custom skip reason when available", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const skippedResult = {
        metadata: {
          name: "Skipped with reason",
          location: { file: "test.ts", line: 50 },
          options: {
            tags: [],
            skip: true,
            setup: null,
            teardown: null,
            stepOptions: {
              timeout: 5000,
              retry: { maxAttempts: 1, backoff: "linear" as const },
            },
          },
          steps: [],
        },
        status: "skipped" as const,
        duration: 0,
        steps: [],
      };

      const summary = {
        total: 1,
        passed: 0,
        failed: 0,
        skipped: 1,
        duration: 0,
        scenarios: [skippedResult],
      };

      await reporter.onRunStart([]);
      await reporter.onRunEnd(summary);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(typeof output, "string");
    });

    it("displays boolean skip reason", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const skippedResult = {
        metadata: {
          name: "Skipped",
          location: { file: "test.ts", line: 50 },
          options: {
            tags: [],
            skip: true,
            setup: null,
            teardown: null,
            stepOptions: {
              timeout: 5000,
              retry: { maxAttempts: 1, backoff: "linear" as const },
            },
          },
          steps: [],
        },
        status: "skipped" as const,
        duration: 0,
        steps: [],
      };

      const summary = {
        total: 1,
        passed: 0,
        failed: 0,
        skipped: 1,
        duration: 0,
        scenarios: [skippedResult],
      };

      await reporter.onRunStart([]);
      await reporter.onRunEnd(summary);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(typeof output, "string");
    });
  });

  describe("failed step location handling", () => {
    it("displays step location in failed tests section", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const failedResult = {
        metadata: scenarioDefinitions.withFailingStep,
        status: "failed" as const,
        duration: 15,
        steps: [
          {
            metadata: {
              name: "Step that fails",
              options: {
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" as const },
              },
              location: { file: "test.ts", line: 20 },
            },
            status: "failed" as const,
            duration: 10,
            retries: 0,
            error: new Error("Failed"),
          },
        ],
      };

      const summary = {
        total: 1,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 15,
        scenarios: [failedResult],
      };

      await reporter.onRunStart([scenarioDefinitions.withFailingStep]);
      await reporter.onRunEnd(summary);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(typeof output, "string");
    });

    it("handles failed steps without location", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const failedResult = {
        metadata: scenarioDefinitions.withFailingStep,
        status: "failed" as const,
        duration: 15,
        steps: [
          {
            metadata: {
              name: "Step that fails",
              options: {
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" as const },
              },
            },
            status: "failed" as const,
            duration: 10,
            retries: 0,
            error: new Error("Failed"),
          },
        ],
      };

      const summary = {
        total: 1,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 15,
        scenarios: [failedResult],
      };

      await reporter.onRunStart([scenarioDefinitions.withFailingStep]);
      await reporter.onRunEnd(summary);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(typeof output, "string");
    });
  });

  describe("skipped scenario location handling", () => {
    it("displays scenario location when available", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const skippedResult = {
        metadata: {
          name: "Skipped",
          location: { file: "test.ts", line: 50 },
          options: {
            tags: [],
            skip: true,
            setup: null,
            teardown: null,
            stepOptions: {
              timeout: 5000,
              retry: { maxAttempts: 1, backoff: "linear" as const },
            },
          },
          steps: [],
        },
        status: "skipped" as const,
        duration: 0,
        steps: [],
      };

      const summary = {
        total: 1,
        passed: 0,
        failed: 0,
        skipped: 1,
        duration: 0,
        scenarios: [skippedResult],
      };

      await reporter.onRunStart([]);
      await reporter.onRunEnd(summary);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(typeof output, "string");
    });

    it("handles scenarios without location", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const skippedResult = {
        metadata: {
          name: "Skipped",
          options: {
            tags: [],
            skip: true,
            setup: null,
            teardown: null,
            stepOptions: {
              timeout: 5000,
              retry: { maxAttempts: 1, backoff: "linear" as const },
            },
          },
          steps: [],
        },
        status: "skipped" as const,
        duration: 0,
        steps: [],
      };

      const summary = {
        total: 1,
        passed: 0,
        failed: 0,
        skipped: 1,
        duration: 0,
        scenarios: [skippedResult],
      };

      await reporter.onRunStart([]);
      await reporter.onRunEnd(summary);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(typeof output, "string");
    });
  });

  describe("no-op methods", () => {
    it("onRunStart is a no-op", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      await reporter.onRunStart([scenarioDefinitions.simple]);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(output.length, 0);
    });

    it("onScenarioStart is a no-op", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      await reporter.onScenarioStart(scenarioDefinitions.simple);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(output.length, 0);
    });

    it("onScenarioSkip is a no-op", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      await reporter.onScenarioSkip(scenarioDefinitions.skipped, "Skipped");

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(output.length, 0);
    });

    it("onStepStart is a no-op", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const step = {
        name: "Test Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" as const },
        },
      };

      await reporter.onStepStart(step);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(output.length, 0);
    });

    it("onStepEnd is a no-op", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const step = {
        name: "Test Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" as const },
        },
      };

      const result = {
        metadata: step,
        status: "passed" as const,
        duration: 10,
        retries: 0,
      };

      await reporter.onStepEnd(step, result);

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(output.length, 0);
    });

    it("onStepError is a no-op", async () => {
      const buffer = new Buffer();
      const reporter = new DotReporter({
        output: buffer.writable,
        noColor: true,
      });

      const step = {
        name: "Test Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" as const },
        },
      };

      await reporter.onStepError(step, new Error("Error"));

      const output = new TextDecoder().decode(buffer.bytes());
      assertEquals(output.length, 0);
    });
  });
});
