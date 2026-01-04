/**
 * Subprocess entry point for run command
 *
 * Executes scenarios and streams progress via stdout.
 * Communication is via JSON over stdin/stdout.
 *
 * @module
 * @internal
 */

import { applySelectors } from "@probitas/core/selector";
import { loadScenarios } from "@probitas/core/loader";
import { getLogger } from "@logtape/logtape";
import { Runner } from "@probitas/runner";
import {
  createReporter,
  type RunCommandInput,
  type RunOutput,
  serializeError,
  serializeRunResult,
} from "./run_protocol.ts";
import { configureLogging, readStdin, writeOutput } from "./utils.ts";

const logger = getLogger(["probitas", "cli", "run", "subprocess"]);

// Global AbortController for graceful shutdown
let globalAbortController: AbortController | null = null;

/**
 * Execute all scenarios
 */
async function runScenarios(input: RunCommandInput): Promise<void> {
  const {
    filePaths,
    selectors,
    maxConcurrency,
    maxFailures,
    timeout,
    logLevel,
  } = input;

  // Create abort controller for this run
  globalAbortController = new AbortController();

  // Configure logging in subprocess
  await configureLogging(logLevel);

  try {
    // Load scenarios from files
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

    // Create reporter that streams events to stdout
    const reporter = createReporter(writeOutput);

    // Run all scenarios using Runner
    const runner = new Runner(reporter);
    const runResult = await runner.run(scenarios, {
      maxConcurrency,
      maxFailures,
      signal,
    });

    writeOutput(
      {
        type: "result",
        result: serializeRunResult(runResult),
      } satisfies RunOutput,
    );
  } catch (error) {
    writeOutput(
      {
        type: "error",
        error: serializeError(error),
      } satisfies RunOutput,
    );
  } finally {
    globalAbortController = null;
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Signal that subprocess is ready
  writeOutput({ type: "ready" } satisfies RunOutput);

  try {
    // Read input from stdin
    const inputJson = await readStdin();
    const input: RunCommandInput = JSON.parse(inputJson);

    await runScenarios(input);
  } catch (error) {
    writeOutput(
      {
        type: "error",
        error: serializeError(error),
      } satisfies RunOutput,
    );
  }
}

// Run main and exit explicitly to avoid LogTape keeping process alive
main().finally(() => {
  // Ensure process exits after output is flushed
  setTimeout(() => Deno.exit(0), 0);
});
