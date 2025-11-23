/**
 * Tests for BaseReporter abstract class
 *
 * @module
 */

import {
  assertEquals,
  assertExists,
  assertNotEquals,
  assertStringIncludes,
} from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { Buffer } from "@std/streams/buffer";
import { BaseReporter } from "./base_reporter.ts";
import type {
  ScenarioDefinition,
  ScenarioResult,
  StepDefinition,
  StepResult,
} from "./types.ts";

/**
 * Concrete implementation of BaseReporter for testing
 */
class TestReporter extends BaseReporter {
  outputs: string[] = [];

  override async write(text: string): Promise<void> {
    this.outputs.push(text);
    await super.write(text);
  }

  // Test helper method to apply theme formatting
  formatSuccess(text: string): string {
    return this.theme.success(text);
  }

  formatFailure(text: string): string {
    return this.theme.failure(text);
  }

  onScenarioStart(_scenario: ScenarioDefinition): void {
    // no-op
  }

  onScenarioSkip(_scenario: ScenarioDefinition, _reason: string): void {
    // no-op
  }

  onStepStart(_step: StepDefinition): void {
    // no-op
  }

  onStepEnd(_step: StepDefinition, _result: StepResult): void {
    // no-op
  }

  onStepError(_step: StepDefinition, _error: Error): void {
    // no-op
  }

  onScenarioEnd(_scenario: ScenarioDefinition, _result: ScenarioResult): void {
    // no-op
  }
}

