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
import { Buffer } from "@std/streams/buffer";
import { BaseReporter } from "./base_reporter.ts";
import type { ScenarioDefinition, StepDefinition } from "@probitas/scenario";
import type { ScenarioResult, StepResult } from "@probitas/runner";

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
  onStepStart(_step: StepDefinition, _scenario: ScenarioDefinition): void {}
  onStepEnd(
    _step: StepDefinition,
    _result: StepResult,
    _scenario: ScenarioDefinition,
  ): void {}
  onStepError(
    _step: StepDefinition,
    _error: Error,
    _scenario: ScenarioDefinition,
  ): void {}
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
