/**
 * Test utilities and fixtures for reporter testing
 *
 * Provides common test data covering various scenarios, steps, and results
 * that reporters need to handle.
 *
 * @module
 */

import { assertSnapshot } from "@std/testing/snapshot";
import { Buffer } from "@std/streams/buffer";
import type {
  ScenarioDefinition,
  ScenarioOptions,
  StepDefinition,
  StepOptions,
} from "@probitas/core";
import type { Origin } from "@probitas/core/origin";
import type {
  Reporter,
  RunResult,
  ScenarioResult,
  StepResult,
} from "@probitas/runner";
import type { ReporterOptions } from "./types.ts";
import { colorTheme, noColorTheme } from "@probitas/core/theme";

// Origin locations for testing
export const originLocations = {
  scenario1: { path: "test.scenario.ts", line: 10 },
  scenario2: { path: "test.scenario.ts", line: 50 },
  step1: { path: "test.scenario.ts", line: 15 },
  step2: { path: "test.scenario.ts", line: 20 },
  step3: { path: "test.scenario.ts", line: 25 },
} as const satisfies Record<string, Origin>;

// Default step options for testing
const defaultStepOptions: StepOptions = {
  timeout: 5000,
  retry: { maxAttempts: 1, backoff: "linear" as const },
};

// Scenario options variants
export const scenarioOptions = {
  default: {
    tags: [],
    stepOptions: defaultStepOptions,
  },

  withTags: {
    tags: ["@smoke", "@api"],
    stepOptions: defaultStepOptions,
  },
} as const satisfies Record<string, ScenarioOptions>;

// Step definitions
export const stepDefinitions = {
  passing: {
    kind: "step",
    name: "Step that passes",
    origin: originLocations.step1,
    fn: () => {
      return Promise.resolve();
    },
    timeout: 5000,
    retry: { maxAttempts: 1, backoff: "linear" as const },
  },

  failing: {
    kind: "step",
    name: "Step that fails",
    origin: originLocations.step2,
    fn: () => {
      throw new Error("Step failed");
    },
    timeout: 5000,
    retry: { maxAttempts: 1, backoff: "linear" as const },
  },

  slow: {
    kind: "step",
    name: "Slow step",
    origin: originLocations.step3,
    fn: async () => {
      // Intentionally empty - just simulates a step that could be slow
    },
    timeout: 5000,
    retry: { maxAttempts: 1, backoff: "linear" as const },
  },
} as const satisfies Record<string, StepDefinition>;

// Step results
export const stepResults = {
  passed: {
    metadata: {
      kind: "step",
      name: "Step that passes",
      timeout: 5000,
      retry: { maxAttempts: 1, backoff: "linear" as const },
      origin: originLocations.step1,
    },
    status: "passed" as const,
    duration: 10,
    value: undefined,
  },

  passedWithOutput: {
    metadata: {
      kind: "step",
      name: "Step that passes",
      timeout: 5000,
      retry: { maxAttempts: 1, backoff: "linear" as const },
      origin: originLocations.step1,
    },
    status: "passed" as const,
    duration: 15,
    value: { key: "value" },
  },

  failed: {
    metadata: {
      kind: "step",
      name: "Step that fails",
      timeout: 5000,
      retry: { maxAttempts: 1, backoff: "linear" as const },
      origin: originLocations.step2,
    },
    status: "failed" as const,
    duration: 5,
    error: new Error("Assertion failed"),
  },

  skipped: {
    metadata: {
      kind: "step",
      name: "Step that is skipped",
      timeout: 5000,
      retry: { maxAttempts: 1, backoff: "linear" as const },
      origin: originLocations.step3,
    },
    status: "skipped" as const,
    duration: 0,
    error: "This step was skipped due to prerequisite failure",
  },

  failedWithMultilineError: {
    metadata: {
      kind: "step",
      name: "Step with multiline error",
      timeout: 5000,
      retry: { maxAttempts: 1, backoff: "linear" as const },
      origin: originLocations.step2,
    },
    status: "failed" as const,
    duration: 5,
    error: new Error(
      "First line of error\nSecond line of error\nThird line of error",
    ),
  },

  skippedWithMultilineError: {
    metadata: {
      kind: "step",
      name: "Step skipped with multiline reason",
      timeout: 5000,
      retry: { maxAttempts: 1, backoff: "linear" as const },
      origin: originLocations.step3,
    },
    status: "skipped" as const,
    duration: 0,
    error: "Skipped due to:\nCondition A not met\nCondition B not met",
  },
} as const satisfies Record<string, StepResult>;

