/**
 * Type-check command for Probitas CLI
 *
 * Runs `bun check`, the TypeScript checker built into the embedded Bun. With
 * a `tsconfig.json` in the working directory the project's own settings win;
 * without one, the discovered scenario files are checked with options
 * matching how the worker loads them.
 *
 * @module
 */

import { tmpdir } from "node:os";
import { join } from "node:path";
import { EXIT_CODE } from "../constants.ts";
import { exists } from "../_fs.ts";
import { runToolCommand } from "./_tool.ts";

function buildCheckArgs(
  options: { cwd: string; tsconfig?: string; files: readonly string[] },
): string[] {
  // `--cwd` keeps error paths relative to the project while the process
  // itself starts elsewhere (see checkCommand).
  const base = ["check", `--cwd=${options.cwd}`];
  if (options.tsconfig) {
    return [...base, "-p", options.tsconfig];
  }
  return [
    ...base,
    "--strict",
    "--skipLibCheck",
    "--target=ESNext",
    "--module=Preserve",
    "--moduleResolution=bundler",
    "--allowImportingTsExtensions",
    ...options.files,
  ];
}

/** @internal */
export const _internal = { buildCheckArgs };

/**
 * Run the check command
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @returns Exit code from the type checker
 */
export async function checkCommand(
  args: string[],
  cwd: string,
): Promise<number> {
  return await runToolCommand(args, cwd, {
    name: "check",
    async plan({ discover }) {
      // `bun check` started next to a package.json with a "check" script
      // runs that script instead, so start it from the temp directory.
      const tsconfig = join(cwd, "tsconfig.json");
      if (await exists(tsconfig)) {
        return {
          args: buildCheckArgs({ cwd, tsconfig, files: [] }),
          cwd: tmpdir(),
        };
      }
      const files = await discover();
      if (!files) return EXIT_CODE.NOT_FOUND;
      return { args: buildCheckArgs({ cwd, files }), cwd: tmpdir() };
    },
  });
}
