/**
 * Implementation of the `probitas run` command
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { resolve } from "@std/path";
import { unreachable } from "@core/errorutil/unreachable";
import { getLogger, type LogLevel } from "@logtape/logtape";
import { DEFAULT_TIMEOUT, EXIT_CODE } from "../constants.ts";
import { findProbitasConfigFile, loadConfig } from "../config.ts";
import { discoverScenarioFiles } from "@probitas/discover";
import type { Reporter, RunResult } from "@probitas/runner";
import {
  configureLogging,
  loadEnvironment,
  parsePositiveInteger,
  parseTimeout,
  readAsset,
  resolveReporter,
} from "../utils.ts";
import { createDiscoveryProgress } from "../progress.ts";
import {
  deserializeError,
  deserializeRunResult,
  deserializeScenarioResult,
  deserializeStepResult,
  type WorkerInput,
  type WorkerOutput,
} from "./run/protocol.ts";

const logger = getLogger(["probitas", "cli", "run"]);

/**
 * Execute the run command
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @param signal - Optional AbortSignal for graceful shutdown
 * @returns Exit code (0 = success, 1 = failure, 2 = usage error)
 *
 * @requires --allow-read Permission to read config and scenario files
 */
export async function runCommand(
  args: string[],
  cwd: string,
  signal?: AbortSignal,
): Promise<number> {
  try {
    // Parse command-line arguments
    const parsed = parseArgs(args, {
      string: [
        "reporter",
        "config",
        "max-concurrency",
        "max-failures",
        "include",
        "exclude",
        "selector",
        "timeout",
        "env",
      ],
      boolean: [
        "help",
        "no-color",
        "no-timeout",
        "no-env",
        "reload",
        "quiet",
        "verbose",
        "debug",
        "sequential",
        "fail-fast",
      ],
      collect: ["include", "exclude", "selector"],
      alias: {
        h: "help",
        s: "selector",
        S: "sequential",
        f: "fail-fast",
        v: "verbose",
        q: "quiet",
        d: "debug",
        r: "reload",
      },
      default: {
        include: undefined,
        exclude: undefined,
        selector: undefined,
      },
    });

    // Show help if requested
    if (parsed.help) {
      try {
        const helpText = await readAsset("usage-run.txt");
        console.log(helpText);
        return EXIT_CODE.SUCCESS;
      } catch (error) {
        // Use console.error here since logging is not yet configured
        console.error(
          "Error reading help file:",
          error instanceof Error ? error.message : String(error),
        );
        return EXIT_CODE.USAGE_ERROR;
      }
    }

    // Determine log level
    const logLevel: LogLevel = parsed.debug
      ? "debug"
      : parsed.verbose
      ? "info"
      : parsed.quiet
      ? "fatal"
      : "warning";

    // Configure logging with determined log level
    await configureLogging(logLevel);
    logger.debug("Run command started", { args, cwd, logLevel });

    // Load environment variables before loading configuration
    // This allows config files to reference environment variables
    await loadEnvironment(cwd, {
      noEnv: parsed["no-env"],
      envFile: parsed.env,
    });

    // Load configuration
    const configPath = parsed.config ??
      await findProbitasConfigFile(cwd, { parentLookup: true });
    const config = configPath ? await loadConfig(configPath) : {};

    // Determine includes/excludes: CLI > config
    const includes = parsed.include ?? config?.includes;
    const excludes = parsed.exclude ?? config?.excludes;

    // Discover scenario files
    const paths = parsed
      ._
      .map(String)
      .map((p) => resolve(cwd, p));

    // Show progress during discovery (only in TTY, suppressed in quiet mode)
    const discoveryProgress = parsed.quiet ? null : createDiscoveryProgress();
    const scenarioFiles = await discoverScenarioFiles(
      paths.length ? paths : [cwd],
      {
        includes,
        excludes,
        onProgress: discoveryProgress?.onProgress,
      },
    );
    discoveryProgress?.complete(scenarioFiles.length);

    if (scenarioFiles.length === 0) {
      console.warn("No scenario files found");
      return EXIT_CODE.NOT_FOUND;
    }

    logger.info("Discovered scenario files", {
      count: scenarioFiles.length,
      files: scenarioFiles,
    });

    // Get selectors (will be applied in worker)
    const selectors = parsed.selector ?? config?.selectors ?? [];

    // Parse options
    const maxConcurrency = parsed.sequential
      ? 1
      : parsed["max-concurrency"]
      ? parsePositiveInteger(parsed["max-concurrency"], "max-concurrency")
      : config?.maxConcurrency;

    const maxFailures = parsed["fail-fast"]
      ? 1
      : parsed["max-failures"]
      ? parsePositiveInteger(parsed["max-failures"], "max-failures")
      : config?.maxFailures;

    // Parse timeout: CLI > config > default
    // --no-timeout or --timeout 0 disables timeout
    const timeoutString = parsed["no-timeout"]
      ? "0"
      : (parsed.timeout ?? config?.timeout ?? DEFAULT_TIMEOUT);
    const timeoutSeconds = parseTimeout(timeoutString);
    const timeout = timeoutSeconds ? timeoutSeconds * 1000 : 0;

    // Setup reporter with cwd for relative path display
    const reporter = resolveReporter(parsed.reporter ?? config?.reporter, {
      cwd,
    });

    // Run scenarios with Worker
    const runResult = await runWithWorker(scenarioFiles, {
      reporter,
      selectors,
      maxConcurrency: maxConcurrency ?? 0,
      maxFailures: maxFailures ?? 0,
      timeout,
      logLevel,
      signal,
    });

    logger.info("Scenarios completed", {
      total: runResult.total,
      passed: runResult.passed,
      failed: runResult.failed,
      skipped: runResult.skipped,
    });

    return runResult.failed > 0 ? EXIT_CODE.FAILURE : EXIT_CODE.SUCCESS;
  } catch (err: unknown) {
    logger.error("Unexpected error in run command", { error: err });
    console.error(
      "Error:",
      err instanceof Error ? err.message : String(err),
    );
    return EXIT_CODE.USAGE_ERROR;
  }
}

