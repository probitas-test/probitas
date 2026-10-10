/**
 * Write `nix/release.json`, which pins the Nix package (`nix/probitas.nix`)
 * to a GitHub Release: its version and the sha256 of each archive the
 * package installs, taken from the release's SHA256SUMS.
 *
 * Usage: bun scripts/nix_release.ts --version <version> --checksums <SHA256SUMS> [--out nix/release.json]
 *
 * @module
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";

/** Release platforms the Nix package supports (Windows is not one). */
const NIX_PLATFORMS = [
  "darwin-arm64",
  "darwin-x64",
  "linux-arm64",
  "linux-x64",
] as const;

interface NixRelease {
  version: string;
  sha256: Record<string, string>;
}

function buildNixRelease(version: string, checksums: string): NixRelease {
  const byArchive = new Map<string, string>();
  for (const line of checksums.split("\n")) {
    const match = line.match(/^([0-9a-f]{64})\s+\*?(\S+)$/);
    if (match) byArchive.set(match[2], match[1]);
  }
  const sha256: Record<string, string> = {};
  const missing: string[] = [];
  for (const platform of NIX_PLATFORMS) {
    const hash = byArchive.get(`probitas-${platform}.tar.gz`);
    if (hash) sha256[platform] = hash;
    else missing.push(platform);
  }
  if (missing.length > 0) {
    throw new Error(`SHA256SUMS has no archive for ${missing.join(", ")}`);
  }
  return { version, sha256 };
}

/** @internal */
export const _internal = { buildNixRelease };

if (import.meta.main) {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      version: { type: "string" },
      checksums: { type: "string" },
      out: {
        type: "string",
        default: join(import.meta.dir, "..", "nix", "release.json"),
      },
    },
  });
  if (!values.version || !values.checksums) {
    console.error(
      "usage: bun scripts/nix_release.ts --version <version> --checksums <SHA256SUMS> [--out <file>]",
    );
    process.exit(1);
  }
  const release = buildNixRelease(
    values.version,
    readFileSync(values.checksums, "utf8"),
  );
  writeFileSync(values.out, `${JSON.stringify(release, null, 2)}\n`);
  console.log(`wrote ${values.out} (${release.version})`);
}
