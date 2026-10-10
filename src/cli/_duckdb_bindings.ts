/**
 * Stand-in for `@duckdb/node-bindings` inside the compiled binary
 *
 * `scripts/compile.ts` resolves `@duckdb/node-bindings` here. The DuckDB client
 * imports `@duckdb/node-api` only when a client is created, so this runs only
 * for scenarios that use DuckDB. A cache miss runs `probitas cache duckdb`
 * synchronously because `@duckdb/node-api` loads the binding with a
 * synchronous `require`.
 *
 * @module
 * @internal
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import {
  currentDuckdbTarget,
  defaultDuckdbCacheRoot,
  DUCKDB_BINDING_FILE,
  DUCKDB_DIR_ENV,
  duckdbDir,
  getDuckdbManifest,
} from "./duckdb.ts";

function resolveBindingDir(): string {
  const override = process.env[DUCKDB_DIR_ENV];
  if (override) return override;
  const manifest = getDuckdbManifest();
  if (!manifest) {
    throw new Error("This build of probitas does not support DuckDB");
  }
  const dir = duckdbDir(
    manifest,
    currentDuckdbTarget(),
    defaultDuckdbCacheRoot(),
  );
  if (!existsSync(join(dir, DUCKDB_BINDING_FILE))) {
    // stdout belongs to the scenario; progress goes to stderr.
    const { status } = spawnSync(process.execPath, ["cache", "duckdb"], {
      stdio: ["ignore", 2, 2],
    });
    if (status !== 0) {
      throw new Error(
        `Failed to download the DuckDB native binding (run 'probitas cache duckdb' for details, or set ${DUCKDB_DIR_ENV})`,
      );
    }
  }
  return dir;
}

function loadBinding(): Record<string, unknown> {
  const binding = { exports: {} as Record<string, unknown> };
  process.dlopen(binding, join(resolveBindingDir(), DUCKDB_BINDING_FILE));
  return binding.exports;
}

module.exports = loadBinding();
