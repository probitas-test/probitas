/**
 * Pin flake.nix to Bun's latest release: its version and the hash of every
 * platform's release asset, prefetched with Nix.
 *
 * Under GitHub Actions the new version is written to `$GITHUB_OUTPUT` as
 * `version`, empty when flake.nix already pins the latest release.
 *
 * Usage: bun scripts/update_bun.ts
 *
 * @module
 */

import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { pinBun, readBunPin } from "./_bun_pin.ts";

const flakePath = join(import.meta.dir, "..", "flake.nix");

async function latestVersion(): Promise<string> {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(
    "https://api.github.com/repos/oven-sh/bun/releases/latest",
    {
      headers: {
        accept: "application/vnd.github+json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Bun's latest release: HTTP ${response.status}`);
  }
  const { tag_name: tag } = await response.json();
  const version = /^bun-v(.+)$/.exec(tag)?.[1];
  if (version === undefined) {
    throw new Error(`Bun's latest release has an unexpected tag: ${tag}`);
  }
  return version;
}

function prefetch(url: string): string {
  const result = Bun.spawnSync(
    ["nix", "store", "prefetch-file", "--json", url],
    { stderr: "inherit" },
  );
  if (!result.success) {
    throw new Error(`nix store prefetch-file ${url} failed`);
  }
  return JSON.parse(result.stdout.toString()).hash;
}

function output(version: string): void {
  const path = process.env.GITHUB_OUTPUT;
  if (path) appendFileSync(path, `version=${version}\n`);
}

const flake = readFileSync(flakePath, "utf8");
const pin = readBunPin(flake);
const version = await latestVersion();
if (version === pin.version) {
  console.log(`flake.nix already pins Bun ${version}`);
  output("");
} else {
  const hashes = Object.fromEntries(
    pin.assets.map((asset) => [
      asset,
      prefetch(
        `https://github.com/oven-sh/bun/releases/download/bun-v${version}/${asset}`,
      ),
    ]),
  );
  writeFileSync(flakePath, pinBun(flake, version, hashes));
  console.log(`Pinned flake.nix to Bun ${version} (was ${pin.version})`);
  output(version);
}
