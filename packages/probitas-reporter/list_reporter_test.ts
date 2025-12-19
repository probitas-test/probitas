/**
 * Tests for ListReporter
 *
 * Uses the testReporter helper function to verify reporter output with various
 * scenario results and run summaries, both with and without color output.
 *
 * @requires --allow-read Permission to read snapshot files
 * @requires --allow-write Permission to write snapshot files during updates
 * @module
 */

import { assertSnapshot } from "@std/testing/snapshot";
import { Buffer } from "@std/streams/buffer";
import { ListReporter } from "./list_reporter.ts";
import {
  originLocations,
  scenarioDefinitions,
  stepResults,
  testReporter,
} from "./testkit.ts";
import { colorTheme, noColorTheme } from "@probitas/core/theme";
import type { StepDefinition } from "@probitas/core";

testReporter(ListReporter);

const stepWithMultilineError: StepDefinition = {
  kind: "step",
  name: "Step with multiline error",
  origin: originLocations.step2,
  fn: () => {
    throw new Error(
      "First line of error\nSecond line of error\nThird line of error",
    );
  },
  timeout: 5000,
  retry: { maxAttempts: 1, backoff: "linear" },
};

const stepSkippedWithMultilineReason: StepDefinition = {
  kind: "step",
  name: "Step skipped with multiline reason",
  origin: originLocations.step3,
  fn: () => Promise.resolve(),
  timeout: 5000,
  retry: { maxAttempts: 1, backoff: "linear" },
};

Deno.test("ListReporter - multiline error messages with colors shows only first line of multiline error in onStepEnd", async (t) => {
  const buffer = new Buffer();
  const reporter = new ListReporter({
    output: buffer.writable,
    theme: colorTheme,
  });

  await reporter.onStepEnd?.(
    scenarioDefinitions.simple,
    stepWithMultilineError,
    stepResults.failedWithMultilineError,
  );

  const output = new TextDecoder().decode(buffer.bytes());
  await assertSnapshot(t, output);
});

Deno.test("ListReporter - multiline error messages with colors shows only first line of multiline skip reason in onStepEnd", async (t) => {
  const buffer = new Buffer();
  const reporter = new ListReporter({
    output: buffer.writable,
    theme: colorTheme,
  });

  await reporter.onStepEnd?.(
    scenarioDefinitions.simple,
    stepSkippedWithMultilineReason,
    stepResults.skippedWithMultilineError,
  );

  const output = new TextDecoder().decode(buffer.bytes());
  await assertSnapshot(t, output);
});

Deno.test("ListReporter - multiline error messages without colors shows only first line of multiline error in onStepEnd", async (t) => {
  const buffer = new Buffer();
  const reporter = new ListReporter({
    output: buffer.writable,
    theme: noColorTheme,
  });

  await reporter.onStepEnd?.(
    scenarioDefinitions.simple,
    stepWithMultilineError,
    stepResults.failedWithMultilineError,
  );

  const output = new TextDecoder().decode(buffer.bytes());
  // Remove ANSI color codes for consistent snapshot comparison
  // deno-lint-ignore no-control-regex
  const noColor = output.replace(/\x1b\[[0-9;]*m/g, "");
  await assertSnapshot(t, noColor);
});

Deno.test("ListReporter - multiline error messages without colors shows only first line of multiline skip reason in onStepEnd", async (t) => {
  const buffer = new Buffer();
  const reporter = new ListReporter({
    output: buffer.writable,
    theme: noColorTheme,
  });

  await reporter.onStepEnd?.(
    scenarioDefinitions.simple,
    stepSkippedWithMultilineReason,
    stepResults.skippedWithMultilineError,
  );

  const output = new TextDecoder().decode(buffer.bytes());
  // Remove ANSI color codes for consistent snapshot comparison
  // deno-lint-ignore no-control-regex
  const noColor = output.replace(/\x1b\[[0-9;]*m/g, "");
  await assertSnapshot(t, noColor);
});
