/**
 * Utility functions for CLI
 *
 * @module
 */

import { as, ensure, is, type Predicate } from "@core/unknownutil";
import { exists } from "@std/fs/exists";
import { parse as parseJsonc } from "@std/jsonc";
import { dirname, resolve } from "@std/path";
import {
  DotReporter,
  JSONReporter,
  ListReporter,
  TAPReporter,
} from "@probitas/reporter";
import type { Reporter, ReporterOptions } from "@probitas/reporter";

type DenoConfig = {
  imports?: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
};

const isDenoConfig = is.ObjectOf({
  imports: as.Optional(is.RecordOf(is.String, is.String)),
  scopes: as.Optional(
    is.RecordOf(is.RecordOf(is.String, is.String), is.String),
  ),
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
 * Get probitas internal dependencies from bundled deno.jsonc
 *
 * @returns Record of internal dependencies for scopes
 */
async function getProbitasInternalDependencies(): Promise<
  Record<string, string>
> {
  const denoConfigUrl = new URL("../../deno.jsonc", import.meta.url);
  const text = await fetch(denoConfigUrl).then((r) => r.text());
  const config = ensure(parseJsonc(text), isDenoConfig);

  const imports = config.imports || {};
  const internalDeps: Record<string, string> = {};

  for (const [key, value] of Object.entries(imports)) {
    if (key.startsWith("jsr:@probitas/")) {
      // Workspace packages override - resolve to absolute URLs
      // key: "jsr:@probitas/scenario@^0" -> "@probitas/scenario"
      const match = key.match(/^jsr:(@probitas\/\w+)@/);
      if (match) {
        const packageName = match[1];
        const absoluteUrl = new URL(value, denoConfigUrl).href;
        internalDeps[packageName] = absoluteUrl;
      }
    } else if (value.startsWith("jsr:")) {
      // External JSR dependencies
      internalDeps[key] = value;
    }
  }

  return internalDeps;
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
  // Read user's raw deno.json to preserve imports/scopes
  let userDenoConfig: DenoConfig | undefined;
  if (userConfigPath) {
    const text = await Deno.readTextFile(userConfigPath);
    userDenoConfig = ensure(parseJsonc(text), isDenoConfig);
  }

  // Determine probitas scope key and import path
  const probitasScope = import.meta.resolve("../probitas-std/");
  const probitasImport =
    new URL("../probitas-std/mod.ts", import.meta.url).href;

  // Get probitas internal dependencies
  const internalDeps = await getProbitasInternalDependencies();

  // Only include imports and scopes from user config
  // Exclude workspace, tasks, exclude, etc. as they use relative paths
  const mergedConfig = {
    imports: {
      ...(userDenoConfig?.imports ?? {}),
      ...internalDeps, // All probitas internal dependencies
      probitas: probitasImport, // Override user's probitas import
    },
    scopes: {
      ...(userDenoConfig?.scopes ?? {}),
      // Probitas internal dependencies (isolated from user's code)
      [probitasScope]: internalDeps,
    },
  };

  // Create temporary config file
  const tempConfigPath = await Deno.makeTempFile({ suffix: ".json" });
  await Deno.writeTextFile(
    tempConfigPath,
    JSON.stringify(mergedConfig, null, 2),
  );

  return tempConfigPath;
}
