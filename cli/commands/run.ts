/**
 * Implementation of the `probitas run` command
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { resolve } from "@std/path";
import { ScenarioRunner } from "../../src/runner/scenario_runner.ts";
import type { RunOptions } from "../../src/runner/types.ts";
import type { ReporterOptions } from "../../src/reporter/types.ts";
import { EXIT_CODE } from "../constants.ts";
import { loadConfig } from "../config.ts";
import { discoverScenarioFiles } from "../discover.ts";
import { loadScenarios } from "../loader.ts";
import { applySelectors } from "../selector.ts";
import {
  findDenoConfigFile,
  parsePositiveInteger,
  readAsset,
  resolveReporter,
} from "../utils.ts";

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
      ],
      boolean: [
        "help",
        "no-color",
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
        console.error(
          "Error reading help file:",
          error instanceof Error ? error.message : String(error),
        );
        return EXIT_CODE.USAGE_ERROR;
      }
    }

    // Determine verbosity level
    const verbosity = parsed.debug
      ? "debug"
      : parsed.verbose
      ? "verbose"
      : parsed.quiet
      ? "quiet"
      : "normal";

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
    if (scenarios.length === 0) {
      console.error("No scenarios found");
      return EXIT_CODE.NOT_FOUND;
    }

    // Apply selectors to filter scenarios
    const selectors = parsed.selector ?? config?.selectors ?? [];
    const filteredScenarios = applySelectors(scenarios, selectors);
    if (filteredScenarios.length === 0) {
      console.error("No scenarios matched the filter");
      return EXIT_CODE.NOT_FOUND;
    }

    // Build run options
    const noColor = parsed["no-color"] || Deno.noColor;
    const reporterOptions: ReporterOptions = {
      noColor,
      verbosity,
    };

    const reporter = resolveReporter(
      parsed.reporter ?? config?.reporter,
      reporterOptions,
    );

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

    const runOptions: RunOptions = {
      reporter,
      maxConcurrency,
      maxFailures,
    };

    // Run scenarios
    const runner = new ScenarioRunner();
    const summary = await runner.run(filteredScenarios, runOptions);

    // Return exit code
    return summary.failed > 0 ? EXIT_CODE.FAILURE : EXIT_CODE.SUCCESS;
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    console.error(`Unexpected error: ${m}`);
    return EXIT_CODE.USAGE_ERROR;
  }
}
