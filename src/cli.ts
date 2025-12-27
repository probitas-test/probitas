/**
 * CLI entry point for Probitas
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { getLogger } from "@logtape/logtape";
import { EXIT_CODE } from "./cli/constants.ts";
import { checkCommand } from "./cli/commands/check.ts";
import { fmtCommand } from "./cli/commands/fmt.ts";
import { initCommand } from "./cli/commands/init.ts";
import { lintCommand } from "./cli/commands/lint.ts";
import { listCommand } from "./cli/commands/list.ts";
import { runCommand } from "./cli/commands/run.ts";
import { getVersionInfo, readAsset } from "./cli/utils.ts";

const logger = getLogger(["probitas", "cli"]);

/**
 * Main CLI handler
 *
 * Dispatches to appropriate command handler based on command name.
 *
 * @param args - Command-line arguments
 * @returns Exit code
 *
 * @requires --allow-read For loading config and scenario files
 */
export async function main(args: string[]): Promise<number> {
  const cwd = Deno.cwd();

  // Parse global flags
  const parsed = parseArgs(args, {
    boolean: ["help", "version"],
    alias: {
      h: "help",
      V: "version",
    },
    stopEarly: true,
  });

  // Show version
  if (parsed.version) {
    const info = await getVersionInfo();
    if (info) {
      console.log(`probitas ${info.version}`);
      for (const pkg of info.packages) {
        console.log(`  ${pkg.name} ${pkg.version}`);
      }
    } else {
      console.log("probitas unknown");
    }
    return EXIT_CODE.SUCCESS;
  }

  // Show help (no command specified or --help flag)
  if (parsed.help || parsed._.length === 0) {
    try {
      const helpText = await readAsset("usage.txt");
      console.log(helpText);
      return EXIT_CODE.SUCCESS;
    } catch (err: unknown) {
      logger.error("Failed to read help file", { error: err });
      return EXIT_CODE.USAGE_ERROR;
    }
  }

  // Get command and its arguments
  const command = String(parsed._[0]);
  const commandArgs = parsed._.slice(1).map(String);

  // Dispatch to command handler
  switch (command) {
    case "init":
      return await initCommand(commandArgs, cwd);

    case "run":
      return await runCommand(commandArgs, cwd);

    case "list":
      return await listCommand(commandArgs, cwd);

    case "fmt":
      return await fmtCommand(commandArgs, cwd);

    case "lint":
      return await lintCommand(commandArgs, cwd);

    case "check":
      return await checkCommand(commandArgs, cwd);

    default:
      console.warn(`Unknown command: ${command}`);
      console.warn("Run 'probitas --help' for usage information");
      return EXIT_CODE.USAGE_ERROR;
  }
}

// CLI entry point when run directly
if (import.meta.main) {
  const exitCode = await main(Deno.args);
  Deno.exit(exitCode);
}
