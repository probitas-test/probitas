/**
 * Type-check command for Probitas CLI
 *
 * Runs `deno check --no-config` on discovered scenario files.
 *
 * @module
 */

import { runDenoSubcommand } from "./_deno.ts";

/**
 * Run the check command
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @returns Exit code
 */
export async function checkCommand(
  args: string[],
  cwd: string,
): Promise<number> {
  return await runDenoSubcommand("check", args, cwd, {
    usageAsset: "usage-check.txt",
  });
}
