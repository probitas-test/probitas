/**
 * Subprocess entry point for run command
 *
 * Executes scenarios and streams progress via TCP IPC.
 * Communication is via NDJSON over TCP (not stdin/stdout).
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
import {
  closeIpc,
  configureLogging,
  connectIpc,
  type IpcConnection,
  parseIpcPort,
  readInput,
  writeOutput,
} from "./utils.ts";

const logger = getLogger(["probitas", "cli", "run", "subprocess"]);

// Global AbortController for graceful shutdown
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
 */
async function runScenarios(
  ipc: IpcConnection,
  input: RunCommandInput,
): Promise<void> {
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

    // Create reporter that streams events to IPC
    const reporter = createReporter((output) => writeOutput(ipc, output));

    // Run all scenarios using Runner
    const runner = new Runner(reporter);
    const runResult = await runner.run(scenarios, {
      maxConcurrency,
      maxFailures,
      signal,
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
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Parse IPC port from command line arguments
  const port = parseIpcPort(Deno.args);

  // Connect to parent process IPC server
  const ipc = await connectIpc(port);

  try {
    // Read input from IPC (TCP connection establishes readiness)
    const input = await readInput(ipc) as RunCommandInput;

    await runScenarios(ipc, input);
  } catch (error) {
    try {
      await writeOutput(
        ipc,
        {
          type: "error",
          error: serializeError(error),
        } satisfies RunOutput,
      );
    } catch {
      // Failed to write error to IPC, log to console as fallback
      console.error("Subprocess error:", error);
    }
  } finally {
    // Await close to ensure all pending writes are flushed
    await closeIpc(ipc);
  }
}

// Run main and exit explicitly to avoid LogTape keeping process alive
main().finally(() => {
  // Ensure process exits after output is flushed
  setTimeout(() => Deno.exit(0), 0);
});
