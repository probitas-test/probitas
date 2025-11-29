/**
 * Utility functions for CLI
 *
 * @module
 */

import { as, ensure, is, type Predicate } from "@core/unknownutil";
import { exists } from "@std/fs/exists";
import { parse as parseJsonc } from "@std/jsonc";
import { dirname, resolve, toFileUrl } from "@std/path";
import {
  DotReporter,
  JSONReporter,
  ListReporter,
  TAPReporter,
} from "@probitas/reporter";
import type { Reporter, ReporterOptions } from "@probitas/reporter";

type DenoConfig = {
  imports?: Record<string, string>;
};

const isDenoConfig = is.ObjectOf({
  imports: as.Optional(is.RecordOf(is.String, is.String)),
}) satisfies Predicate<DenoConfig>;

const reporterMap: Record<string, (opts?: ReporterOptions) => Reporter> = {
  list: (opts) => new ListReporter(opts),
  dot: (opts) => new DotReporter(opts),
  json: (opts) => new JSONReporter(opts),
  tap: (opts) => new TAPReporter(opts),
};

/**
 * Resolve reporter by name
 *
 * @param reporter - Reporter name (dot/list/json/tap) or undefined for default
 * @param options - Optional reporter options
 * @returns Reporter instance
 */
export function resolveReporter(
  reporter: string | undefined,
  options?: ReporterOptions,
): Reporter {
  if (!reporter) {
    return new ListReporter(options);
  }

  const factory = reporterMap[reporter];
  if (!factory) {
    throw new Error(`Unknown reporter: ${reporter}`);
  }

  return factory(options);
}

/**
 * Parse positive integer option
 *
 * @param value - Value to parse
 * @param name - Option name for error messages
 * @returns Parsed integer or undefined if not set
 */
export function parsePositiveInteger(
  value: string | number | undefined,
  name: string = "value",
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const num = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(num) || num < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return num;
}

/**
 * Read template file from assets/templates
 *
 * @param filename - Template filename
 * @returns Template content
 */
export async function readTemplate(filename: string): Promise<string> {
  return await readAsset(`templates/${filename}`);
}

/**
 * Read asset file from assets directory
 *
 * @param path - Asset path relative to assets/ (e.g., "usage.txt", "templates/deno.json")
 * @returns Asset content
 */
export async function readAsset(path: string): Promise<string> {
  const assetPath = new URL(
    `./assets/${path}`,
    import.meta.url,
  );
  const resp = await fetch(assetPath);
  return await resp.text();
}

/**
 * Get version from import.meta.url
 *
 * @returns Version string, or undefined if not running from JSR
 */
export function getVersion(): string | undefined {
  const prefix = "https://jsr.io/@probitas/std/";
  if (import.meta.url.startsWith(prefix)) {
    return import.meta.url.slice(prefix.length).split("/").at(0);
  }
  return undefined;
}

/**
 * Options for findDenoConfigFile
 */
export interface FindDenoConfigFileOptions {
  /** Recursively search parent directories */
  parentLookup?: boolean;
}

/**
 * Find deno.json or deno.jsonc in the given directory
 *
 * Search order (per directory):
 * 1. deno.json
 * 2. deno.jsonc
 *
 * @param path - Directory to search in
 * @param options - Search options
 * @returns Absolute path to config file, or undefined if not found
 */
export async function findDenoConfigFile(
  path: string,
  options?: FindDenoConfigFileOptions,
): Promise<string | undefined> {
  let currentDir = resolve(path);

  while (true) {
    const searchPaths = [
      resolve(currentDir, "deno.json"),
      resolve(currentDir, "deno.jsonc"),
    ];

    for (const searchPath of searchPaths) {
      if (await exists(searchPath)) {
        return searchPath;
      }
    }

    // Stop if parentLookup is disabled or we've reached the root
    if (!options?.parentLookup) {
      return undefined;
    }

    const parent = dirname(currentDir);
    if (parent === currentDir) {
      // Reached filesystem root
      return undefined;
    }

    currentDir = parent;
  }
}

/**
 * Get user dependencies from their deno.json
 *
 * Reads the user's config file and resolves relative paths to file:// URLs.
 * This ensures imports work correctly when the temporary subprocess config
 * is placed in a different directory.
 *
 * @param userConfigPath - Path to user's deno.json/deno.jsonc
 * @returns Record of dependencies with resolved paths
 */
async function getUserDependencies(
  userConfigPath: string | undefined,
): Promise<Record<string, string>> {
  if (!userConfigPath) {
    return {};
  }
  const text = await Deno.readTextFile(userConfigPath);
  const denoJson = ensure(parseJsonc(text), isDenoConfig);
  const imports = denoJson.imports ?? {};
  const baseDir = dirname(userConfigPath);
  return Object.fromEntries(
    Object.entries(imports).map(([key, value]) => {
      if (value.startsWith("./") || value.startsWith("../")) {
        return [key, toFileUrl(resolve(baseDir, value)).href];
      }
      return [key, value];
    }),
  );
}

/**
 * Get probitas dependencies by reading the CLI package's deno.json
 *
 * Reads the deno.json bundled with the CLI package and resolves probitas
 * package imports (jsr:@probitas/*) to absolute URLs using import.meta.resolve().
 * External dependencies are kept as JSR specifiers for Deno to resolve directly.
 *
 * @returns Record of dependencies for import map
 */
async function getProbitasDependencies(): Promise<Record<string, string>> {
  const denoJsonUrl = new URL("./deno.json", import.meta.url);
  const resp = await fetch(denoJsonUrl);
  const denoJson = ensure(await resp.json(), isDenoConfig);
  const imports = denoJson.imports ?? {};
  return Object.fromEntries(
    Object.entries(imports).map(([key, value]) => {
      if (value.startsWith("jsr:@probitas/")) {
        return [key, import.meta.resolve(value)];
      }
      return [key, value];
    }),
  );
}

/**
 * Create temporary deno.json for subprocess execution
 *
 * @param userConfigPath - Path to user's deno.json/deno.jsonc
 * @returns Path to temporary deno.json file
 */
export async function createTempSubprocessConfig(
  userConfigPath?: string | undefined,
): Promise<string> {
  const userDeps = await getUserDependencies(userConfigPath);
  const probitasDeps = await getProbitasDependencies();

  // Merge user imports with probitas deps (probitas deps override user's)
  const denoJson = {
    imports: {
      ...userDeps,
      ...probitasDeps,
    },
  };

  // Create temporary config file
  const tempConfigPath = await Deno.makeTempFile({ suffix: ".json" });
  await Deno.writeTextFile(
    tempConfigPath,
    JSON.stringify(denoJson, null, 2),
  );

  return tempConfigPath;
}