// Scenario definitions
export const scenarioDefinitions = {
  simple: {
    name: "Simple passing scenario",
    tags: [],
    origin: originLocations.scenario1,
    steps: [stepDefinitions.passing],
  },

  withMultipleSteps: {
    name: "Scenario with multiple steps",
    tags: [],
    origin: originLocations.scenario1,
    steps: [
      stepDefinitions.passing,
      stepDefinitions.passing,
      stepDefinitions.passing,
    ],
  },

  withFailingStep: {
    name: "Scenario with failing step",
    tags: [],
    origin: originLocations.scenario1,
    steps: [
      stepDefinitions.passing,
      stepDefinitions.failing,
    ],
  },

  withTags: {
    name: "Tagged scenario",
    tags: ["@smoke", "@api"],
    origin: originLocations.scenario2,
    steps: [stepDefinitions.passing],
  },
} as const satisfies Record<string, ScenarioDefinition>;

// Scenario results
export const scenarioResults = {
  passed: {
    metadata: {
      name: "Simple passing scenario",
      origin: originLocations.scenario1,
      tags: [],
      steps: [
        {
          kind: "step" as const,
          name: "Step that passes",
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" as const },
          origin: originLocations.step1,
        },
      ],
    },
    status: "passed" as const,
    duration: 10,
    steps: [stepResults.passed],
  },

  passedMultipleSteps: {
    metadata: {
      name: "Scenario with multiple steps",
      origin: originLocations.scenario1,
      tags: [],
      steps: [
        {
          kind: "step" as const,
          name: "Step that passes",
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" as const },
          origin: originLocations.step1,
        },
        {
          kind: "step" as const,
          name: "Step that passes",
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" as const },
          origin: originLocations.step1,
        },
        {
          kind: "step" as const,
          name: "Step that passes",
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" as const },
          origin: originLocations.step1,
        },
      ],
    },
    status: "passed" as const,
    duration: 30,
    steps: [stepResults.passed, stepResults.passed, stepResults.passed],
  },

  failed: {
    metadata: {
      name: "Scenario with failing step",
      origin: originLocations.scenario1,
      tags: [],
      steps: [
        {
          kind: "step" as const,
          name: "Step that passes",
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" as const },
          origin: originLocations.step1,
        },
        {
          kind: "step" as const,
          name: "Step that fails",
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" as const },
          origin: originLocations.step2,
        },
      ],
    },
    status: "failed" as const,
    duration: 15,
    steps: [stepResults.passed, stepResults.failed],
    error: new Error("Scenario failed"),
  },

  withTags: {
    metadata: {
      name: "Tagged scenario",
      origin: originLocations.scenario2,
      tags: ["@smoke", "@api"],
      steps: [
        {
          kind: "step",
          name: "Step that passes",
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" as const },
          origin: originLocations.step1,
        },
      ],
    },
    status: "passed" as const,
    duration: 10,
    steps: [stepResults.passed],
  },
} as const satisfies Record<string, ScenarioResult>;

// Run summaries
export const runSummaries = {
  allPassed: {
    total: 3,
    passed: 3,
    failed: 0,
    skipped: 0,
    duration: 45,
    scenarios: [
      scenarioResults.passed,
      scenarioResults.passed,
      scenarioResults.passed,
    ],
  },

  withFailures: {
    total: 3,
    passed: 2,
    failed: 1,
    skipped: 0,
    duration: 35,
    scenarios: [
      scenarioResults.passed,
      scenarioResults.failed,
      scenarioResults.passed,
    ],
  },

  empty: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    scenarios: [],
  },
} as const satisfies Record<string, RunResult>;

/**
 * Normalize file paths in stack traces for snapshot testing
 *
 * Replaces absolute file:// URLs with a placeholder to ensure snapshots
 * are portable across different machines and CI environments.
 */
