/**
 * Implementation of the `probitas run` command
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { resolve } from "@std/path";
import { configureLogging, getLogger, type LogLevel } from "@probitas/logger";
import { DEFAULT_TIMEOUT, EXIT_CODE } from "../constants.ts";
import { loadConfig } from "../config.ts";
import { discoverScenarioFiles } from "@probitas/discover";
import {
  createTempSubprocessConfig,
  findDenoConfigFile,
  parsePositiveInteger,
  parseTimeout,
  readAsset,
} from "../utils.ts";

const logger = getLogger("probitas", "cli", "run");

/**
 * Execute the run command
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @returns Exit code (0 = success, 1 = failure, 2 = usage error)
 *
 * @requires --allow-read Permission to read config and scenario files
 */
export async function runCommand(
  args: string[],
  cwd: string,
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
      ],
      boolean: [
        "help",
        "no-color",
        "no-timeout",
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
    try {
      await configureLogging(logLevel);
      logger.debug("Run command started", { args, cwd, logLevel });
    } catch {
      // Silently ignore logging configuration errors (e.g., in test environments)
    }

    // Load configuration
    const configPath = parsed.config ??
      await findDenoConfigFile(cwd, { parentLookup: true });
    const config = configPath ? await loadConfig(configPath) : {};

    // Determine includes/excludes: CLI > config
    const includes = parsed.include ?? config?.includes;
    const excludes = parsed.exclude ?? config?.excludes;

    // Discover scenario files
    const paths = parsed
      ._
      .map(String)
      .map((p) => resolve(cwd, p));
    const scenarioFiles = await discoverScenarioFiles(
      paths.length ? paths : [cwd],
      {
        includes,
        excludes,
      },
    );

    if (scenarioFiles.length === 0) {
      logger.error("No scenarios found", { paths, includes, excludes });
      return EXIT_CODE.NOT_FOUND;
    }

    logger.info("Discovered scenario files", {
      count: scenarioFiles.length,
      files: scenarioFiles,
    });

    // Build subprocess input
    const selectors = parsed.selector ?? config?.selectors ?? [];
    const noColor = parsed["no-color"] || Deno.noColor;

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
    // Note: CLI accepts string format, config has string format, but we convert to seconds here
    const timeoutString = parsed["no-timeout"]
      ? "0"
      : (parsed.timeout ?? config?.timeout ?? DEFAULT_TIMEOUT);
    const timeout = parseTimeout(timeoutString);

    const subprocessInput = {
      files: scenarioFiles,
      selectors,
      reporter: parsed.reporter ?? config?.reporter,
      noColor,
      logLevel,
      maxConcurrency,
      maxFailures,
      timeout,
    };

    // Prepare config file for subprocess with scopes
    await using stack = new AsyncDisposableStack();

    // Create temporary deno.json with scopes
    const subprocessConfigPath = await createTempSubprocessConfig(configPath);
    stack.defer(async () => {
      await Deno.remove(subprocessConfigPath);
    });

    // Subprocess path
    const subprocessPath = new URL(
      "./run/subprocess.ts",
      import.meta.url,
    ).href;

    // Build subprocess arguments
    const subprocessArgs = [
      "run",
      "-A", // All permissions
      "--no-lock",
      "--unstable-kv",
      "--config",
      subprocessConfigPath,
      ...(parsed.reload ? ["--reload"] : []),
      subprocessPath,
    ];

    // Spawn subprocess
    const cmd = new Deno.Command("deno", {
      args: subprocessArgs,
      cwd,
      stdin: "piped",
      stdout: "inherit", // Pass through to parent
      stderr: "inherit", // Pass through to parent
    });

    const child = cmd.spawn();

    // Send configuration via stdin
    const writer = child.stdin.getWriter();
    await writer.write(
      new TextEncoder().encode(JSON.stringify(subprocessInput)),
    );
    await writer.close();

    // Wait for subprocess to complete with timeout enforcement
    let result: Deno.CommandStatus;
    if (timeout && timeout > 0) {
      // Create a promise that rejects when the timeout expires
      const timeoutPromise = new Promise<never>((_, reject) => {
        const signal = AbortSignal.timeout(timeout * 1000);
        // Set up abort handler to kill subprocess and reject promise
        signal.addEventListener("abort", () => {
          child.kill("SIGTERM");
          reject(
            new Error(`Subprocess killed after timeout of ${timeout} seconds`),
          );
        });
      });

      try {
        result = await Promise.race([child.status, timeoutPromise]);
      } catch (err: unknown) {
        logger.error("Subprocess timeout", {
          timeout,
          error: err instanceof Error ? err.message : String(err),
        });
        // Wait a moment for the process to clean up
        try {
          await child.status;
        } catch {
          // Ignore errors from waiting for killed process
        }
        return EXIT_CODE.FAILURE;
      }
    } else {
      // No timeout, just wait for completion
      result = await child.status;
    }

    logger.debug("Subprocess completed", { exitCode: result.code });

    // Map exit code
    if (result.code === 0) return EXIT_CODE.SUCCESS;
    if (result.code === 4) return EXIT_CODE.NOT_FOUND;
    return EXIT_CODE.FAILURE;
  } catch (err: unknown) {
    logger.error("Unexpected error in run command", { error: err });
    return EXIT_CODE.USAGE_ERROR;
  }
}
