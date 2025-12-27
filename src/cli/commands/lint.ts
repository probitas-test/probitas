/**
 * Lint command for Probitas CLI
 *
 * Runs `deno lint --no-config` on discovered scenario files.
 * Automatically excludes rules that conflict with scenario imports.
 *
 * @module
 */

import { runDenoSubcommand } from "./_deno.ts";

/**
 * Run the lint command
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @returns Exit code
 */
export async function lintCommand(
  args: string[],
  cwd: string,
): Promise<number> {
  return await runDenoSubcommand("lint", args, cwd, {
    usageAsset: "usage-lint.txt",
    extraArgs: ["--rules-exclude=no-import-prefix,no-unversioned-import"],
  });
}
