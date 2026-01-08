/**
 * Subprocess entry point for run command
 *
 * Executes scenarios and streams progress via TCP IPC.
 * Communication is via CBOR over TCP (not stdin/stdout).
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
import { configureLogging, runSubprocess, writeOutput } from "./utils.ts";

const logger = getLogger(["probitas", "cli", "run", "subprocess"]);

// Global AbortController for manual cancellation (Ctrl-C, --fail-fast, etc.)
let globalAbortController: AbortController | null = null;

// Handle unhandled promise rejections from Deno's node:http2 compatibility layer.
// The "Bad resource ID" error occurs during HTTP/2 stream cleanup and doesn't
// affect test correctness, but causes the subprocess to crash without this handler.
globalThis.addEventListener(
  "unhandledrejection",
  (event: PromiseRejectionEvent) => {
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
    logger.error`Unhandled promise rejection in subprocess: ${error}`;
  },
);

/**
 * Execute all scenarios
 *
 * This handler manages its own error handling because it needs to:
 * 1. Clean up the abort controller on error
 * 2. Write structured error output for scenario execution failures
 */
runSubprocess<RunCommandInput>(async (ipc, input) => {
  const {
    filePaths,
    selectors,
    maxConcurrency,
    maxFailures,
    timeout,
    stepOptions,
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

    // Create reporter that streams events to IPC
    const reporter = createReporter((output) => writeOutput(ipc, output));

    // Run all scenarios using Runner
    const runner = new Runner(reporter);
    const runResult = await runner.run(scenarios, {
      maxConcurrency,
      maxFailures,
      timeout: timeout > 0 ? timeout : undefined,
      signal: globalAbortController.signal,
      stepOptions,
    });

    await writeOutput(
      ipc,
      {
        type: "result",
        result: serializeRunResult(runResult),
      } satisfies RunOutput,
    );
  } catch (error) {
    await writeOutput(
      ipc,
      {
        type: "error",
        error: serializeError(error),
      } satisfies RunOutput,
    );
  } finally {
    globalAbortController = null;
  }
});
