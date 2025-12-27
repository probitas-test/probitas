/**
 * Format command for Probitas CLI
 *
 * Runs `deno fmt --no-config` on discovered scenario files.
 *
 * @module
 */

import { runDenoSubcommand } from "./_deno.ts";

/**
 * Run the fmt command
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @returns Exit code
 */
export async function fmtCommand(
  args: string[],
  cwd: string,
): Promise<number> {
  return await runDenoSubcommand("fmt", args, cwd, {
    usageAsset: "usage-fmt.txt",
  });
}
