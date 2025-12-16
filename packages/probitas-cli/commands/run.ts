/**
 * Implementation of the `probitas run` command
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { resolve } from "@std/path";
import { chunk } from "@std/collections/chunk";
import { configureLogging, getLogger, type LogLevel } from "@probitas/logger";
import { DEFAULT_TIMEOUT, EXIT_CODE } from "../constants.ts";
import { findProbitasConfigFile, loadConfig } from "../config.ts";
import { discoverScenarioFiles } from "@probitas/discover";
import type { ScenarioDefinition } from "@probitas/core";
import { loadScenarios } from "@probitas/core/loader";
import { applySelectors } from "@probitas/core/selector";
import {
  type Reporter,
  type RunResult,
  type ScenarioResult,
  toScenarioMetadata,
} from "@probitas/runner";
import {
  parsePositiveInteger,
  parseTimeout,
  readAsset,
  resolveReporter,
} from "../utils.ts";
import { WorkerPool, type WorkerPoolEventCallbacks } from "./run/pool.ts";

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
    const scenarioFiles = await discoverScenarioFiles(
      paths.length ? paths : [cwd],
      {
        includes,
        excludes,
      },
    );

    if (scenarioFiles.length === 0) {
      logger.error("No scenario files found", { paths, includes, excludes });
      return EXIT_CODE.NOT_FOUND;
    }

    logger.info("Discovered scenario files", {
      count: scenarioFiles.length,
      files: scenarioFiles,
    });

    // Load scenarios to get metadata and apply selectors
    let scenarios = await loadScenarios(scenarioFiles, {
      onImportError: (file, err) => {
        const m = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to load scenario from ${file}: ${m}`);
      },
    });

    logger.debug("Scenarios loaded", { scenarioCount: scenarios.length });

    if (scenarios.length === 0) {
      logger.error("No scenarios found in files");
      return EXIT_CODE.NOT_FOUND;
    }

    // Apply selectors to filter scenarios
    const selectors = parsed.selector ?? config?.selectors ?? [];
    if (selectors.length > 0) {
      logger.debug("Applying selectors", { selectors });
      scenarios = applySelectors(scenarios, selectors);
    }

    if (scenarios.length === 0) {
      logger.error("No scenarios matched the filter", { selectors });
      return EXIT_CODE.NOT_FOUND;
    }

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
    const timeoutMs = timeoutSeconds ? timeoutSeconds * 1000 : undefined;

    logger.info("Running scenarios", {
      scenarioCount: scenarios.length,
      maxConcurrency,
      maxFailures,
      timeoutMs,
    });

    // Setup reporter with cwd for relative path display
    const reporter = resolveReporter(parsed.reporter ?? config?.reporter, {
      cwd,
    });

    // Run scenarios with Worker pool
    const startTime = performance.now();
    const result = await runWithWorkers(scenarios, {
      reporter,
      maxConcurrency: maxConcurrency ?? 0,
      maxFailures: maxFailures ?? 0,
      timeout: timeoutMs,
    });
    const duration = performance.now() - startTime;

    // Create run result
    const runResult: RunResult = {
      total: scenarios.length,
      passed: result.results.filter((r) => r.status === "passed").length,
      failed: result.results.filter((r) => r.status === "failed").length,
      skipped: scenarios.length - result.results.length,
      duration,
      scenarios: result.results,
    };

    await reporter.onRunEnd?.(
      scenarios.map(toScenarioMetadata),
      runResult,
    );

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
 * Task definition for worker execution
 */
interface ScenarioTask {
  readonly scenario: ScenarioDefinition;
  readonly filePath: string;
  readonly scenarioIndex: number;
}

/**
 * Run scenarios using Worker pool
 */
