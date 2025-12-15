/**
 * Worker entry point for scenario execution
 *
 * Each worker executes a single scenario in isolation, preventing
 * global state pollution between scenarios.
 *
 * @module
 */

/// <reference lib="deno.worker" />

import type { ScenarioMetadata, StepMetadata } from "@probitas/scenario";
import { loadScenarios } from "@probitas/scenario";
import type { Reporter, ScenarioResult, StepResult } from "@probitas/runner";
import { Runner } from "@probitas/runner";
import type {
  SerializedError,
  WorkerInput,
  WorkerOutput,
  WorkerRunInput,
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
        result,
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
        result,
      });
    },
  };
}

/**
 * Serialize an error for transmission to main thread
 */
function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    name: "Error",
    message: String(error),
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
  const { taskId, filePath, scenarioIndex, timeout } = input;

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
      result,
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

// Signal that worker is ready
postOutput({ type: "ready" });
