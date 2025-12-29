/**
 * Implementation of the `probitas list` command
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { resolve } from "@std/path";
import { getLogger, type LogLevel } from "@logtape/logtape";
import { discoverScenarioFiles } from "@probitas/discover";
import type { ScenarioDefinition } from "@probitas/core";
import { applySelectors } from "@probitas/core/selector";
import { EXIT_CODE } from "../constants.ts";
import { findProbitasConfigFile, loadConfig } from "../config.ts";
import { createDiscoveryProgress, writeStatus } from "../progress.ts";
import {
  configureLogging,
  extractDenoArgs,
  loadEnvironment,
  readAsset,
} from "../utils.ts";
import { TemplateProcessor } from "./subprocess/template_processor.ts";

const logger = getLogger(["probitas", "cli", "list"]);

/**
 * Load scenarios via subprocess
 *
 * This allows scenarios to be loaded with correct deno.json/deno.lock
 */
async function loadScenariosViaSubprocess(
  files: string[],
  options: {
    denoArgs: string[];
    onImportError?: (file: string, error: unknown) => void;
  },
): Promise<ScenarioDefinition[]> {
  // Get processed loader path
  await using templateProcessor = new TemplateProcessor();
  const loaderPath = await templateProcessor.getEntryPointPath("loader.ts");

  const args = [
    "run",
    "--allow-all",
    "--unstable-kv", // Enable Deno KV by default
    ...options.denoArgs,
    loaderPath,
  ];

  logger.debug("Spawning loader subprocess", {
    command: "deno",
    args,
  });

  const command = new Deno.Command("deno", {
    args,
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });

  const process = command.spawn();

  // Send file list to stdin
  const writer = process.stdin.getWriter();
  const input = { files };
  const json = JSON.stringify(input) + "\n";
  await writer.write(new TextEncoder().encode(json));
  await writer.close();

  // Read output from stdout
  const output = await process.output();
  const result = JSON.parse(new TextDecoder().decode(output.stdout));

  if (result.type === "error") {
    if (options.onImportError && result.file) {
      options.onImportError(result.file, result.error);
    }
    throw new Error(result.error);
  }

  if (result.type !== "success") {
    throw new Error("Invalid loader output format");
  }

  return result.scenarios;
}

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
    // Extract --deno-XXXXX options before parsing
    const denoArgs = extractDenoArgs(args);

    // Parse command-line arguments
    const parsed = parseArgs(args, {
      string: ["config", "include", "exclude", "selector", "env"],
      boolean: [
        "help",
        "json",
        "no-env",
        "quiet",
        "verbose",
        "debug",
      ],
      collect: ["include", "exclude", "selector"],
      alias: {
        h: "help",
        s: "selector",
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
      logger.debug("List command started", { args, cwd, logLevel });
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

    // Load scenarios via subprocess (to ensure correct deno.json/deno.lock)
    // Show status during loading (only in TTY, suppressed in quiet mode)
    logger.info("Loading scenarios", { fileCount: scenarioFiles.length });
    const clearLoadingStatus = parsed.quiet
      ? null
      : writeStatus(`Loading scenarios (${scenarioFiles.length} files)...`);

    const scenarios = await loadScenariosViaSubprocess(scenarioFiles, {
      denoArgs,
      onImportError: (file, err) => {
        const m = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to load scenario from ${file}: ${m}`);
      },
    });
    clearLoadingStatus?.();

    logger.debug("Scenarios loaded", { scenarioCount: scenarios.length });

    // Apply selectors to filter scenarios
    const filteredScenarios = selectors && selectors.length > 0
      ? applySelectors(scenarios, selectors)
      : scenarios;

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
      outputText(scenarios, filteredScenarios);
    }

    logger.info("List completed", {
      totalScenarios: scenarios.length,
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
 * Output scenarios in text format
 */
function outputText(
  allScenarios: ScenarioDefinition[],
  filteredScenarios: ScenarioDefinition[],
): void {
  // Group scenarios by file
  const byFile = new Map<string, ScenarioDefinition[]>();

  for (const scenario of allScenarios) {
    const file = scenario.origin?.path || "unknown";
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
      if (filteredScenarios.includes(scenario)) {
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
function outputJson(scenarios: ScenarioDefinition[]): void {
  const output = scenarios.map((scenario) => ({
    name: scenario.name,
    tags: scenario.tags,
    steps: scenario.steps.filter((e) => e.kind === "step").length,
    file: scenario.origin?.path || "unknown",
  }));

  console.log(JSON.stringify(output, null, 2));
}
