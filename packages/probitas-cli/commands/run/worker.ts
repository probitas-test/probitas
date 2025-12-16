/**
 * Worker entry point for scenario execution
 *
 * Each worker executes a single scenario in isolation, preventing
 * global state pollution between scenarios.
 *
 * @module
 */

/// <reference lib="deno.worker" />

import type { ScenarioMetadata, StepMetadata } from "@probitas/core";
import { loadScenarios } from "@probitas/core/loader";
import { configureLogging, getLogger } from "@probitas/logger";
import type { Reporter, ScenarioResult, StepResult } from "@probitas/runner";
import { Runner } from "@probitas/runner";
import {
  serializeError,
  serializeScenarioResult,
  serializeStepResult,
  type WorkerInput,
  type WorkerOutput,
  type WorkerRunInput,
} from "./protocol.ts";

/**
 * Create a reporter that sends events to main thread via postMessage
 */
function createWorkerReporter(taskId: string): Reporter {
  return {
    onScenarioStart(scenario: ScenarioMetadata): void {
      postOutput({
        type: "scenario_start",
        taskId,
        scenario,
      });
    },
    onScenarioEnd(
      scenario: ScenarioMetadata,
      result: ScenarioResult,
    ): void {
      postOutput({
        type: "scenario_end",
        taskId,
        scenario,
        result: serializeScenarioResult(result),
      });
    },
    onStepStart(scenario: ScenarioMetadata, step: StepMetadata): void {
      postOutput({
        type: "step_start",
        taskId,
        scenario,
        step,
      });
    },
    onStepEnd(
      scenario: ScenarioMetadata,
      step: StepMetadata,
      result: StepResult,
    ): void {
      postOutput({
        type: "step_end",
        taskId,
        scenario,
        step,
        result: serializeStepResult(result),
      });
    },
  };
}

/**
 * Post a message to main thread
 */
function postOutput(output: WorkerOutput): void {
  self.postMessage(output);
}

/**
 * Execute a scenario from file
 */
async function runScenario(input: WorkerRunInput): Promise<void> {
  const { taskId, filePath, scenarioIndex, timeout, logLevel } = input;

  // Configure logging in worker if log level is provided
  if (logLevel) {
    await configureLogging(logLevel);
  }

  try {
    // Load scenarios from file
    const scenarios = await loadScenarios([filePath], {
      onImportError: (file, err) => {
        const m = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to import scenario file ${file}: ${m}`);
      },
    });

    if (scenarios.length === 0) {
      throw new Error(`No scenarios found in file: ${filePath}`);
    }

    if (scenarioIndex >= scenarios.length) {
      throw new Error(
        `Scenario index ${scenarioIndex} out of range (file has ${scenarios.length} scenarios)`,
      );
    }

    const scenario = scenarios[scenarioIndex];

    // Create abort signal for timeout
    const signal = timeout ? AbortSignal.timeout(timeout) : undefined;

    // Create reporter that sends events to main thread
    const reporter = createWorkerReporter(taskId);

    // Run scenario using Runner (executes single scenario)
    const runner = new Runner(reporter);
    const runResult = await runner.run([scenario], { signal });

    // Extract the single scenario result
    const result = runResult.scenarios[0];

    postOutput({
      type: "result",
      taskId,
      result: serializeScenarioResult(result),
    });
  } catch (error) {
    postOutput({
      type: "error",
      taskId,
      error: serializeError(error),
    });
  }
}

/**
 * Handle messages from main thread
 */
self.onmessage = async (event: MessageEvent<WorkerInput>) => {
  const input = event.data;

  switch (input.type) {
    case "run":
      await runScenario(input);
      break;

    case "terminate":
      self.close();
      break;
  }
};

const logger = getLogger("probitas", "cli", "run", "worker");

// Handle unhandled promise rejections from Deno's node:http2 compatibility layer.
// The "Bad resource ID" error occurs during HTTP/2 stream cleanup and doesn't
// affect test correctness, but causes the worker to crash without this handler.
self.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  event.preventDefault();

  const error = event.reason;
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Silently ignore "Bad resource ID" errors from node:http2
  if (
    errorMessage.includes("Bad resource ID") ||
    (error instanceof Error && error.stack?.includes("node:http2"))
  ) {
    return;
  }

  // Log other unhandled rejections
  logger.error`Unhandled promise rejection in worker: ${error}`;
});

// Signal that worker is ready
postOutput({ type: "ready" });
