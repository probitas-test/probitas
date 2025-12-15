/**
 * Implementation of the `probitas list` command
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { resolve } from "@std/path";
import { configureLogging, getLogger, type LogLevel } from "@probitas/logger";
import { discoverScenarioFiles } from "@probitas/discover";
import type { ScenarioDefinition } from "@probitas/core";
import { loadScenarios } from "@probitas/core/loader";
import { applySelectors } from "@probitas/core/selector";
import { EXIT_CODE } from "../constants.ts";
import { findProbitasConfigFile, loadConfig } from "../config.ts";
import { readAsset } from "../utils.ts";

const logger = getLogger("probitas", "cli", "list");

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
    // Parse command-line arguments
    const parsed = parseArgs(args, {
      string: ["config", "include", "exclude", "selector"],
      boolean: ["help", "json", "reload", "quiet", "verbose", "debug"],
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
      logger.debug("List command started", { args, cwd, logLevel });
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

    // Load scenarios
    logger.info("Loading scenarios", { fileCount: scenarioFiles.length });

    const scenarios = await loadScenarios(scenarioFiles, {
      onImportError: (file, err) => {
        const m = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to load scenario from ${file}: ${m}`);
      },
    });

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
    const file = scenario.source?.file || "unknown";
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
    file: scenario.source?.file || "unknown",
  }));

  console.log(JSON.stringify(output, null, 2));
}