describe("BaseReporter", () => {
  describe("initialization", () => {
    it("initializes with default output (Deno.stderr)", () => {
      const reporter = new TestReporter();
      assertExists(reporter);
    });

    it("respects custom output stream", async () => {
      const buffer = new Buffer();
      const reporter = new TestReporter({ output: buffer.writable });

      // Write some text to the custom output stream
      const testText = "custom stream output";
      await reporter.write(testText);

      // Verify the text was written to the custom buffer
      const output = new TextDecoder().decode(buffer.bytes());
      assertStringIncludes(output, testText);
    });

    it("respects noColor option", () => {
      const reporterWithColor = new TestReporter({ noColor: false });
      const reporterNoColor = new TestReporter({ noColor: true });

      const testText = "test";

      // With noColor:false, theme should add ANSI codes
      const coloredSuccess = reporterWithColor.formatSuccess(testText);
      assertNotEquals(
        coloredSuccess,
        testText,
        "noColor:false should add ANSI escape codes for colors",
      );

      // With noColor:true, theme should not modify text
      const plainSuccess = reporterNoColor.formatSuccess(testText);
      assertEquals(
        plainSuccess,
        testText,
        "noColor:true should output plain text without ANSI codes",
      );
    });
  });

  describe("console suppression", () => {
    it("suppresses console in quiet mode", async () => {
      const buffer = new Buffer();
      const reporter = new TestReporter({
        output: buffer.writable,
        verbosity: "quiet",
      });

      // Create stubs to track console calls without output
      const logSpy = stub(console, "log");
      const errorSpy = stub(console, "error");

      try {
        await reporter.onRunStart([]);

        // Call console functions
        console.log("test");
        console.error("error");

        // In quiet mode, they should be suppressed (replaced by no-op functions)
        // The original spied functions won't be called
        assertEquals(logSpy.calls.length, 0);
        assertEquals(errorSpy.calls.length, 0);
      } finally {
        logSpy.restore();
        errorSpy.restore();
        await reporter.onRunEnd({
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0,
          scenarios: [],
        });
      }
    });

    it("suppresses console.log in normal mode", async () => {
      const buffer = new Buffer();

      // Create stubs to track without output
      const logStub = stub(console, "log");
      const errorStub = stub(console, "error");

      try {
        const reporter = new TestReporter({
          output: buffer.writable,
          verbosity: "normal",
        });

        await reporter.onRunStart([]);

        // In normal mode, log should be suppressed but error should not
        console.log("test");
        console.error("error");

        assertEquals(logStub.calls.length, 0, "log should be suppressed");
        assertEquals(
          errorStub.calls.length,
          1,
          "error should not be suppressed",
        );

        await reporter.onRunEnd({
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0,
          scenarios: [],
        });
      } finally {
        logStub.restore();
        errorStub.restore();
      }
    });
  });

  describe("console restoration", () => {
    it("restores console after onRunEnd", async () => {
      const buffer = new Buffer();

      // Create stubs BEFORE creating reporter so reporter saves the stubbed functions
      // Stubs don't produce output, unlike spies
      const logSpy = stub(console, "log");
      const errorSpy = stub(console, "error");
      const warnSpy = stub(console, "warn");
      const infoSpy = stub(console, "info");
      const debugSpy = stub(console, "debug");

      try {
        const reporter = new TestReporter({
          output: buffer.writable,
          verbosity: "quiet",
        });

        // Suppress console
        await reporter.onRunStart([]);

        // During suppression, calls should not reach the spies
        console.log("test");
        console.error("test");
        assertEquals(logSpy.calls.length, 0);
        assertEquals(errorSpy.calls.length, 0);

        // Restore console
        await reporter.onRunEnd({
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0,
          scenarios: [],
        });

        // After restoration, spies should track calls again
        console.log("restored");
        console.error("restored");
        console.warn("restored");
        console.info("restored");
        console.debug("restored");

        assertEquals(logSpy.calls.length, 1);
        assertEquals(errorSpy.calls.length, 1);
        assertEquals(warnSpy.calls.length, 1);
        assertEquals(infoSpy.calls.length, 1);
        assertEquals(debugSpy.calls.length, 1);
      } finally {
        logSpy.restore();
        errorSpy.restore();
        warnSpy.restore();
        infoSpy.restore();
        debugSpy.restore();
      }
    });

    it("restores console for each verbosity level", async () => {
      const verbosityLevels: Array<"quiet" | "normal" | "verbose" | "debug"> = [
        "quiet",
        "normal",
        "verbose",
        "debug",
      ];

      for (const verbosity of verbosityLevels) {
        const buffer = new Buffer();

        // Create stubs for all console methods to prevent output
        const logSpy = stub(console, "log");
        const errorSpy = stub(console, "error");
        const warnSpy = stub(console, "warn");
        const infoSpy = stub(console, "info");
        const debugSpy = stub(console, "debug");

        try {
          const reporter = new TestReporter({
            output: buffer.writable,
            verbosity,
          });

          await reporter.onRunStart([]);

          // Test suppression by calling console methods
          console.log("test");
          console.error("test");
          console.warn("test");
          console.info("test");
          console.debug("test");

          // Verify suppression based on verbosity level
          if (verbosity === "debug") {
            // In debug mode, nothing is suppressed
            assertEquals(
              logSpy.calls.length,
              1,
              "log should not be suppressed in debug mode",
            );
            assertEquals(
              errorSpy.calls.length,
              1,
              "error should not be suppressed in debug mode",
            );
            assertEquals(
              debugSpy.calls.length,
              1,
              "debug should not be suppressed in debug mode",
            );
          } else if (verbosity === "verbose") {
            // In verbose mode, only debug is suppressed
            assertEquals(
              logSpy.calls.length,
              1,
              "log should not be suppressed in verbose mode",
            );
            assertEquals(
              errorSpy.calls.length,
              1,
              "error should not be suppressed in verbose mode",
            );
            assertEquals(
              debugSpy.calls.length,
              0,
              "debug should be suppressed in verbose mode",
            );
          } else if (verbosity === "normal") {
            // In normal mode, log/info/debug are suppressed
            assertEquals(
              logSpy.calls.length,
              0,
              "log should be suppressed in normal mode",
            );
            assertEquals(
              infoSpy.calls.length,
              0,
              "info should be suppressed in normal mode",
            );
            assertEquals(
              debugSpy.calls.length,
              0,
              "debug should be suppressed in normal mode",
            );
            assertEquals(
              errorSpy.calls.length,
              1,
              "error should not be suppressed in normal mode",
            );
            assertEquals(
              warnSpy.calls.length,
              1,
              "warn should not be suppressed in normal mode",
            );
          } else if (verbosity === "quiet") {
            // In quiet mode, everything is suppressed
            assertEquals(
              logSpy.calls.length,
              0,
              "log should be suppressed in quiet mode",
            );
            assertEquals(
              errorSpy.calls.length,
              0,
              "error should be suppressed in quiet mode",
            );
            assertEquals(
              warnSpy.calls.length,
              0,
              "warn should be suppressed in quiet mode",
            );
            assertEquals(
              infoSpy.calls.length,
              0,
              "info should be suppressed in quiet mode",
            );
            assertEquals(
              debugSpy.calls.length,
              0,
              "debug should be suppressed in quiet mode",
            );
          }

          // Reset spy call counts
          logSpy.calls.length = 0;
          errorSpy.calls.length = 0;
          warnSpy.calls.length = 0;
          infoSpy.calls.length = 0;
          debugSpy.calls.length = 0;

          await reporter.onRunEnd({
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            scenarios: [],
          });

          // After onRunEnd, all functions should be restored
          console.log("restored");
          console.error("restored");
          console.warn("restored");
          console.info("restored");
          console.debug("restored");

          assertEquals(
            logSpy.calls.length,
            1,
            `console.log should be restored in ${verbosity} mode`,
          );
          assertEquals(
            errorSpy.calls.length,
            1,
            `console.error should be restored in ${verbosity} mode`,
          );
          assertEquals(
            warnSpy.calls.length,
            1,
            `console.warn should be restored in ${verbosity} mode`,
          );
          assertEquals(
            infoSpy.calls.length,
            1,
            `console.info should be restored in ${verbosity} mode`,
          );
          assertEquals(
            debugSpy.calls.length,
            1,
            `console.debug should be restored in ${verbosity} mode`,
          );
        } finally {
          logSpy.restore();
          errorSpy.restore();
          warnSpy.restore();
          infoSpy.restore();
          debugSpy.restore();
        }
      }
    });

    it("console functions work after restoration", async () => {
      const buffer = new Buffer();

      // Create stubs to track console calls without output
      const logSpy = stub(console, "log");
      const errorSpy = stub(console, "error");

      try {
        // Reporter will save the spied functions as "original"
        const reporter = new TestReporter({
          output: buffer.writable,
          verbosity: "quiet",
        });

        await reporter.onRunStart([]);

        // During suppression, console calls should not reach the spy
        console.log("test during suppression");
        console.error("test during suppression");
        assertEquals(
          logSpy.calls.length,
          0,
          "console.log should be suppressed",
        );
        assertEquals(
          errorSpy.calls.length,
          0,
          "console.error should be suppressed",
        );

        await reporter.onRunEnd({
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0,
          scenarios: [],
        });

        // After restoration, the spies should track calls again
        console.log("test after restoration");
        console.error("test after restoration");

        assertEquals(
          logSpy.calls.length,
          1,
          "console.log should be callable after restoration",
        );
        assertEquals(
          errorSpy.calls.length,
          1,
          "console.error should be callable after restoration",
        );
        assertEquals(logSpy.calls[0].args[0], "test after restoration");
        assertEquals(errorSpy.calls[0].args[0], "test after restoration");
      } finally {
        logSpy.restore();
        errorSpy.restore();
      }
    });
  });

  describe("output stream", () => {
    it("writes to output stream", async () => {
      const buffer = new Buffer();
      const reporter = new TestReporter({ output: buffer.writable });

      const testText = "test output";
      await reporter.write(testText);

      const output = new TextDecoder().decode(buffer.bytes());
      assertStringIncludes(output, testText);
    });

    it("handles multiple writes", async () => {
      const buffer = new Buffer();
      const reporter = new TestReporter({ output: buffer.writable });

      await reporter.write("first");
      await reporter.write("second");
      await reporter.write("third");

      const output = new TextDecoder().decode(buffer.bytes());
      assertStringIncludes(output, "first");
      assertStringIncludes(output, "second");
      assertStringIncludes(output, "third");
    });
  });
});
