/**
 * Configuration file loader for Probitas
 *
 * @module
 */

import { dirname, resolve } from "@std/path";
import { parse as parseJsonc } from "@std/jsonc";
import { exists } from "@std/fs";
import { ensure, is } from "@core/unknownutil";
import { getLogger } from "@probitas/logger";
import type { ProbitasConfig } from "./types.ts";

const logger = getLogger("probitas", "cli", "config");

const isStringArray = is.ArrayOf(is.String);
const isReporter = is.LiteralOneOf(["dot", "list", "json", "tap"] as const);

const isProbitasConfig = is.PartialOf(is.ObjectOf({
  reporter: isReporter,
  includes: isStringArray,
  excludes: isStringArray,
  selectors: isStringArray,
  maxConcurrency: is.Number,
  maxFailures: is.Number,
  timeout: is.String,
}));

/**
 * Probitas config file candidates in priority order
 */
const CONFIG_FILE_NAMES = [
  "probitas.json",
  "probitas.jsonc",
  ".probitas.json",
  ".probitas.jsonc",
] as const;

/**
 * Options for findProbitasConfigFile
 */
export interface FindProbitasConfigFileOptions {
  /** Recursively search parent directories */
  parentLookup?: boolean;
}

/**
 * Find Probitas configuration file in the given directory
 *
 * Search order (per directory):
 * 1. probitas.json
 * 2. probitas.jsonc
 * 3. .probitas.json
 * 4. .probitas.jsonc
 *
 * @param path - Directory to search in
 * @param options - Search options
 * @returns Absolute path to config file, or undefined if not found
 */
export async function findProbitasConfigFile(
  path: string,
  options?: FindProbitasConfigFileOptions,
): Promise<string | undefined> {
  logger.debug("Searching for probitas config file", {
    startPath: path,
    parentLookup: options?.parentLookup ?? false,
  });

  let currentDir = resolve(path);

  while (true) {
    for (const fileName of CONFIG_FILE_NAMES) {
      const searchPath = resolve(currentDir, fileName);
      if (await exists(searchPath)) {
        logger.debug("Found probitas config file", { configPath: searchPath });
        return searchPath;
      }
    }

    // Stop if parentLookup is disabled or we've reached the root
    if (!options?.parentLookup) {
      logger.debug("Config file not found, parentLookup disabled");
      return undefined;
    }

    const parent = dirname(currentDir);
    if (parent === currentDir) {
      // Reached filesystem root
      logger.debug("Config file not found, reached filesystem root");
      return undefined;
    }

    currentDir = parent;
  }
}

/**
 * Load Probitas configuration from a probitas config file
 *
 * The configuration should be at root level (not nested under "probitas" key).
 *
 * @param configPath - Path to probitas.json, probitas.jsonc, .probitas.json, or .probitas.jsonc
 * @returns Probitas configuration
 *
 * @requires --allow-read Permission to read config file
 *
 * @example
 * const config = await loadConfig("/project/probitas.json");
 */
export async function loadConfig(
  configPath: string,
): Promise<ProbitasConfig> {
  logger.debug("Loading config file", { configPath });

  const content = await Deno.readTextFile(configPath);
  const parsed = parseJsonc(content);
  const config = ensure(parsed, isProbitasConfig);

  logger.debug("Config loaded", {
    configPath,
    config,
  });

  return config;
}
