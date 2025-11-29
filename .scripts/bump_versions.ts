#!/usr/bin/env -S deno run -A
/**
 * Bump versions of all workspace packages
 *
 * Usage:
 *   deno run -A .scripts/bump_versions.ts <version>
 *   deno run -A .scripts/bump_versions.ts 0.1.0
 *   deno run -A .scripts/bump_versions.ts v0.1.0  # 'v' prefix is automatically stripped
 *
 * @module
 */

import { outdent } from "@cspotcode/outdent";
import { parse as parseSemver } from "@std/semver/parse";
import { dirname, join } from "@std/path";
import { parse as parseJsonc } from "@std/jsonc";

const ROOT_CONFIG = "deno.jsonc";

interface DenoConfig {
  workspace?: string[];
  name?: string;
  version?: string;
  [key: string]: unknown;
}

async function readConfig(path: string): Promise<DenoConfig> {
  const text = await Deno.readTextFile(path);
  return parseJsonc(text) as DenoConfig;
}

async function writeConfig(path: string, config: DenoConfig): Promise<void> {
  await Deno.writeTextFile(path, JSON.stringify(config, null, 2) + "\n");
}

function normalizeVersion(version: string): string {
  // Strip leading 'v' if present
  const normalized = version.startsWith("v") ? version.slice(1) : version;

  // Validate semver format
  try {
    parseSemver(normalized);
  } catch {
    throw new Error(
      `Invalid semver version: "${version}". Expected format: X.Y.Z (e.g., 0.1.0)`,
    );
  }

  return normalized;
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    console.log(outdent`
      Usage: deno run -A .scripts/bump_versions.ts <version>

      Bump versions of all workspace packages to the specified version.

      Arguments:
        <version>    Semver version (e.g., 0.1.0 or v0.1.0)

      Examples:
        deno run -A .scripts/bump_versions.ts 0.1.0
        deno run -A .scripts/bump_versions.ts v0.1.0
    `);
    Deno.exit(args.length === 0 ? 1 : 0);
  }

  const version = normalizeVersion(args[0]);
  console.log(`Bumping all packages to version ${version}\n`);

  // Read root config to get workspace members
  const rootConfig = await readConfig(ROOT_CONFIG);
  const workspaces = rootConfig.workspace;

  if (!workspaces || workspaces.length === 0) {
    throw new Error(`No workspaces found in ${ROOT_CONFIG}`);
  }

  // Update each workspace package
  for (const workspace of workspaces) {
    const configPath = join(workspace, "deno.json");

    try {
      const config = await readConfig(configPath);
      const oldVersion = config.version ?? "(none)";
      config.version = version;
      await writeConfig(configPath, config);

      const name = config.name ?? dirname(workspace);
      console.log(`  ${name}: ${oldVersion} -> ${version}`);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.warn(`  Warning: ${configPath} not found, skipping`);
      } else {
        throw error;
      }
    }
  }

  console.log(`\nDone! Updated ${workspaces.length} packages.`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  Deno.exit(1);
});
