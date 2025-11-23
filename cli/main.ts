/**
 * CLI entry point for Probitas
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { EXIT_CODE } from "./constants.ts";
import { initCommand } from "./commands/init.ts";
import { listCommand } from "./commands/list.ts";
import { runCommand } from "./commands/run.ts";
import { getVersion, readAsset } from "./utils.ts";

/**
 * Main CLI handler
 *
 * Dispatches to appropriate command handler based on command name.
 *
 * @param args - Command-line arguments
 * @returns Exit code
 *
 * @requires --allow-read For loading config and scenario files
 * @requires --allow-write For init command
 */
export async function main(args: string[]): Promise<number> {
  const cwd = Deno.cwd();

  // Parse global flags
  const parsed = parseArgs(args, {
    boolean: ["help", "version"],
    alias: {
      h: "help",
      v: "version",
    },
    stopEarly: true,
  });

  // Show version
  if (parsed.version) {
    const version = await getVersion();
    console.log(`probitas ${version}`);
    return EXIT_CODE.SUCCESS;
  }

  // Show help (no command specified or --help flag)
  if (parsed.help || parsed._.length === 0) {
    try {
      const helpText = await readAsset("usage.txt");
      console.log(helpText);
      return EXIT_CODE.SUCCESS;
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : String(err);
      console.error(`Error reading help file: ${m}`);
      return EXIT_CODE.USAGE_ERROR;
    }
  }

  // Get command and its arguments
  const command = String(parsed._[0]);
  const commandArgs = parsed._.slice(1).map(String);

  // Dispatch to command handler
  switch (command) {
    case "run":
      return await runCommand(commandArgs, cwd);

    case "list":
      return await listCommand(commandArgs, cwd);

    case "init":
      return await initCommand(commandArgs, cwd);

    default:
      console.error(`Unknown command: ${command}`);
      console.error("Run 'probitas --help' for usage information");
      return EXIT_CODE.USAGE_ERROR;
  }
}
