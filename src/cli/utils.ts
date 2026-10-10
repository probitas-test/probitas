/**
 * Utility functions for CLI
 *
 * @module
 */

import { getLogger } from "@logtape/logtape";
import type { Reporter } from "@probitas-test/runner";
import { ListReporter } from "./reporter/list_reporter.ts";
import { JSONReporter } from "./reporter/json_reporter.ts";
import type { ReporterOptions } from "./reporter/types.ts";
import { readFile } from "node:fs/promises";
import { exists, loadEnvFile } from "./_fs.ts";
import { assets } from "./_assets.ts";
import packageJson from "../../package.json" with { type: "json" };
import { resolve } from "@std/path";

const logger = getLogger(["probitas", "cli", "utils"]);

/**
 * Version information including CLI and dependency versions
 */
export type VersionInfo = {
  /** CLI version */
  readonly version: string;
  /** @probitas package versions (sorted by name) */
  readonly packages: ReadonlyArray<{ name: string; version: string }>;
};

const reporterMap: Record<string, (opts?: ReporterOptions) => Reporter> = {
  list: (opts) => new ListReporter(opts),
  json: (opts) => new JSONReporter(opts),
};

/**
 * Resolve reporter by name
 *
 * @param reporter - Reporter name (list/json) or undefined for default
 * @param options - Optional reporter options
 * @returns Reporter instance
 */
export function resolveReporter(
  reporter: string | undefined,
  options?: ReporterOptions,
): Reporter {
  const reporterName = reporter ?? "list";

  logger.debug("Resolving reporter", {
    reporterName,
    options,
  });

  if (!reporter) {
    logger.debug("Using default reporter", { reporter: "list" });
    return new ListReporter(options);
  }

  const fn = reporterMap[reporter];
  if (!fn) {
    throw new Error(`Unknown reporter: ${reporter}`);
  }

  logger.debug("Reporter resolved", { reporter });
  return fn(options);
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
 * Parse timeout string to seconds
 *
 * Supports formats: "30s", "10m", "1h", or plain numbers (treated as seconds)
 * Special case: "0", "0s", "0m", "0h" returns undefined (no timeout)
 *
 * @param value - Timeout value to parse (e.g., "30s", "10m", "1h")
 * @returns Timeout in seconds, or undefined if value is "0" or equivalent
 * @throws Error if format is invalid
 *
 * @example
 * ```ts
 * parseTimeout("30s")  // 30
 * parseTimeout("10m")  // 600
 * parseTimeout("1h")   // 3600
 * parseTimeout("0")    // undefined (no timeout)
 * parseTimeout("0s")   // undefined (no timeout)
 * ```
 */
export function parseTimeout(
  value: string,
): number | undefined {
  const match = value.match(/^(\d+(?:\.\d+)?)(s|m|h)?$/i);
  if (!match) {
    throw new Error(
      `Invalid timeout format: "${value}". Expected format: "30s", "10m", "1h", or a number`,
    );
  }

  const num = parseFloat(match[1]);
  const unit = (match[2] || "s").toLowerCase();

  let seconds: number;

  switch (unit) {
    case "s":
      seconds = num;
      break;
    case "m":
      seconds = num * 60;
      break;
    case "h":
      seconds = num * 3600;
      break;
    default:
      // This should never happen due to regex validation
      throw new Error(`Invalid timeout unit: "${unit}"`);
  }

  // Return undefined for zero timeout (means no timeout)
  if (seconds === 0) {
    return undefined;
  }

  if (seconds < 0 || !Number.isFinite(seconds)) {
    throw new Error(`Timeout must be a non-negative number`);
  }

  return seconds;
}

/**
 * Read a CLI asset (help texts, `probitas init` templates)
 *
 * Assets are imported as text at build time, so the compiled binary needs no
 * files beside it.
 *
 * @param path - Asset path relative to assets/ (e.g., "usage.txt")
 * @returns Asset content
 */
export function readAsset(path: string): Promise<string> {
  const content = assets[path];
  if (content === undefined) {
    return Promise.reject(new Error(`Unknown asset: ${path}`));
  }
  return Promise.resolve(content);
}

/**
 * Get the CLI version from package.json
 */
export function getVersion(): Promise<string | undefined> {
  return Promise.resolve(packageJson.version);
}

/**
 * Versions of the bundled `@probitas-test/*` packages, injected by
 * `scripts/build.ts` as a JSON object. Undefined when running from source.
 */
declare const PROBITAS_PACKAGE_VERSIONS: Record<string, string> | undefined;

async function readInstalledPackageVersions(): Promise<Record<string, string>> {
  const names = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }).filter((name) => name.startsWith("@probitas-test/"));
  const nodeModules = resolve(import.meta.dir, "../../node_modules");
  const versions: Record<string, string> = {};
  for (const name of names) {
    try {
      const manifest = JSON.parse(
        await readFile(resolve(nodeModules, name, "package.json"), "utf8"),
      );
      versions[name] = manifest.version;
    } catch (err: unknown) {
      logger.debug("Failed to read package version", { name, err });
    }
  }
  return versions;
}

/**
 * Get version information including CLI and bundled package versions
 *
 * @returns Version information including CLI and package versions
 */
export async function getVersionInfo(): Promise<VersionInfo | undefined> {
  try {
    const versions = typeof PROBITAS_PACKAGE_VERSIONS === "undefined"
      ? await readInstalledPackageVersions()
      : PROBITAS_PACKAGE_VERSIONS;
    const packages = Object.entries(versions)
      .map(([name, version]) => ({ name, version }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { version: packageJson.version, packages };
  } catch (err: unknown) {
    logger.debug("Failed to read version info", { err });
    return undefined;
  }
}

/**
 * Load environment variables from a .env file
 *
 * @param cwd - Current working directory
 * @param options - Environment loading options
 * @returns void
 *
 * @example
 * ```ts
 * import { loadEnvironment } from "./utils.ts";
 *
 * const cwd = Deno.cwd();
 *
 * // Load default .env file
 * await loadEnvironment(cwd);
 *
 * // Skip loading .env
 * await loadEnvironment(cwd, { noEnv: true });
 *
 * // Load custom .env file
 * await loadEnvironment(cwd, { envFile: ".env.test" });
 * ```
 */
export async function loadEnvironment(
  cwd: string,
  options?: {
    /** Skip loading .env file */
    noEnv?: boolean;
    /** Custom .env file path (relative to cwd or absolute) */
    envFile?: string;
  },
): Promise<void> {
  const { noEnv = false, envFile } = options ?? {};

  // Skip if --no-env is specified
  if (noEnv) {
    logger.debug("Environment loading disabled via --no-env");
    return;
  }

  // Determine which file to load
  const targetFile = envFile ?? ".env";
  const targetPath = resolve(cwd, targetFile);

  // Check if file exists
  if (!(await exists(targetPath))) {
    logger.debug("Environment file not found", { path: targetPath });
    return;
  }

  // Load environment variables
  try {
    const env = await loadEnvFile(targetPath);
    logger.debug("Environment loaded", {
      path: targetPath,
      keys: Object.keys(env),
    });
  } catch (err: unknown) {
    // Log error but don't fail - missing .env is acceptable
    logger.debug("Failed to load environment file", {
      path: targetPath,
      error: err,
    });
  }
}

// Re-export configureLogging from shared template module
export { configureLogging } from "./_templates/logging.ts";
