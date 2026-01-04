/**
 * Implementation of the `probitas list` command
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { resolve } from "@std/path";
import { getLogger, type LogLevel } from "@logtape/logtape";
import { discoverScenarioFiles } from "@probitas/discover";
import { fromErrorObject, isErrorObject } from "@core/errorutil/error-object";
import { unreachable } from "@core/errorutil/unreachable";
import { EXIT_CODE } from "../constants.ts";
import { findProbitasConfigFile, loadConfig } from "../config.ts";
import { createDiscoveryProgress, writeStatus } from "../progress.ts";
import {
  configureLogging,
  extractDenoOptions,
  loadEnvironment,
  readAsset,
} from "../utils.ts";
import {
  createNdjsonStream,
  prepareSubprocessScript,
  sendJsonInput,
  spawnDenoSubprocess,
  startIpcServer,
  waitForIpcConnection,
} from "../subprocess.ts";
import {
  isListOutput,
  type ListInput,
  type ListOutput,
  type ScenarioMeta,
} from "../_templates/list_protocol.ts";

const logger = getLogger(["probitas", "cli", "list"]);

/**
 * Execute the list command
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @returns Exit code (0 = success, 2 = usage error)
 *
 * @requires --allow-read Permission to read config and scenario files
 */
export async function listCommand(
  args: string[],
  cwd: string,
): Promise<number> {
  try {
    // Extract deno options first (before parseArgs)
    const { denoArgs, remainingArgs } = extractDenoOptions(args);

    // Parse command-line arguments
    const parsed = parseArgs(remainingArgs, {
      string: ["config", "include", "exclude", "selector", "env"],
      boolean: [
        "help",
        "json",
        "no-env",
        "reload",
        "quiet",
        "verbose",
        "debug",
      ],
      collect: ["include", "exclude", "selector"],
      alias: {
        h: "help",
        s: "selector",
        r: "reload",
        v: "verbose",
        q: "quiet",
        d: "debug",
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
        const helpText = await readAsset("usage-list.txt");
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
      logger.debug("List command started", { args, cwd, logLevel, denoArgs });
    } catch {
      // Silently ignore logging configuration errors (e.g., in test environments)
    }

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

    logger.info("Discovered scenario files", {
      count: scenarioFiles.length,
      files: scenarioFiles,
    });

    // Build selectors
    const selectors = parsed.selector ?? config?.selectors ?? [];

    // Handle empty files case
    if (scenarioFiles.length === 0) {
      logger.debug("No files specified, returning empty list");
      if (parsed.json) {
        console.log("[]");
      } else {
        console.log("\nTotal: 0 scenarios in 0 files");
      }
      return EXIT_CODE.SUCCESS;
    }

    // Load scenarios via subprocess
    // Show status during loading (only in TTY, suppressed in quiet mode)
    logger.info("Loading scenarios via subprocess", {
      fileCount: scenarioFiles.length,
    });
    const clearLoadingStatus = parsed.quiet
      ? null
      : writeStatus(`Loading scenarios (${scenarioFiles.length} files)...`);

    const { allScenarios, filteredScenarios } = await runListSubprocess(
      scenarioFiles,
      selectors,
      denoArgs,
      cwd,
    );

    clearLoadingStatus?.();

    logger.debug("Scenarios loaded", { scenarioCount: allScenarios.length });

    if (selectors && selectors.length > 0) {
      logger.debug("Applied selectors", {
        selectors,
        filteredCount: filteredScenarios.length,
      });
    }

    // Output results
    if (parsed.json) {
      outputJson(filteredScenarios);
    } else {
      outputText(allScenarios, filteredScenarios);
    }

    logger.info("List completed", {
      totalScenarios: allScenarios.length,
      filteredScenarios: filteredScenarios.length,
    });

    return EXIT_CODE.SUCCESS;
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    logger.error("Unexpected error in list command", { error: err });
    console.error(`Error: ${m}`);
    return EXIT_CODE.FAILURE;
  }
}

/**
 * Run list subprocess to load scenarios
 */
async function runListSubprocess(
  filePaths: readonly string[],
  selectors: readonly string[],
  denoArgs: string[],
  cwd: string,
): Promise<{
  allScenarios: ScenarioMeta[];
  filteredScenarios: ScenarioMeta[];
}> {
  // Start IPC server and get port
  const { listener, port } = startIpcServer();

  // Prepare subprocess script (resolve bare specifiers)
  const templateUrl = new URL("../_templates/list.ts", import.meta.url);
  const { scriptPath, tempDir } = await prepareSubprocessScript(
    templateUrl,
    "list",
  );

  // Spawn subprocess
  const proc = spawnDenoSubprocess({
    denoArgs,
    scriptPath,
    cwd,
    ipcPort: port,
  });

  // Wait for subprocess to connect (connection = ready)
  // Race against subprocess exit to detect early failures
  const ipc = await waitForIpcConnection(listener, { subprocess: proc });

  // Create NDJSON stream from IPC connection
  const outputStream = createNdjsonStream(ipc.readable, isListOutput);

  // Send list input to subprocess via IPC
  await sendJsonInput(
    ipc.writable,
    {
      filePaths,
      selectors,
    } satisfies ListInput,
  );

  try {
    // Process output messages
    for await (const output of outputStream) {
      const result = handleSubprocessOutput(output);
      if (result) {
        return result;
      }
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

/**
 * Handle subprocess output message
 */
function handleSubprocessOutput(
  output: ListOutput,
): { allScenarios: ScenarioMeta[]; filteredScenarios: ScenarioMeta[] } | void {
  switch (output.type) {
    case "result":
      // The subprocess has already applied any selector filtering, so
      // `output.scenarios` contains only scenarios that passed filtering.
      // Both allScenarios and filteredScenarios refer to this filtered set.
      // TODO: Consider returning unfiltered list from subprocess if needed.
      return {
        allScenarios: output.scenarios as ScenarioMeta[],
        filteredScenarios: output.scenarios as ScenarioMeta[],
      };

    case "error": {
      const error = isErrorObject(output.error)
        ? fromErrorObject(output.error)
        : new Error(String(output.error));
      throw error;
    }

    default:
      unreachable(output);
  }
}

/**
 * Output scenarios in text format
 */
function outputText(
  allScenarios: ScenarioMeta[],
  filteredScenarios: ScenarioMeta[],
): void {
  // Group scenarios by file
  const byFile = new Map<string, ScenarioMeta[]>();

  for (const scenario of allScenarios) {
    const file = scenario.file;
    if (!byFile.has(file)) {
      byFile.set(file, []);
    }
    byFile.get(file)!.push(scenario);
  }

  // Output grouped scenarios
  let outputCount = 0;
  for (const [file, scenariosInFile] of byFile) {
    console.log(file);
    for (const scenario of scenariosInFile) {
      if (
        filteredScenarios.some((s) =>
          s.name === scenario.name && s.file === scenario.file
        )
      ) {
        console.log(`  ${scenario.name}`);
        outputCount++;
      }
    }
  }

  console.log(
    `\nTotal: ${outputCount} scenario${
      outputCount === 1 ? "" : "s"
    } in ${byFile.size} file${byFile.size === 1 ? "" : "s"}`,
  );
}

/**
 * Output scenarios in JSON format
 */
function outputJson(scenarios: ScenarioMeta[]): void {
  const output = scenarios.map((scenario) => ({
    name: scenario.name,
    tags: scenario.tags,
    steps: scenario.steps,
    file: scenario.file,
  }));

  console.log(JSON.stringify(output, null, 2));
}
