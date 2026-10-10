/**
 * Implementation of the `probitas cache` command
 *
 * Pre-fetches native dependencies that the binary downloads on first use, for
 * CI images and machines that run scenarios offline.
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import process from "node:process";
import { EXIT_CODE } from "../constants.ts";
import {
  currentDuckdbTarget,
  defaultDuckdbCacheRoot,
  type DuckdbManifest,
  ensureDuckdb,
  getDuckdbManifest,
} from "../duckdb.ts";
import { readAsset } from "../utils.ts";

export interface CacheCommandDeps {
  manifest: DuckdbManifest | undefined;
  ensure: (manifest: DuckdbManifest) => Promise<string>;
}

const defaultDeps: CacheCommandDeps = {
  manifest: getDuckdbManifest(),
  ensure: (manifest) =>
    ensureDuckdb({
      manifest,
      target: currentDuckdbTarget(),
      cacheRoot: defaultDuckdbCacheRoot(),
      fetch: (url) => fetch(url),
      log: (message) => process.stderr.write(`${message}\n`),
    }),
};

/**
 * Execute the cache command
 *
 * @returns Exit code (0 = success, 1 = failure, 2 = usage error)
 */
export async function cacheCommand(
  args: string[],
  _cwd: string,
  deps: CacheCommandDeps = defaultDeps,
): Promise<number> {
  const parsed = parseArgs(args, {
    boolean: ["help"],
    alias: { h: "help" },
  });

  if (parsed.help) {
    console.log(await readAsset("usage-cache.txt"));
    return EXIT_CODE.SUCCESS;
  }

  const target = parsed._[0];
  if (target !== "duckdb") {
    console.error(
      target === undefined
        ? "Error: Specify what to cache (available: duckdb)"
        : `Error: Unknown cache target '${target}' (available: duckdb)`,
    );
    return EXIT_CODE.USAGE_ERROR;
  }

  if (!deps.manifest) {
    console.error(
      "Nothing to cache: running from source, DuckDB loads from node_modules",
    );
    return EXIT_CODE.SUCCESS;
  }

  try {
    const dir = await deps.ensure(deps.manifest);
    console.error(`DuckDB native binding is ready in ${dir}`);
    return EXIT_CODE.SUCCESS;
  } catch (err: unknown) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    return EXIT_CODE.FAILURE;
  }
}
