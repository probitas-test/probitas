/**
 * Test utilities and fixtures for reporter testing
 *
 * Provides common test data covering various scenarios, steps, and results
 * that reporters need to handle.
 *
 * @module
 */

import { describe, it } from "@std/testing/bdd";
import { assertSnapshot } from "@std/testing/snapshot";
import { Buffer } from "@std/streams/buffer";
import type {
  ScenarioOptions,
  SourceLocation,
  StepOptions,
} from "@probitas/runner";
import type {
  Reporter,
  ReporterOptions,
  RunSummary,
  ScenarioDefinition,
  ScenarioResult,
  StepDefinition,
  StepResult,
} from "./types.ts";

// Source locations for testing
export const sourceLocations = {
  scenario1: { file: "test.scenario.ts", line: 10 },
  scenario2: { file: "test.scenario.ts", line: 50 },
  step1: { file: "test.scenario.ts", line: 15 },
  step2: { file: "test.scenario.ts", line: 20 },
  step3: { file: "test.scenario.ts", line: 25 },
} as const satisfies Record<string, SourceLocation>;

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
    name: "Step that passes",
    location: sourceLocations.step1,
    fn: () => {
      return Promise.resolve();
    },
    options: defaultStepOptions,
  },

  failing: {
    name: "Step that fails",
    location: sourceLocations.step2,
    fn: () => {
      throw new Error("Step failed");
    },
    options: defaultStepOptions,
  },

  slow: {
    name: "Slow step",
    location: sourceLocations.step3,
    fn: async () => {
      // Intentionally empty - just simulates a step that could be slow
    },
    options: defaultStepOptions,
  },
} as const satisfies Record<string, StepDefinition>;

// Step results
export const stepResults = {
  passed: {
    metadata: {
      name: "Step that passes",
      options: defaultStepOptions,
      location: sourceLocations.step1,
    },
    status: "passed" as const,
    duration: 10,
    value: undefined,
  },

  passedWithOutput: {
    metadata: {
      name: "Step that passes",
      options: defaultStepOptions,
      location: sourceLocations.step1,
    },
    status: "passed" as const,
    duration: 15,
    value: { key: "value" },
  },

  failed: {
    metadata: {
      name: "Step that fails",
      options: defaultStepOptions,
      location: sourceLocations.step2,
    },
    status: "failed" as const,
    duration: 5,
    error: new Error("Assertion failed"),
  },
} as const satisfies Record<string, StepResult>;

// Scenario definitions
export const scenarioDefinitions = {
  simple: {
    name: "Simple passing scenario",
    options: scenarioOptions.default,
    location: sourceLocations.scenario1,
    entries: [{ kind: "step" as const, value: stepDefinitions.passing }],
  },

  withMultipleSteps: {
    name: "Scenario with multiple steps",
    options: scenarioOptions.default,
    location: sourceLocations.scenario1,
    entries: [
      { kind: "step" as const, value: stepDefinitions.passing },
      { kind: "step" as const, value: stepDefinitions.passing },
      { kind: "step" as const, value: stepDefinitions.passing },
    ],
  },

  withFailingStep: {
    name: "Scenario with failing step",
    options: scenarioOptions.default,
    location: sourceLocations.scenario1,
    entries: [
      { kind: "step" as const, value: stepDefinitions.passing },
      { kind: "step" as const, value: stepDefinitions.failing },
    ],
  },

  withTags: {
    name: "Tagged scenario",
    options: scenarioOptions.withTags,
    location: sourceLocations.scenario2,
    entries: [{ kind: "step" as const, value: stepDefinitions.passing }],
  },
} as const satisfies Record<string, ScenarioDefinition>;