async function runWithWorkers(
  scenarios: readonly ScenarioDefinition[],
  options: {
    reporter: Reporter;
    maxConcurrency: number;
    maxFailures: number;
    timeout?: number;
  },
): Promise<{ results: ScenarioResult[] }> {
  const { reporter, maxConcurrency, maxFailures, timeout } = options;

  // Build task list with file paths and indices
  const tasks = buildTaskList(scenarios);

  // Convert to metadata for reporter
  const scenariosMetadata = scenarios.map(toScenarioMetadata);
  await reporter.onRunStart?.(scenariosMetadata);

  // Create worker pool
  const concurrency = maxConcurrency > 0
    ? maxConcurrency
    : navigator.hardwareConcurrency || 4;

  await using pool = new WorkerPool(concurrency);

  const results: ScenarioResult[] = [];
  let failureCount = 0;
  let taskIdCounter = 0;

  // Execute in batches to support maxFailures
  const batches = maxConcurrency > 0 ? chunk(tasks, maxConcurrency) : [tasks];

  for (const batch of batches) {
    // Check if we should stop due to max failures
    if (maxFailures > 0 && failureCount >= maxFailures) {
      logger.debug("Stopping due to max failures", {
        failureCount,
        maxFailures,
      });
      break;
    }

    // Execute batch in parallel
    const batchPromises = batch.map(async (task) => {
      const taskId = String(taskIdCounter++);

      // Create callbacks to bridge worker events to reporter
      // Reporter now uses Metadata types directly, so we can pass through
      const callbacks: WorkerPoolEventCallbacks = {
        onScenarioStart: (scenario) => {
          reporter.onScenarioStart?.(scenario);
        },
        onStepStart: (scenario, step) => {
          reporter.onStepStart?.(scenario, step);
        },
        onStepEnd: (scenario, step, result) => {
          reporter.onStepEnd?.(scenario, step, result);
        },
        // Note: onScenarioEnd is handled below after pool.execute completes
      };

      try {
        const result = await pool.execute(
          {
            type: "run",
            taskId,
            filePath: task.filePath,
            scenarioIndex: task.scenarioIndex,
            timeout,
          },
          callbacks,
        );

        // Emit scenario end event (result.metadata is ScenarioMetadata)
        await reporter.onScenarioEnd?.(result.metadata, result);

        return result;
      } catch (error) {
        // Worker error - create failed result
        // Create ScenarioMetadata from ScenarioDefinition
        const metadata = {
          name: task.scenario.name,
          tags: task.scenario.tags,
          origin: task.scenario.origin,
          steps: task.scenario.steps.map((s) => ({
            kind: s.kind,
            name: s.name,
            timeout: s.timeout,
            retry: s.retry,
            origin: s.origin,
          })),
        };
        const errorResult: ScenarioResult = {
          status: "failed",
          metadata,
          duration: 0,
          steps: [],
          error,
        };

        await reporter.onScenarioEnd?.(metadata, errorResult);

        return errorResult;
      }
    });

    const batchResults = await Promise.all(batchPromises);

    for (const result of batchResults) {
      results.push(result);
      if (result.status === "failed") {
        failureCount++;
      }
    }
  }

  return { results };
}

/**
 * Build task list from scenarios
 *
 * Groups scenarios by file and assigns indices.
 * Origin paths are expected to be absolute (from captureStack).
 */
function buildTaskList(
  scenarios: readonly ScenarioDefinition[],
): ScenarioTask[] {
  // Group scenarios by file to assign correct indices
  const byFile = new Map<string, ScenarioDefinition[]>();

  for (const scenario of scenarios) {
    const file = scenario.origin?.path || "unknown";
    if (!byFile.has(file)) {
      byFile.set(file, []);
    }
    byFile.get(file)!.push(scenario);
  }

  // Build task list with correct indices
  const tasks: ScenarioTask[] = [];

  for (const [filePath, fileScenarios] of byFile) {
    for (let i = 0; i < fileScenarios.length; i++) {
      tasks.push({
        scenario: fileScenarios[i],
        filePath,
        scenarioIndex: i,
      });
    }
  }

  return tasks;
}