function normalizeStackPaths(output: string): string {
  // Replace file:// URLs with <file> placeholder
  // Matches patterns like: file:///Users/name/project/src/file.ts:123:45
  // Also matches patterns like: file:///home/runner/work/project/src/file.ts:123:45
  return output.replace(
    /file:\/\/\/[^\s:)]+/g,
    "<file>",
  );
}

/**
 * Helper function to extract text output from Buffer, removing ANSI color codes
 */
function getBufferOutputNoColor(buffer: Buffer): string {
  const output = new TextDecoder().decode(buffer.bytes());
  // deno-lint-ignore no-control-regex
  const noColor = output.replace(/\x1b\[[0-9;]*m/g, "");
  return normalizeStackPaths(noColor);
}

/**
 * Helper function to extract raw text output from Buffer preserving ANSI color codes
 */
function getRawBufferOutput(buffer: Buffer): string {
  const output = new TextDecoder().decode(buffer.bytes());
  return normalizeStackPaths(output);
}

/**
 * Test helper function for Reporter implementations
 *
 * Automatically runs comprehensive tests for a Reporter class using complete
 * Reporter lifecycle sequences:
 * - Complete run with all scenarios passed
 * - Complete run with failures
 * - Empty run (no scenarios)
 *
 * Uses snapshot testing with assertSnapshot for output verification of the
 * complete output generated throughout the entire lifecycle.
 *
 * @param ReporterClass The Reporter class constructor
 * @param reporterName The name of the reporter (used for snapshot identification), defaults to ReporterClass.name
 *
 * @example
 * ```ts
 * import { ListReporter } from "@probitas/reporter";
 * import { testReporter } from "./testkit.ts";
 *
 * // Call testReporter in a test file to run snapshot tests
 * // testReporter(ListReporter);
 * void testReporter;
 * void ListReporter;
 * ```
 */
export function testReporter(
  ReporterClass: new (options?: ReporterOptions) => Reporter,
  reporterName?: string,
): void {
  const name = reporterName ?? ReporterClass.name;
  Deno.test(name, async (t) => {
    await t.step("with colors", async (t) => {
      await t.step("complete run with all scenarios passed", async (t) => {
        const buffer = new Buffer();
        const reporter = new ReporterClass({
          output: buffer.writable,
          theme: colorTheme,
        });

        const summary = runSummaries.allPassed;
        const scenarios = [
          scenarioDefinitions.simple,
          scenarioDefinitions.simple,
          scenarioDefinitions.simple,
        ];

        await reporter.onRunStart?.(scenarios);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onRunStart",
        });

        // First scenario
        await reporter.onScenarioStart?.(scenarios[0]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioStart - Simple passing scenario (1)",
        });

        await reporter.onStepStart?.(scenarios[0], stepDefinitions.passing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that passes (1)",
        });

        await reporter.onStepEnd?.(
          scenarios[0],
          stepDefinitions.passing,
          stepResults.passed,
        );
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepEnd - Step that passes (1)",
        });

        await reporter.onScenarioEnd?.(scenarios[0], summary.scenarios[0]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (1)",
        });

        // Second scenario
        await reporter.onScenarioStart?.(scenarios[1]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioStart - Simple passing scenario (2)",
        });

        await reporter.onStepStart?.(scenarios[1], stepDefinitions.passing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that passes (2)",
        });

        await reporter.onStepEnd?.(
          scenarios[1],
          stepDefinitions.passing,
          stepResults.passed,
        );
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepEnd - Step that passes (2)",
        });

        await reporter.onScenarioEnd?.(scenarios[1], summary.scenarios[1]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (2)",
        });

        // Third scenario
        await reporter.onScenarioStart?.(scenarios[2]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioStart - Simple passing scenario (3)",
        });

        await reporter.onStepStart?.(scenarios[2], stepDefinitions.passing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that passes (3)",
        });

        await reporter.onStepEnd?.(
          scenarios[2],
          stepDefinitions.passing,
          stepResults.passed,
        );
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepEnd - Step that passes (3)",
        });

        await reporter.onScenarioEnd?.(scenarios[2], summary.scenarios[2]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (3)",
        });

        await reporter.onRunEnd?.(scenarios, summary);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onRunEnd",
        });
      });

      await t.step("complete run with failures", async (t) => {
        const buffer = new Buffer();
        const reporter = new ReporterClass({
          output: buffer.writable,
          theme: colorTheme,
        });

        const summary = runSummaries.withFailures;
        const scenarios = [
          scenarioDefinitions.simple,
          scenarioDefinitions.withFailingStep,
          scenarioDefinitions.simple,
        ];

        await reporter.onRunStart?.(scenarios);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onRunStart",
        });

        // First scenario - passed
        await reporter.onScenarioStart?.(scenarios[0]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioStart - Simple passing scenario (1)",
        });

        await reporter.onStepStart?.(scenarios[0], stepDefinitions.passing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that passes (1)",
        });

        await reporter.onStepEnd?.(
          scenarios[0],
          stepDefinitions.passing,
          stepResults.passed,
        );
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepEnd - Step that passes (1)",
        });

        await reporter.onScenarioEnd?.(scenarios[0], summary.scenarios[0]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (1)",
        });

        // Second scenario - failed
        await reporter.onScenarioStart?.(scenarios[1]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioStart - Scenario with failing step (2)",
        });

        await reporter.onStepStart?.(scenarios[1], stepDefinitions.passing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that passes (2-1)",
        });

        await reporter.onStepEnd?.(
          scenarios[1],
          stepDefinitions.passing,
          stepResults.passed,
        );
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepEnd - Step that passes (2-1)",
        });

        await reporter.onStepStart?.(scenarios[1], stepDefinitions.failing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that fails (2-2)",
        });

        await reporter.onStepEnd?.(
          scenarios[1],
          stepDefinitions.failing,
          stepResults.failed,
        );
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepEnd - Step that fails (2-2)",
        });

        await reporter.onScenarioEnd?.(scenarios[1], summary.scenarios[1]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioEnd - Scenario with failing step (2)",
        });

        // Third scenario - passed
        await reporter.onScenarioStart?.(scenarios[2]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioStart - Simple passing scenario (3)",
        });

        await reporter.onStepStart?.(scenarios[2], stepDefinitions.passing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that passes (3)",
        });

        await reporter.onStepEnd?.(
          scenarios[2],
          stepDefinitions.passing,
          stepResults.passed,
        );
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepEnd - Step that passes (3)",
        });

        await reporter.onScenarioEnd?.(scenarios[2], summary.scenarios[2]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (3)",
        });

        await reporter.onRunEnd?.(scenarios, summary);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onRunEnd",
        });
      });

      await t.step("empty run with no scenarios", async (t) => {
        const buffer = new Buffer();
        const reporter = new ReporterClass({
          output: buffer.writable,
        });

        const summary = runSummaries.empty;
        const scenarios: ScenarioDefinition[] = [];

        await reporter.onRunStart?.(scenarios);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onRunStart",
        });

        await reporter.onRunEnd?.(scenarios, summary);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onRunEnd",
        });
      });
    });

    await t.step("without colors", async (t) => {
      await t.step("complete run with all scenarios passed", async (t) => {
        const buffer = new Buffer();
        const reporter = new ReporterClass({
          output: buffer.writable,
          theme: noColorTheme,
        });

        const summary = runSummaries.allPassed;
        const scenarios = [
          scenarioDefinitions.simple,
          scenarioDefinitions.simple,
          scenarioDefinitions.simple,
        ];

        await reporter.onRunStart?.(scenarios);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onRunStart",
        });

        // First scenario
        await reporter.onScenarioStart?.(scenarios[0]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioStart - Simple passing scenario (1)",
        });

        await reporter.onStepStart?.(scenarios[0], stepDefinitions.passing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that passes (1)",
        });

        await reporter.onStepEnd?.(
          scenarios[0],
          stepDefinitions.passing,
          stepResults.passed,
        );
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepEnd - Step that passes (1)",
        });

        await reporter.onScenarioEnd?.(scenarios[0], summary.scenarios[0]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (1)",
        });

        // Second scenario
        await reporter.onScenarioStart?.(scenarios[1]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioStart - Simple passing scenario (2)",
        });

        await reporter.onStepStart?.(scenarios[1], stepDefinitions.passing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that passes (2)",
        });

        await reporter.onStepEnd?.(
          scenarios[1],
          stepDefinitions.passing,
          stepResults.passed,
        );
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepEnd - Step that passes (2)",
        });

        await reporter.onScenarioEnd?.(scenarios[1], summary.scenarios[1]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (2)",
        });

        // Third scenario
        await reporter.onScenarioStart?.(scenarios[2]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioStart - Simple passing scenario (3)",
        });

        await reporter.onStepStart?.(scenarios[2], stepDefinitions.passing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that passes (3)",
        });

        await reporter.onStepEnd?.(
          scenarios[2],
          stepDefinitions.passing,
          stepResults.passed,
        );
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepEnd - Step that passes (3)",
        });

        await reporter.onScenarioEnd?.(scenarios[2], summary.scenarios[2]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (3)",
        });

        await reporter.onRunEnd?.(scenarios, summary);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onRunEnd",
        });
      });

      await t.step("complete run with failures", async (t) => {
        const buffer = new Buffer();
        const reporter = new ReporterClass({
          output: buffer.writable,
          theme: noColorTheme,
        });

        const summary = runSummaries.withFailures;
        const scenarios = [
          scenarioDefinitions.simple,
          scenarioDefinitions.withFailingStep,
          scenarioDefinitions.simple,
        ];

        await reporter.onRunStart?.(scenarios);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onRunStart",
        });

        // First scenario - passed
        await reporter.onScenarioStart?.(scenarios[0]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioStart - Simple passing scenario (1)",
        });

        await reporter.onStepStart?.(scenarios[0], stepDefinitions.passing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that passes (1)",
        });

        await reporter.onStepEnd?.(
          scenarios[0],
          stepDefinitions.passing,
          stepResults.passed,
        );
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepEnd - Step that passes (1)",
        });

        await reporter.onScenarioEnd?.(scenarios[0], summary.scenarios[0]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (1)",
        });

        // Second scenario - failed
        await reporter.onScenarioStart?.(scenarios[1]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioStart - Scenario with failing step (2)",
        });

        await reporter.onStepStart?.(scenarios[1], stepDefinitions.passing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that passes (2-1)",
        });

        await reporter.onStepEnd?.(
          scenarios[1],
          stepDefinitions.passing,
          stepResults.passed,
        );
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepEnd - Step that passes (2-1)",
        });

        await reporter.onStepStart?.(scenarios[1], stepDefinitions.failing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that fails (2-2)",
        });

        await reporter.onStepEnd?.(
          scenarios[1],
          stepDefinitions.failing,
          stepResults.failed,
        );
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepEnd - Step that fails (2-2)",
        });

        await reporter.onScenarioEnd?.(scenarios[1], summary.scenarios[1]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioEnd - Scenario with failing step (2)",
        });

        // Third scenario - passed
        await reporter.onScenarioStart?.(scenarios[2]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioStart - Simple passing scenario (3)",
        });

        await reporter.onStepStart?.(scenarios[2], stepDefinitions.passing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that passes (3)",
        });

        await reporter.onStepEnd?.(
          scenarios[2],
          stepDefinitions.passing,
          stepResults.passed,
        );
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepEnd - Step that passes (3)",
        });

        await reporter.onScenarioEnd?.(scenarios[2], summary.scenarios[2]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (3)",
        });

        await reporter.onRunEnd?.(scenarios, summary);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onRunEnd",
        });
      });

      await t.step("empty run with no scenarios", async (t) => {
        const buffer = new Buffer();
        const reporter = new ReporterClass({
          output: buffer.writable,
          theme: noColorTheme,
        });

        const summary = runSummaries.empty;
        const scenarios: ScenarioDefinition[] = [];

        await reporter.onRunStart?.(scenarios);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onRunStart",
        });

        await reporter.onRunEnd?.(scenarios, summary);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onRunEnd",
        });
      });
    });
  });
}
