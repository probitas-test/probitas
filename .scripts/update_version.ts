#!/usr/bin/env -S deno run -A
/**
 * Update version in deno.json
 *
 * Usage:
 *   deno run -A .scripts/update_version.ts <version>
 *   deno run -A .scripts/update_version.ts v1.2.3
 *   deno run -A .scripts/update_version.ts 1.2.3
 *
 * @module
 */

const VERSION_PATTERN = /^v?(\d+\.\d+\.\d+(?:-[\w.]+)?)$/;

function parseVersion(input: string): string {
  const match = input.match(VERSION_PATTERN);
  if (!match) {
    throw new Error(
      `Invalid version format: "${input}". Expected semver (e.g., "1.2.3" or "v1.2.3")`,
    );
  }
  return match[1];
}

async function updateVersion(version: string): Promise<void> {
  const configPath = new URL("../deno.json", import.meta.url);
  const content = await Deno.readTextFile(configPath);
  const config = JSON.parse(content);

  const oldVersion = config.version;
  config.version = version;

  await Deno.writeTextFile(
    configPath,
    JSON.stringify(config, null, 2) + "\n",
  );

  console.log(`Updated version: ${oldVersion} -> ${version}`);
}

if (import.meta.main) {
  const version = Deno.args[0];

  if (!version) {
    console.error("Usage: deno run -A .scripts/update_version.ts <version>");
    console.error("Example: deno run -A .scripts/update_version.ts v1.2.3");
    Deno.exit(1);
  }

  try {
    const parsedVersion = parseVersion(version);
    await updateVersion(parsedVersion);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    Deno.exit(1);
  }
}
