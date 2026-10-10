/**
 * DuckDB native binding cache
 *
 * The compiled binary does not embed DuckDB's native binding (it would add
 * about 110MB for users who never touch DuckDB). Instead the binding is
 * fetched from the npm registry on first use, verified against the sha512
 * recorded at build time, and cached per version and platform.
 *
 * @module
 * @internal
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { gunzipSync } from "node:zlib";

/**
 * Registry location of `@duckdb/node-bindings-<platform>-<arch>` for every
 * platform the binary supports, keyed by `<platform>-<arch>`
 */
export interface DuckdbManifest {
  readonly version: string;
  readonly targets: Readonly<
    Record<string, { readonly tarball: string; readonly integrity: string }>
  >;
}

/**
 * Injected by `scripts/build.ts`. Undefined when running from source, where
 * the binding comes from node_modules instead.
 */
declare const PROBITAS_DUCKDB_MANIFEST: DuckdbManifest | undefined;

export function getDuckdbManifest(): DuckdbManifest | undefined {
  return typeof PROBITAS_DUCKDB_MANIFEST === "undefined"
    ? undefined
    : PROBITAS_DUCKDB_MANIFEST;
}

/** The file that marks a complete binding directory. */
export const DUCKDB_BINDING_FILE = "duckdb.node";

/** Overrides the cache with a directory holding an extracted binding. */
export const DUCKDB_DIR_ENV = "PROBITAS_DUCKDB_DIR";

function duckdbCacheRoot(options: {
  platform: string;
  env: Readonly<Record<string, string | undefined>>;
  home: string;
}): string {
  const { platform, env, home } = options;
  if (platform === "darwin") {
    return join(home, "Library", "Caches", "probitas", "duckdb");
  }
  if (platform === "win32") {
    return join(
      env.LOCALAPPDATA ?? join(home, "AppData", "Local"),
      "probitas",
      "duckdb",
    );
  }
  return join(env.XDG_CACHE_HOME ?? join(home, ".cache"), "probitas", "duckdb");
}

export function defaultDuckdbCacheRoot(): string {
  return duckdbCacheRoot({
    platform: process.platform,
    env: process.env,
    home: homedir(),
  });
}

export function currentDuckdbTarget(): string {
  return `${process.platform}-${process.arch}`;
}

export function duckdbDir(
  manifest: DuckdbManifest,
  target: string,
  cacheRoot: string,
): string {
  return join(cacheRoot, `${manifest.version}-${target}`);
}

/**
 * @throws Error if `bytes` does not match the SRI `integrity` string
 */
function verifyIntegrity(bytes: Uint8Array, integrity: string): void {
  const [algorithm, expected] = integrity.split("-", 2);
  const actual = createHash(algorithm).update(bytes).digest("base64");
  if (actual !== expected) {
    throw new Error(
      `DuckDB binding failed the ${algorithm} integrity check (expected ${expected}, got ${actual})`,
    );
  }
}

/**
 * Extract the regular files of an npm tarball into `dest`, dropping the
 * leading `package/` directory
 *
 * npm tarballs are plain ustar archives; only the entry name, size and type
 * matter here, so a full tar implementation is not needed.
 */
async function extractTarGz(tgz: Uint8Array, dest: string): Promise<void> {
  const tar = gunzipSync(tgz);
  const decoder = new TextDecoder();
  const field = (start: number, length: number) =>
    decoder.decode(tar.subarray(start, start + length)).replace(/\0.*$/s, "");
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const name = field(offset, 100);
    if (name === "") break;
    const size = parseInt(field(offset + 124, 12).trim(), 8);
    const type = field(offset + 156, 1);
    const prefix = field(offset + 345, 155);
    const body = tar.subarray(offset + 512, offset + 512 + size);
    offset += 512 + Math.ceil(size / 512) * 512;
    if (type !== "0" && type !== "") continue;
    const path = (prefix ? `${prefix}/${name}` : name).split("/");
    const file = path[path.length - 1];
    if (path.length !== 2 || file === "" || file === "." || file === "..") {
      continue;
    }
    await writeFile(join(dest, file), body);
  }
}

export interface EnsureDuckdbOptions {
  manifest: DuckdbManifest;
  target: string;
  cacheRoot: string;
  fetch: (url: string) => Promise<Response>;
  /** Progress messages; never written to stdout, which belongs to scenarios. */
  log: (message: string) => void;
}

/**
 * Return the cached binding directory, downloading it first if needed
 *
 * The binding is extracted into a temporary sibling directory and renamed into
 * place, so concurrent workers never observe a half-written cache entry.
 *
 * @throws Error if the platform is unsupported, the download fails, or the
 *   tarball fails verification
 */
export async function ensureDuckdb(
  options: EnsureDuckdbOptions,
): Promise<string> {
  const { manifest, target, cacheRoot, fetch, log } = options;
  const dir = duckdbDir(manifest, target, cacheRoot);
  if (existsSync(join(dir, DUCKDB_BINDING_FILE))) return dir;

  const entry = manifest.targets[target];
  if (!entry) {
    throw new Error(
      `DuckDB ${manifest.version} has no native binding for ${target}`,
    );
  }

  log(
    `Downloading DuckDB ${manifest.version} (${target}) from ${entry.tarball}`,
  );
  const response = await fetch(entry.tarball);
  if (!response.ok) {
    throw new Error(
      `Failed to download ${entry.tarball}: ${response.status} ${response.statusText}`,
    );
  }
  const tgz = new Uint8Array(await response.arrayBuffer());
  verifyIntegrity(tgz, entry.integrity);
  log(
    `Downloaded ${
      (tgz.length / 1024 / 1024).toFixed(1)
    }MB, extracting to ${dir}`,
  );

  await mkdir(cacheRoot, { recursive: true });
  const staging = await mkdtemp(join(cacheRoot, ".staging-"));
  try {
    await extractTarGz(tgz, staging);
    try {
      await rename(staging, dir);
    } catch (err) {
      // Another worker finished first; its copy is just as good.
      if (!existsSync(join(dir, DUCKDB_BINDING_FILE))) throw err;
    }
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return dir;
}

/** @internal */
export const _internal = { duckdbCacheRoot, verifyIntegrity, extractTarGz };
