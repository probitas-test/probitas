/**
 * Configuration file loader for Probitas
 *
 * @module
 */

import { resolve, toFileUrl } from "@std/path";
import { existsSync } from "@std/fs/exists";
import type { ProbitasConfig } from "./types.ts";

/**
 * Load configuration from file
 *
 * Searches for probitas.config.ts or probitas.config.js in the given directory.
 * Uses dynamic import to load the configuration file.
 *
 * @param cwd - Current working directory
 * @param configPath - Optional explicit config file path
 * @returns Loaded configuration or null if not found
 *
 * @requires --allow-read Permission to read config file
 */
export async function loadConfig(
  cwd: string,
  configPath?: string,
): Promise<ProbitasConfig | null> {
  let targetPath: string | null = null;

  if (configPath) {
    // Use explicit config path
    targetPath = resolve(cwd, configPath);
  } else {
    // Search for probitas.config.ts or probitas.config.js
    const searchPaths = [
      resolve(cwd, "probitas.config.ts"),
      resolve(cwd, "probitas.config.js"),
    ];

    targetPath = searchPaths.find((f) => existsSync(f)) ?? null;

    if (!targetPath) {
      return null;
    }
  }

  try {
    // Dynamic import with file:// URL
    const fileUrl = toFileUrl(targetPath);
    const module = await import(fileUrl.href);
    const config = module.default as ProbitasConfig;
    return config;
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load config file ${targetPath}: ${m}`);
  }
}