/**
 * Run scenarios using a single Worker
 */
async function runWithWorker(
  filePaths: readonly string[],
  options: {
    reporter: Reporter;
    selectors: readonly string[];
    maxConcurrency: number;
    maxFailures: number;
    timeout: number;
    logLevel: LogLevel;
    signal?: AbortSignal;
  },
): Promise<RunResult> {
  const {
    reporter,
    selectors,
    maxConcurrency,
    maxFailures,
    timeout,
    logLevel,
    signal,
  } = options;

  // Create a single worker
  const workerUrl = new URL("./run/worker.ts", import.meta.url);
  const worker = new Worker(workerUrl, { type: "module" });

  // Check if already aborted before setting up worker
  if (signal?.aborted) {
    worker.terminate();
    throw new Error("Aborted before execution started");
  }

  const {
    resolve: resolveResult,
    reject: rejectResult,
    promise: promiseResult,
  } = Promise.withResolvers<RunResult>();

  // Set up abort handler to send abort message to worker
  const abortHandler = () => {
    worker.postMessage({ type: "abort" } satisfies WorkerInput);
  };
  signal?.addEventListener("abort", abortHandler, { once: true });

  // Set up error handler to catch worker errors
  const errorHandler = (event: ErrorEvent) => {
    logger.debug("Worker error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
    rejectResult(event.error);
  };
  worker.addEventListener("error", errorHandler);

  // Setup message handler for all messages (including ready signal)
  // This avoids race condition between ready signal and subsequent messages
  const pendingReporterOps = new Set<Promise<void>>();
  let isReady = false;
  const {
    resolve: resolveReady,
    reject: rejectReady,
    promise: readyPromise,
  } = Promise.withResolvers<void>();

  const messageHandler = (event: MessageEvent<WorkerOutput>) => {
    const output = event.data;

    // Handle ready signal specially
    if (output.type === "ready") {
      isReady = true;
      resolveReady();
      return;
    }

    // Reject if we receive messages before ready
    if (!isReady) {
      rejectReady(new Error("Unexpected message from worker before ready"));
      return;
    }

    const handleMessage = async () => {
      try {
        const result = await handleWorkerOutput(reporter, output);
        if (result) {
          // Wait for all pending reporter operations to complete
          // Take a snapshot to avoid issues with concurrent modifications
          await Promise.all([...pendingReporterOps]);
          resolveResult(result);
        }
      } catch (err) {
        rejectResult(err);
      }
    };

    // Track this operation if it's not the final result
    if (output.type !== "result" && output.type !== "error") {
      const promise = handleMessage();
      pendingReporterOps.add(promise);
      // Remove from set when done to prevent memory buildup
      promise.finally(() => pendingReporterOps.delete(promise));
    } else {
      // For result/error, handle immediately
      handleMessage();
    }
  };
  worker.addEventListener("message", messageHandler);

  // Wait for worker ready signal
  await readyPromise;

  try {
    // Send file paths to worker
    const message: WorkerInput = {
      type: "run",
      filePaths,
      selectors,
      maxConcurrency,
      maxFailures,
      timeout,
      logLevel,
    };
    worker.postMessage(message);

    // Wait for completion
    return await promiseResult;
  } finally {
    // Clean up event listeners
    worker.removeEventListener("message", messageHandler);
    worker.removeEventListener("error", errorHandler);
    signal?.removeEventListener("abort", abortHandler);

    // Terminate worker (postMessage not needed as terminate() is immediate)
    worker.terminate();
  }
}

async function handleWorkerOutput(
  reporter: Reporter,
  output: WorkerOutput,
): Promise<RunResult | void> {
  switch (output.type) {
    case "ready":
      // Already handled output type
      throw new Error("Unexpected 'ready' message from worker");

    case "result":
      return deserializeRunResult(output.result);

    case "error":
      throw deserializeError(output.error);

    case "run_start":
      await reporter.onRunStart?.(output.scenarios);
      break;

    case "run_end":
      await reporter.onRunEnd?.(
        output.scenarios,
        deserializeRunResult(output.result),
      );
      break;

    case "scenario_start":
      await reporter.onScenarioStart?.(output.scenario);
      break;

    case "scenario_end":
      await reporter.onScenarioEnd?.(
        output.scenario,
        deserializeScenarioResult(output.result),
      );
      break;

    case "step_start":
      await reporter.onStepStart?.(output.scenario, output.step);
      break;

    case "step_end":
      await reporter.onStepEnd?.(
        output.scenario,
        output.step,
        deserializeStepResult(output.result),
      );
      break;

    default:
      unreachable(output);
  }
}
