/**
 * Build the single-binary CLI
 *
 * Usage: bun scripts/build.ts [--target <bun-target>] [--outfile <path>]
 *
 *   --target   A `bun build --compile` target such as `bun-linux-x64`;
 *              defaults to the host platform
 *   --outfile  Defaults to `dist/probitas` (`.exe` appended on Windows)
 *
 * Besides compiling, the build records two facts the binary cannot discover
 * at run time: the versions of the embedded @probitas-test packages (for
 * `--version`), and where to fetch DuckDB's native binding from together with
 * its checksum (the binding is downloaded on first use, not embedded).
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import process from "node:process";
import type { DuckdbManifest } from "../src/cli/duckdb.ts";
import { getVersionInfo } from "../src/cli/utils.ts";

/** Platforms `@duckdb/node-bindings` publishes a native binding for. */
const DUCKDB_TARGETS = [
  "darwin-arm64",
  "darwin-x64",
  "linux-arm64",
  "linux-x64",
  "win32-x64",
];

const root = join(import.meta.dir, "..");

async function readDuckdbBindingsVersion(): Promise<string> {
  const require = createRequire(join(root, "package.json"));
  const client = require.resolve(
    "@probitas-test/client-sql-duckdb/package.json",
  );
  const api = createRequire(client).resolve("@duckdb/node-api/package.json");
  const manifest = JSON.parse(await readFile(api, "utf8"));
  const version = manifest.dependencies?.["@duckdb/node-bindings"];
  if (typeof version !== "string" || !/^\d/.test(version)) {
    throw new Error(
      `Expected @duckdb/node-api to pin @duckdb/node-bindings, got ${version}`,
    );
  }
  return version;
}

async function buildDuckdbManifest(): Promise<DuckdbManifest> {
  const version = await readDuckdbBindingsVersion();
  const targets: Record<string, { tarball: string; integrity: string }> = {};
  for (const target of DUCKDB_TARGETS) {
    const url =
      `https://registry.npmjs.org/@duckdb/node-bindings-${target}/${version}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    const { dist } = await response.json() as {
      dist: { tarball: string; integrity: string };
    };
    targets[target] = { tarball: dist.tarball, integrity: dist.integrity };
  }
  return { version, targets };
}

async function readPackageVersions(): Promise<Record<string, string>> {
  const info = await getVersionInfo();
  if (!info) throw new Error("Failed to read embedded package versions");
  return Object.fromEntries(info.packages.map((p) => [p.name, p.version]));
}

const args = parseArgs(process.argv.slice(2), {
  string: ["target", "outfile"],
});
const target = args.target as Bun.Build.CompileTarget | undefined;
const windows = target
  ? target.includes("windows")
  : process.platform === "win32";
const outfile = args.outfile ??
  (windows ? "dist/probitas.exe" : "dist/probitas");

const [duckdb, versions] = await Promise.all([
  buildDuckdbManifest(),
  readPackageVersions(),
]);

const duckdbBindings = join(root, "src/cli/_duckdb_bindings.ts");
const result = await Bun.build({
  entrypoints: [join(root, "src/cli.ts")],
  compile: { outfile, ...(target ? { target } : {}) },
  define: {
    PROBITAS_DUCKDB_MANIFEST: JSON.stringify(duckdb),
    PROBITAS_PACKAGE_VERSIONS: JSON.stringify(versions),
  },
  plugins: [{
    name: "duckdb-on-demand",
    setup(build) {
      build.onResolve({ filter: /^@duckdb\/node-bindings$/ }, () => ({
        path: duckdbBindings,
      }));
    },
  }],
});

for (const log of result.logs) console.error(String(log));
if (!result.success) process.exit(1);
console.log(`built ${outfile} (${target ?? "host"}, DuckDB ${duckdb.version})`);
