/**
 * Implementation of the `probitas list` command
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import type { ScenarioDefinition } from "../../src/runner/types.ts";
import { EXIT_CODE } from "../constants.ts";
import { loadConfig } from "../config.ts";
import { loadScenarios } from "../loader.ts";
import { applySelectors } from "../selector.ts";
import type { ProbitasConfig } from "../types.ts";
import { readAsset } from "../utils.ts";

/**
 * Options for the list command
 */
export interface ListCommandOptions {
  selectors?: string[];
  json?: boolean;
  config?: string;
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
    // Parse command-line arguments
    const parsed = parseArgs(args, {
      string: ["config", "selector"],
      boolean: ["help", "json"],
      collect: ["selector"],
      alias: {
        h: "help",
        s: "selector",
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

    // Read environment variables (lower priority than CLI args)
    const envConfig = {
      config: Deno.env.get("PROBITAS_CONFIG"),
    };

    // Priority: CLI args > env vars > defaults
    const options: ListCommandOptions = {
      selectors: parsed.selector,
      json: parsed.json,
      config: parsed.config || envConfig.config,
    };

    // Load configuration
    const config = await loadConfig(cwd, options.config);
    const mergedConfig = { ...config } as ProbitasConfig;

    // Load scenarios
    const scenarios = await loadScenarios(cwd, {
      includes: mergedConfig.includes,
      excludes: mergedConfig.excludes,
    });

    // Apply selectors to filter scenarios
    const selectors = options.selectors && options.selectors.length > 0
      ? options.selectors
      : mergedConfig.selectors || [];

    const filteredScenarios = applySelectors(scenarios, selectors);

    // Output results
    if (options.json) {
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
    steps: scenario.steps.length,
    file: scenario.location?.file || "unknown",
  }));

  console.log(JSON.stringify(output, null, 2));
}
