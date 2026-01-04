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
  extractDenoOptions,
  loadEnvironment,
  parsePositiveInteger,
  parseTimeout,
  readAsset,
  resolveReporter,
} from "../utils.ts";
import { createDiscoveryProgress } from "../progress.ts";
import {
  createNdjsonStream,
  prepareSubprocessScript,
  sendJsonInput,
  spawnDenoSubprocess,
  startIpcServer,
  waitForIpcConnection,
} from "../subprocess.ts";
import {
  deserializeError,
  deserializeRunResult,
  deserializeScenarioResult,
  deserializeStepResult,
  isRunOutput,
  type RunCommandInput,
  type RunOutput,
} from "../_templates/run_protocol.ts";

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
    // Extract deno options first (before parseArgs)
    const { denoArgs, remainingArgs } = extractDenoOptions(args);

    // Parse command-line arguments
    const parsed = parseArgs(remainingArgs, {
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
    logger.debug("Run command started", { args, cwd, logLevel, denoArgs });

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

    // Get selectors (will be applied in subprocess)
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

    // Run scenarios with subprocess
    const runResult = await runWithSubprocess(scenarioFiles, {
      reporter,
      selectors,
      maxConcurrency: maxConcurrency ?? 0,
      maxFailures: maxFailures ?? 0,
      timeout,
      logLevel,
      denoArgs,
      cwd,
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
 * Run scenarios using a subprocess
 */
async function runWithSubprocess(
  filePaths: readonly string[],
  options: {
    reporter: Reporter;
    selectors: readonly string[];
    maxConcurrency: number;
    maxFailures: number;
    timeout: number;
    logLevel: LogLevel;
    denoArgs: string[];
    cwd: string;
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
    denoArgs,
    cwd,
    signal,
  } = options;

  if (signal?.aborted) {
    throw new Error("Aborted before execution started");
  }

  // Start IPC server and get port
  const { listener, port } = startIpcServer();

  // Prepare and spawn subprocess
  const templateUrl = new URL("../_templates/run.ts", import.meta.url);
  const { scriptPath, tempDir } = await prepareSubprocessScript(
    templateUrl,
    "run",
  );
  const proc = spawnDenoSubprocess({
    denoArgs,
    scriptPath,
    cwd,
    ipcPort: port,
    signal,
  });

  // Wait for subprocess to connect (connection = ready)
  // Race against subprocess exit to detect early failures
  const ipc = await waitForIpcConnection(listener, { subprocess: proc });

  // Create NDJSON stream from IPC connection
  const outputStream = createNdjsonStream(ipc.readable, isRunOutput);

  // Send run input to subprocess via IPC
  await sendJsonInput(
    ipc.writable,
    {
      type: "run",
      filePaths,
      selectors,
      maxConcurrency,
      maxFailures,
      timeout,
      logLevel,
    } satisfies RunCommandInput,
  );

  try {
    for await (const output of outputStream) {
      // Process output message
      const result = await handleSubprocessOutput(reporter, output);
      if (result) {
        return result;
      }
    }

    // If aborted, return a failure result to signal interrupted execution.
    // Note: The counts are approximations since we don't know actual scenario
    // count (filePaths are files, not scenarios) or partial completion state.
    // The important invariant is failed > 0 so caller treats abort as failure.
    if (signal?.aborted) {
      return {
        total: filePaths.length,
        passed: 0,
        failed: filePaths.length,
        skipped: 0,
        scenarios: [],
        duration: 0,
      };
    }

    throw new Error("Subprocess ended without sending result");
  } finally {
    ipc.close();
    listener.close();
    await proc.status;
    // Clean up temporary directory
    await Deno.remove(tempDir, { recursive: true }).catch(() => {});
  }
}

async function handleSubprocessOutput(
  reporter: Reporter,
  output: RunOutput,
): Promise<RunResult | void> {
  switch (output.type) {
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
