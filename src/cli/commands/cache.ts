/**
 * Cache command for Probitas CLI
 *
 * Runs `deno cache` on discovered scenario files to pre-download dependencies.
 *
 * @module
 */

import { runDenoSubcommand } from "./_deno.ts";

/**
 * Run the cache command
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @returns Exit code
 */
export async function cacheCommand(
  args: string[],
  cwd: string,
): Promise<number> {
  return await runDenoSubcommand("cache", args, cwd, {
    usageAsset: "usage-cache.txt",
    supportReload: true,
    useConfig: true,
  });
}
