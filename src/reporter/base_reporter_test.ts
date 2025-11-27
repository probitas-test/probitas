/**
 * Tests for BaseReporter abstract class
 *
 * @module
 */

import {
  assertEquals,
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

class TestReporter extends BaseReporter {
  outputs: string[] = [];

  override async write(text: string): Promise<void> {
    this.outputs.push(text);
    await super.write(text);
  }

  formatSuccess(text: string): string {
    return this.theme.success(text);
  }

  formatFailure(text: string): string {
    return this.theme.failure(text);
  }

  onScenarioStart(_scenario: ScenarioDefinition): void {}
  onScenarioSkip(_scenario: ScenarioDefinition, _reason: string): void {}
  onStepStart(_step: StepDefinition): void {}
  onStepEnd(_step: StepDefinition, _result: StepResult): void {}
  onStepError(_step: StepDefinition, _error: Error): void {}
  onScenarioEnd(_scenario: ScenarioDefinition, _result: ScenarioResult): void {}
}

describe("BaseReporter", () => {
  describe("initialization", () => {
    it("respects custom output stream", async () => {
      const buffer = new Buffer();
      const reporter = new TestReporter({ output: buffer.writable });

      const testText = "custom stream output";
      await reporter.write(testText);

      const output = new TextDecoder().decode(buffer.bytes());
      assertStringIncludes(output, testText);
    });

    it("respects noColor option", () => {
      const reporterWithColor = new TestReporter({ noColor: false });
      const reporterNoColor = new TestReporter({ noColor: true });

      const testText = "test";

      const coloredSuccess = reporterWithColor.formatSuccess(testText);
      assertNotEquals(coloredSuccess, testText);

      const plainSuccess = reporterNoColor.formatSuccess(testText);
      assertEquals(plainSuccess, testText);
    });
  });

  describe("console suppression and restoration", () => {
    it("suppresses and restores console based on verbosity", async () => {
      const buffer = new Buffer();

      using logSpy = stub(console, "log");
      using errorSpy = stub(console, "error");

      const reporter = new TestReporter({
        output: buffer.writable,
        verbosity: "quiet",
      });

      await reporter.onRunStart([]);

      console.log("test");
      console.error("test");
      assertEquals(logSpy.calls.length, 0);
      assertEquals(errorSpy.calls.length, 0);

      await reporter.onRunEnd({
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        scenarios: [],
      });

      console.log("restored");
      console.error("restored");

      assertEquals(logSpy.calls.length, 1);
      assertEquals(errorSpy.calls.length, 1);
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
