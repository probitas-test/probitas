/**
 * Worker entry point for scenario execution
 *
 * Executes all scenarios in a single worker, using Runner.run() for
 * concurrent execution and failure control.
 *
 * @module
 */

/// <reference lib="deno.worker" />

import type { ScenarioMetadata, StepMetadata } from "@probitas/core";
import { applySelectors } from "@probitas/core/selector";
import { loadScenarios } from "@probitas/core/loader";
import { getLogger } from "@logtape/logtape";
import type {
  Reporter,
  RunResult,
  ScenarioResult,
  StepResult,
} from "@probitas/runner";
import { Runner } from "@probitas/runner";
import {
  serializeError,
  serializeRunResult,
  serializeScenarioResult,
  serializeStepResult,
  type WorkerInput,
  type WorkerOutput,
  type WorkerRunInput,
} from "./protocol.ts";
import { configureLogging } from "../../utils.ts";

const logger = getLogger(["probitas", "cli", "run", "worker"]);

// Global AbortController for graceful shutdown
let globalAbortController: AbortController | null = null;

/**
 * Reporter that sends events to main thread via postMessage
 */
class WorkerReporter implements Reporter {
  onRunStart(scenarios: readonly ScenarioMetadata[]): void {
    postOutput({
      type: "run_start",
      scenarios,
    });
  }

  onRunEnd(
    scenarios: readonly ScenarioMetadata[],
    result: RunResult,
  ): void {
    postOutput({
      type: "run_end",
      scenarios,
      result: serializeRunResult(result),
    });
  }

  onScenarioStart(scenario: ScenarioMetadata): void {
    postOutput({
      type: "scenario_start",
      scenario,
    });
  }

  onScenarioEnd(
    scenario: ScenarioMetadata,
    result: ScenarioResult,
  ): void {
    postOutput({
      type: "scenario_end",
      scenario,
      result: serializeScenarioResult(result),
    });
  }

  onStepStart(scenario: ScenarioMetadata, step: StepMetadata): void {
    postOutput({
      type: "step_start",
      scenario,
      step,
    });
  }

  onStepEnd(
    scenario: ScenarioMetadata,
    step: StepMetadata,
    result: StepResult,
  ): void {
    postOutput({
      type: "step_end",
      scenario,
      step,
      result: serializeStepResult(result),
    });
  }
}

/**
 * Post a message to main thread
 */
function postOutput(output: WorkerOutput): void {
  self.postMessage(output);
}

/**
 * Execute all scenarios using Runner
 */
async function runScenarios(input: WorkerRunInput): Promise<void> {
  const {
    filePaths,
    selectors,
    maxConcurrency,
    maxFailures,
    timeout,
    logLevel,
  } = input;

  // Reset any existing controller and create a new one for this run.
  // Created before loading so abort requests can be honored once processed.
  if (globalAbortController) {
    globalAbortController.abort();
  }
  globalAbortController = new AbortController();

  // Configure logging in worker
  await configureLogging(logLevel);

  try {
    // Load scenarios from files (only once!)
    const scenarios = applySelectors(
      await loadScenarios(filePaths, {
        onImportError: (file, err) => {
          const m = err instanceof Error ? err.message : String(err);
          throw new Error(`Failed to import scenario file ${file}: ${m}`);
        },
      }),
      selectors,
    );

    // Check if aborted during loading phase
    if (globalAbortController.signal.aborted) {
      throw new Error("Aborted during scenario loading");
    }

    // Log warning if no scenarios found after filtering
    if (scenarios.length === 0) {
      logger.info("No scenarios found after applying selectors", {
        filePaths,
        selectors,
      });
    }

    // Create abort signal that combines timeout and manual abort
    const signal = timeout > 0
      ? AbortSignal.any([
        AbortSignal.timeout(timeout),
        globalAbortController.signal,
      ])
      : globalAbortController.signal;

    // Create reporter that sends events to main thread
    const reporter = new WorkerReporter();

    // Run all scenarios using Runner (handles concurrency and failures)
    const runner = new Runner(reporter);
    const runResult = await runner.run(scenarios, {
      maxConcurrency,
      maxFailures,
      signal,
    });

    postOutput({
      type: "result",
      result: serializeRunResult(runResult),
    });
  } catch (error) {
    postOutput({
      type: "error",
      error: serializeError(error),
    });
  } finally {
    globalAbortController = null;
  }
}

/**
 * Handle messages from main thread
 */
self.onmessage = async (event: MessageEvent<WorkerInput>) => {
  const input = event.data;

  switch (input.type) {
    case "run":
      await runScenarios(input);
      break;

    case "abort":
      // Gracefully abort running scenarios
      if (globalAbortController) {
        globalAbortController.abort();
      }
      break;
  }
};

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
