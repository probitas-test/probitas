/**
 * Build the release archives of the CLI for every supported platform
 *
 * Usage: bun scripts/package_release.ts [--out <dir>] [--target <bun-target>]...
 *
 *   --out     Output directory (default: out/release)
 *   --target  Build only these compile targets (default: all released ones)
 *
 * Writes `probitas-<os>-<arch>.tar.gz` (`.zip` on Windows) plus a
 * `SHA256SUMS` file in `sha256sum` format. `install.sh`, the Homebrew formula
 * and setup-probitas download these names, so they are part of the
 * distribution contract.
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";

/** Compile targets published with each release. */
const RELEASE_TARGETS = [
  "bun-darwin-arm64",
  "bun-darwin-x64",
  "bun-linux-arm64",
  "bun-linux-x64",
  "bun-windows-x64",
];

interface ReleaseArtifact {
  archive: string;
  executable: string;
  format: "tar.gz" | "zip";
}

/**
 * @throws Error for targets that are not part of the release
 */
function releaseArtifact(target: string): ReleaseArtifact {
  if (!RELEASE_TARGETS.includes(target)) {
    throw new Error(`Not a release target: ${target}`);
  }
  const platform = target.replace(/^bun-/, "");
  const windows = platform.startsWith("windows-");
  return {
    archive: `probitas-${platform}.${windows ? "zip" : "tar.gz"}`,
    executable: windows ? "probitas.exe" : "probitas",
    format: windows ? "zip" : "tar.gz",
  };
}

function formatChecksums(sums: Map<string, string>): string {
  return [...sums]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, hash]) => `${hash}  ${file}\n`)
    .join("");
}

function run(command: string, args: string[], cwd?: string): void {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} exited with ${result.status}`,
    );
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2), {
    string: ["out", "target"],
    collect: ["target"],
  });
  const root = join(import.meta.dir, "..");
  const out = resolve(args.out ?? join(root, "out", "release"));
  const targets = (args.target as string[]).length > 0
    ? (args.target as string[])
    : RELEASE_TARGETS;
  // Validate every target before touching the filesystem.
  const builds = targets.map((target) => ({
    target,
    artifact: releaseArtifact(target),
  }));

  // Remove only the files this script owns: `--out` may name a directory that
  // holds other things, while a stale archive from an earlier, wider run would
  // be missing from the new SHA256SUMS.
  await mkdir(out, { recursive: true });
  for (const target of RELEASE_TARGETS) {
    await rm(join(out, releaseArtifact(target).archive), { force: true });
  }
  await rm(join(out, "SHA256SUMS"), { force: true });
  const sums = new Map<string, string>();
  for (const { target, artifact } of builds) {
    const staging = await mkdtemp(join(out, ".staging-"));
    try {
      run(process.execPath, [
        join(root, "scripts", "compile.ts"),
        "--target",
        target,
        "--outfile",
        join(staging, artifact.executable),
      ]);
      const archivePath = join(out, artifact.archive);
      if (artifact.format === "zip") {
        run("zip", ["-q", "-j", archivePath, artifact.executable], staging);
      } else {
        // macOS tar would otherwise record Apple xattrs that GNU tar warns about.
        run("tar", [
          "--no-xattrs",
          "-czf",
          archivePath,
          "-C",
          staging,
          artifact.executable,
        ]);
      }
      const hash = createHash("sha256")
        .update(await readFile(archivePath))
        .digest("hex");
      sums.set(artifact.archive, hash);
      console.log(`packed ${artifact.archive}`);
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  }
  await writeFile(join(out, "SHA256SUMS"), formatChecksums(sums));
  console.log(`wrote ${join(out, "SHA256SUMS")}`);
}

if (import.meta.main) await main();

/** @internal */
export const _internal = { releaseArtifact, formatChecksums };
