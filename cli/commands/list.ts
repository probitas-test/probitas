/**
 * Implementation of the `probitas list` command
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { resolve } from "@std/path";
import type { ScenarioDefinition } from "../../src/runner/types.ts";
import { EXIT_CODE } from "../constants.ts";
import { loadConfig } from "../config.ts";
import { discoverScenarioFiles } from "../discover.ts";
import { loadScenarios } from "../loader.ts";
import { applySelectors } from "../selector.ts";
import { findDenoConfigFile, readAsset } from "../utils.ts";

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
      boolean: ["help", "json"],
      collect: ["include", "exclude", "selector"],
      alias: {
        h: "help",
        s: "selector",
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
      } catch (err: unknown) {
        const m = err instanceof Error ? err.message : String(err);
        console.error(`Error reading help file: ${m}`);
        return EXIT_CODE.USAGE_ERROR;
      }
    }

    // Load configuration
    const configPath = parsed.config ??
      Deno.env.get("PROBITAS_CONFIG") ??
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
    const scenarios = await loadScenarios(scenarioFiles);

    // Apply selectors to filter scenarios
    const selectors = parsed.selector ?? config?.selectors ?? [];
    const filteredScenarios = applySelectors(scenarios, selectors);

    // Output results (list always succeeds even with 0 scenarios)
    if (parsed.json) {
      outputJson(filteredScenarios);
    } else {
      outputText(scenarios, filteredScenarios);
    }

    return EXIT_CODE.SUCCESS;
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    console.error(`Unexpected error: ${m}`);
    return EXIT_CODE.USAGE_ERROR;
  }
}

/**
 * Output scenarios in text format
 *
 * @param allScenarios - All scenarios (to group by file)
 * @param filteredScenarios - Filtered scenarios to display
 */
function outputText(
  allScenarios: ScenarioDefinition[],
  filteredScenarios: ScenarioDefinition[],
): void {
  // Group scenarios by file
  const byFile = new Map<string, ScenarioDefinition[]>();

  for (const scenario of allScenarios) {
    const file = scenario.location?.file || "unknown";
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
 *
 * @param scenarios - Scenarios to output
 */
function outputJson(scenarios: ScenarioDefinition[]): void {
  const output = scenarios.map((scenario) => ({
    name: scenario.name,
    tags: scenario.options.tags,
    steps: scenario.entries.filter((e) => e.kind === "step").length,
    file: scenario.location?.file || "unknown",
  }));

  console.log(JSON.stringify(output, null, 2));
}