// Scenario results
export const scenarioResults = {
  passed: {
    metadata: {
      name: "Simple passing scenario",
      location: sourceLocations.scenario1,
      options: {
        tags: [],
        stepOptions: defaultStepOptions,
      },
      entries: [
        {
          kind: "step" as const,
          value: {
            name: "Step that passes",
            options: defaultStepOptions,
            location: sourceLocations.step1,
          },
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
      location: sourceLocations.scenario1,
      options: {
        tags: [],
        stepOptions: defaultStepOptions,
      },
      entries: [
        {
          kind: "step" as const,
          value: {
            name: "Step that passes",
            options: defaultStepOptions,
            location: sourceLocations.step1,
          },
        },
        {
          kind: "step" as const,
          value: {
            name: "Step that passes",
            options: defaultStepOptions,
            location: sourceLocations.step1,
          },
        },
        {
          kind: "step" as const,
          value: {
            name: "Step that passes",
            options: defaultStepOptions,
            location: sourceLocations.step1,
          },
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
      location: sourceLocations.scenario1,
      options: {
        tags: [],
        stepOptions: defaultStepOptions,
      },
      entries: [
        {
          kind: "step" as const,
          value: {
            name: "Step that passes",
            options: defaultStepOptions,
            location: sourceLocations.step1,
          },
        },
        {
          kind: "step" as const,
          value: {
            name: "Step that fails",
            options: defaultStepOptions,
            location: sourceLocations.step2,
          },
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
      location: sourceLocations.scenario2,
      options: {
        tags: ["@smoke", "@api"],
        stepOptions: defaultStepOptions,
      },
      entries: [
        {
          kind: "step" as const,
          value: {
            name: "Step that passes",
            options: defaultStepOptions,
            location: sourceLocations.step1,
          },
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
    duration: 0,
    scenarios: [],
  },
} as const satisfies Record<string, RunSummary>;

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
 * - Both with and without color output (noColor: true and false)
 *
 * Uses snapshot testing with assertSnapshot for output verification of the
 * complete output generated throughout the entire lifecycle.
 *
 * @param ReporterClass The Reporter class constructor
 * @param reporterName The name of the reporter (used for snapshot identification), defaults to ReporterClass.name
 *
 * @example
 * ```typescript
 * testReporter(DotReporter);
 * ```
 */
export function testReporter(
  ReporterClass: new (options?: ReporterOptions) => Reporter,
  reporterName?: string,
): void {
  const name = reporterName ?? ReporterClass.name;
  describe(name, () => {
    describe("with colors (noColor: false)", () => {
      it("complete run with all scenarios passed", async (t) => {
        const buffer = new Buffer();
        const reporter = new ReporterClass({
          output: buffer.writable,
          noColor: false,
        });

        const summary = runSummaries.allPassed;
        const scenarios = [
          scenarioDefinitions.simple,
          scenarioDefinitions.simple,
          scenarioDefinitions.simple,
        ];

        await reporter.onRunStart(scenarios);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onRunStart",
        });

        // First scenario
        await reporter.onScenarioStart(scenarios[0]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioStart - Simple passing scenario (1)",
        });

        await reporter.onStepStart(stepDefinitions.passing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that passes (1)",
        });

        await reporter.onStepEnd(stepDefinitions.passing, stepResults.passed);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepEnd - Step that passes (1)",
        });

        await reporter.onScenarioEnd(scenarios[0], summary.scenarios[0]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (1)",
        });

        // Second scenario
        await reporter.onScenarioStart(scenarios[1]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioStart - Simple passing scenario (2)",
        });

        await reporter.onStepStart(stepDefinitions.passing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that passes (2)",
        });

        await reporter.onStepEnd(stepDefinitions.passing, stepResults.passed);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepEnd - Step that passes (2)",
        });

        await reporter.onScenarioEnd(scenarios[1], summary.scenarios[1]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (2)",
        });

        // Third scenario
        await reporter.onScenarioStart(scenarios[2]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioStart - Simple passing scenario (3)",
        });

        await reporter.onStepStart(stepDefinitions.passing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that passes (3)",
        });

        await reporter.onStepEnd(stepDefinitions.passing, stepResults.passed);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepEnd - Step that passes (3)",
        });

        await reporter.onScenarioEnd(scenarios[2], summary.scenarios[2]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (3)",
        });

        await reporter.onRunEnd(summary);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onRunEnd",
        });
      });

      it("complete run with failures", async (t) => {
        const buffer = new Buffer();
        const reporter = new ReporterClass({
          output: buffer.writable,
          noColor: false,
        });

        const summary = runSummaries.withFailures;
        const scenarios = [
          scenarioDefinitions.simple,
          scenarioDefinitions.withFailingStep,
          scenarioDefinitions.simple,
        ];

        await reporter.onRunStart(scenarios);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onRunStart",
        });

        // First scenario - passed
        await reporter.onScenarioStart(scenarios[0]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioStart - Simple passing scenario (1)",
        });

        await reporter.onStepStart(stepDefinitions.passing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that passes (1)",
        });

        await reporter.onStepEnd(stepDefinitions.passing, stepResults.passed);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepEnd - Step that passes (1)",
        });

        await reporter.onScenarioEnd(scenarios[0], summary.scenarios[0]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (1)",
        });

        // Second scenario - failed
        await reporter.onScenarioStart(scenarios[1]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioStart - Scenario with failing step (2)",
        });

        await reporter.onStepStart(stepDefinitions.passing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that passes (2-1)",
        });

        await reporter.onStepEnd(stepDefinitions.passing, stepResults.passed);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepEnd - Step that passes (2-1)",
        });

        await reporter.onStepStart(stepDefinitions.failing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that fails (2-2)",
        });

        await reporter.onStepError(
          stepDefinitions.failing,
          new Error("Assertion failed"),
        );
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepError - Step that fails (2-2)",
        });

        await reporter.onScenarioEnd(scenarios[1], summary.scenarios[1]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioEnd - Scenario with failing step (2)",
        });

        // Third scenario - passed
        await reporter.onScenarioStart(scenarios[2]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioStart - Simple passing scenario (3)",
        });

        await reporter.onStepStart(stepDefinitions.passing);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepStart - Step that passes (3)",
        });

        await reporter.onStepEnd(stepDefinitions.passing, stepResults.passed);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onStepEnd - Step that passes (3)",
        });

        await reporter.onScenarioEnd(scenarios[2], summary.scenarios[2]);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (3)",
        });

        await reporter.onRunEnd(summary);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onRunEnd",
        });
      });

      it("empty run with no scenarios", async (t) => {
        const buffer = new Buffer();
        const reporter = new ReporterClass({
          output: buffer.writable,
          noColor: false,
        });

        const summary = runSummaries.empty;
        const scenarios: ScenarioDefinition[] = [];

        await reporter.onRunStart(scenarios);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onRunStart",
        });

        await reporter.onRunEnd(summary);
        await assertSnapshot(t, getRawBufferOutput(buffer), {
          name: "after onRunEnd",
        });
      });
    });

    describe("without colors (noColor: true)", () => {
      it("complete run with all scenarios passed", async (t) => {
        const buffer = new Buffer();
        const reporter = new ReporterClass({
          output: buffer.writable,
          noColor: true,
        });

        const summary = runSummaries.allPassed;
        const scenarios = [
          scenarioDefinitions.simple,
          scenarioDefinitions.simple,
          scenarioDefinitions.simple,
        ];

        await reporter.onRunStart(scenarios);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onRunStart",
        });

        // First scenario
        await reporter.onScenarioStart(scenarios[0]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioStart - Simple passing scenario (1)",
        });

        await reporter.onStepStart(stepDefinitions.passing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that passes (1)",
        });

        await reporter.onStepEnd(stepDefinitions.passing, stepResults.passed);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepEnd - Step that passes (1)",
        });

        await reporter.onScenarioEnd(scenarios[0], summary.scenarios[0]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (1)",
        });

        // Second scenario
        await reporter.onScenarioStart(scenarios[1]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioStart - Simple passing scenario (2)",
        });

        await reporter.onStepStart(stepDefinitions.passing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that passes (2)",
        });

        await reporter.onStepEnd(stepDefinitions.passing, stepResults.passed);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepEnd - Step that passes (2)",
        });

        await reporter.onScenarioEnd(scenarios[1], summary.scenarios[1]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (2)",
        });

        // Third scenario
        await reporter.onScenarioStart(scenarios[2]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioStart - Simple passing scenario (3)",
        });

        await reporter.onStepStart(stepDefinitions.passing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that passes (3)",
        });

        await reporter.onStepEnd(stepDefinitions.passing, stepResults.passed);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepEnd - Step that passes (3)",
        });

        await reporter.onScenarioEnd(scenarios[2], summary.scenarios[2]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (3)",
        });

        await reporter.onRunEnd(summary);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onRunEnd",
        });
      });

      it("complete run with failures", async (t) => {
        const buffer = new Buffer();
        const reporter = new ReporterClass({
          output: buffer.writable,
          noColor: true,
        });

        const summary = runSummaries.withFailures;
        const scenarios = [
          scenarioDefinitions.simple,
          scenarioDefinitions.withFailingStep,
          scenarioDefinitions.simple,
        ];

        await reporter.onRunStart(scenarios);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onRunStart",
        });

        // First scenario - passed
        await reporter.onScenarioStart(scenarios[0]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioStart - Simple passing scenario (1)",
        });

        await reporter.onStepStart(stepDefinitions.passing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that passes (1)",
        });

        await reporter.onStepEnd(stepDefinitions.passing, stepResults.passed);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepEnd - Step that passes (1)",
        });

        await reporter.onScenarioEnd(scenarios[0], summary.scenarios[0]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (1)",
        });

        // Second scenario - failed
        await reporter.onScenarioStart(scenarios[1]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioStart - Scenario with failing step (2)",
        });

        await reporter.onStepStart(stepDefinitions.passing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that passes (2-1)",
        });

        await reporter.onStepEnd(stepDefinitions.passing, stepResults.passed);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepEnd - Step that passes (2-1)",
        });

        await reporter.onStepStart(stepDefinitions.failing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that fails (2-2)",
        });

        await reporter.onStepError(
          stepDefinitions.failing,
          new Error("Assertion failed"),
        );
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepError - Step that fails (2-2)",
        });

        await reporter.onScenarioEnd(scenarios[1], summary.scenarios[1]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioEnd - Scenario with failing step (2)",
        });

        // Third scenario - passed
        await reporter.onScenarioStart(scenarios[2]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioStart - Simple passing scenario (3)",
        });

        await reporter.onStepStart(stepDefinitions.passing);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepStart - Step that passes (3)",
        });

        await reporter.onStepEnd(stepDefinitions.passing, stepResults.passed);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onStepEnd - Step that passes (3)",
        });

        await reporter.onScenarioEnd(scenarios[2], summary.scenarios[2]);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onScenarioEnd - Simple passing scenario (3)",
        });

        await reporter.onRunEnd(summary);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onRunEnd",
        });
      });

      it("empty run with no scenarios", async (t) => {
        const buffer = new Buffer();
        const reporter = new ReporterClass({
          output: buffer.writable,
          noColor: true,
        });

        const summary = runSummaries.empty;
        const scenarios: ScenarioDefinition[] = [];

        await reporter.onRunStart(scenarios);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onRunStart",
        });

        await reporter.onRunEnd(summary);
        await assertSnapshot(t, getBufferOutputNoColor(buffer), {
          name: "after onRunEnd",
        });
      });
    });
  });
}
