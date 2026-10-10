/**
 * Where to download DuckDB's native binding for each platform, and its
 * checksum, taken from bun.lock: `bun install --os='*' --cpu='*'` locks every
 * platform's binding, so the build needs no registry access (and the Nix
 * build has none).
 *
 * @module
 */

import type { DuckdbManifest } from "../src/cli/duckdb.ts";

/** The shape of bun.lock this module reads. */
export interface LockfilePackages {
  readonly packages: Readonly<Record<string, readonly unknown[]>>;
}

export function duckdbManifestFromLock(
  lock: LockfilePackages,
  version: string,
  targets: readonly string[],
): DuckdbManifest {
  const manifest: Record<string, { tarball: string; integrity: string }> = {};
  for (const target of targets) {
    const name = `@duckdb/node-bindings-${target}`;
    const [spec, , , integrity] = lock.packages[name] ?? [];
    if (spec !== `${name}@${version}` || typeof integrity !== "string") {
      throw new Error(
        `bun.lock does not lock ${name}@${version} (found ${String(spec)})`,
      );
    }
    manifest[target] = {
      tarball:
        `https://registry.npmjs.org/${name}/-/node-bindings-${target}-${version}.tgz`,
      integrity,
    };
  }
  return { version, targets: manifest };
}
