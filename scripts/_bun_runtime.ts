/**
 * Fetch the official Bun runtime that `bun build --compile` embeds
 *
 * Without `compile.executablePath`, Bun embeds the executable that is running
 * the build whenever the target matches the host. A Bun from Nix is patched to
 * use Nix's dynamic loader, so a binary compiled with it fails to load native
 * addons (DuckDB needs libstdc++) and does not run on ordinary Linux at all.
 * Embedding the upstream release for the running Bun's version keeps the
 * binary independent of how Bun was installed.
 *
 * @module
 * @internal
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { chmod, mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import process from "node:process";

const OS_NAMES: Record<string, string> = {
  darwin: "darwin",
  linux: "linux",
  windows: "windows",
};
const ARCH_NAMES: Record<string, string> = { x64: "x64", arm64: "aarch64" };

/**
 * Release archive (and the executable inside it) for a compile target such as
 * `bun-linux-x64-baseline-musl`
 *
 * @throws Error for targets this script does not know how to fetch
 */
function releaseAsset(target: string): { zip: string; entry: string } {
  const [prefix, os, arch, ...variants] = target.split("-");
  const osName = OS_NAMES[os];
  const archName = ARCH_NAMES[arch];
  const unknown = variants.filter((v) => v !== "musl" && v !== "baseline");
  if (prefix !== "bun" || !osName || !archName || unknown.length > 0) {
    throw new Error(`Unsupported compile target: ${target}`);
  }
  // Release archives spell libc before the CPU baseline.
  const name = [
    "bun",
    osName,
    archName,
    ...(variants.includes("musl") ? ["musl"] : []),
    ...(variants.includes("baseline") ? ["baseline"] : []),
  ].join("-");
  const executable = osName === "windows" ? "bun.exe" : "bun";
  return { zip: `${name}.zip`, entry: `${name}/${executable}` };
}

function hostTarget(platform: string, arch: string): string {
  return `bun-${platform === "win32" ? "windows" : platform}-${arch}`;
}

function parseChecksums(text: string): Map<string, string> {
  const sums = new Map<string, string>();
  for (const line of text.split("\n")) {
    const [hash, file] = line.trim().split(/\s+/);
    if (hash && file) sums.set(file, hash);
  }
  return sums;
}

async function download(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Return the path of the official Bun `version` runtime for `target`,
 * downloading and verifying it into `cacheDir` on first use
 *
 * @throws Error if the download fails, the checksum does not match, or
 *   `unzip` is unavailable
 */
export async function fetchBunRuntime(
  version: string,
  target: string,
  cacheDir: string,
): Promise<string> {
  const { zip, entry } = releaseAsset(target);
  const path = join(cacheDir, version, entry);
  if (existsSync(path)) return path;

  const base =
    `https://github.com/oven-sh/bun/releases/download/bun-v${version}`;
  const sums = parseChecksums(
    new TextDecoder().decode(await download(`${base}/SHASUMS256.txt`)),
  );
  const expected = sums.get(zip);
  if (!expected) throw new Error(`No checksum for ${zip} in Bun ${version}`);
  const archive = await download(`${base}/${zip}`);
  const actual = createHash("sha256").update(archive).digest("hex");
  if (actual !== expected) {
    throw new Error(`${zip} failed the sha256 check (got ${actual})`);
  }

  await mkdir(dirname(path), { recursive: true });
  const archivePath = `${path}.zip`;
  await writeFile(archivePath, archive);
  const unzip = spawnSync("unzip", ["-p", archivePath, entry], {
    maxBuffer: 512 * 1024 * 1024,
  });
  if (unzip.error || unzip.status !== 0) {
    throw new Error(
      `Failed to extract ${entry} from ${zip}: ${
        unzip.error?.message ?? unzip.stderr.toString()
      }`,
    );
  }
  await writeFile(`${path}.tmp`, unzip.stdout);
  await chmod(`${path}.tmp`, 0o755);
  await rename(`${path}.tmp`, path);
  return path;
}

export function defaultCompileTarget(): string {
  return hostTarget(process.platform, process.arch);
}

/** @internal */
export const _internal = { releaseAsset, hostTarget, parseChecksums };
