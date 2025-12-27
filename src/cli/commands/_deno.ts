/**
 * Shared helper for Deno subcommand execution
 *
 * Used by fmt, lint, and check commands to run corresponding deno commands
 * on discovered scenario files.
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { resolve } from "@std/path";
import { getLogger, type LogLevel } from "@logtape/logtape";
import { discoverScenarioFiles } from "@probitas/discover";
import { EXIT_CODE } from "../constants.ts";
import { findProbitasConfigFile, loadConfig } from "../config.ts";
import { createDiscoveryProgress } from "../progress.ts";
import { configureLogging, readAsset } from "../utils.ts";

const logger = getLogger(["probitas", "cli", "deno"]);

/**
 * Options for running a Deno subcommand
 */
export interface DenoSubcommandOptions {
  /** Asset file name for help text */
  usageAsset: string;
  /** Extra arguments to pass to the deno command */
  extraArgs?: readonly string[];
}

/**
 * Run a Deno subcommand on discovered scenario files
 *
 * @param subcommand - Deno subcommand to run (fmt, lint, check)
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @param options - Subcommand options
 * @returns Exit code from the deno command
 */
export async function runDenoSubcommand(
  subcommand: string,
  args: string[],
  cwd: string,
  options: DenoSubcommandOptions,
): Promise<number> {
  try {
    const parsed = parseArgs(args, {
      string: ["config", "include", "exclude"],
      boolean: ["help", "quiet", "verbose", "debug"],
      collect: ["include", "exclude"],
      alias: {
        h: "help",
        v: "verbose",
        q: "quiet",
        d: "debug",
      },
      default: {
        include: undefined,
        exclude: undefined,
      },
    });

    if (parsed.help) {
      const helpText = await readAsset(options.usageAsset);
      console.log(helpText);
      return EXIT_CODE.SUCCESS;
    }

    // Determine log level
    const logLevel: LogLevel = parsed.debug
      ? "debug"
      : parsed.verbose
      ? "info"
      : parsed.quiet
      ? "fatal"
      : "warning";

    try {
      await configureLogging(logLevel);
    } catch {
      // Ignore - logging may already be configured
    }

    // Load probitas config (NOT deno.json)
    const configPath = parsed.config ??
      await findProbitasConfigFile(cwd, { parentLookup: true });
    const config = configPath ? await loadConfig(configPath) : {};

    // CLI > config
    const includes = parsed.include ?? config?.includes;
    const excludes = parsed.exclude ?? config?.excludes;

    // Discover scenario files
    const paths = parsed._.map(String).map((p) => resolve(cwd, p));
    const discoveryProgress = parsed.quiet ? null : createDiscoveryProgress();
    const scenarioFiles = await discoverScenarioFiles(
      paths.length ? paths : [cwd],
      { includes, excludes, onProgress: discoveryProgress?.onProgress },
    );
    discoveryProgress?.complete(scenarioFiles.length);

    if (scenarioFiles.length === 0) {
      console.warn("No scenario files found");
      return EXIT_CODE.NOT_FOUND;
    }

    logger.debug(`Running deno ${subcommand}`, {
      fileCount: scenarioFiles.length,
    });

    // Run deno command with --no-config
    const denoArgs = [
      subcommand,
      "--no-config",
      ...(options.extraArgs ?? []),
      ...scenarioFiles,
    ];

    const command = new Deno.Command("deno", {
      args: denoArgs,
      cwd,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });

    const { code } = await command.output();
    return code;
  } catch (err: unknown) {
    logger.error(`deno ${subcommand} failed`, { error: err });
    const m = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${m}`);
    return EXIT_CODE.FAILURE;
  }
}
