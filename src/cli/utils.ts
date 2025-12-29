/**
 * Utility functions for CLI
 *
 * @module
 */

import { as, ensure, is, type Predicate } from "@core/unknownutil";
import {
  configure,
  getConsoleSink,
  getLogger,
  type LogLevel,
} from "@logtape/logtape";
import { getPrettyFormatter } from "@logtape/pretty";
import { JSONReporter, ListReporter } from "@probitas/reporter";
import type { Reporter } from "@probitas/runner";
import type { ReporterOptions } from "@probitas/reporter";
import { load } from "@std/dotenv";
import { exists } from "@std/fs";
import { resolve } from "@std/path";

const logger = getLogger(["probitas", "cli", "utils"]);

/**
 * Extract --deno-XXXXX options from arguments
 *
 * Converts --deno-foo to --foo for passing to deno run subprocess.
 *
 * @param args - Command-line arguments
 * @returns Array of deno options
 *
 * @example
 * ```ts
 * extractDenoArgs(["--deno-no-lock", "--verbose"])
 * // => ["--no-lock"]
 * ```
 */
export function extractDenoArgs(args: string[]): string[] {
  const denoArgs: string[] = [];

  for (const arg of args) {
    if (arg.startsWith("--deno-")) {
      // "--deno-no-lock" → "--no-lock"
      const denoArg = arg.replace(/^--deno-/, "--");
      denoArgs.push(denoArg);
    }
  }

  return denoArgs;
}

type DenoJson = {
  version?: string;
};

const isDenoJson = is.ObjectOf({
  version: as.Optional(is.String),
}) satisfies Predicate<DenoJson>;

type DenoLock = {
  specifiers?: Record<string, string>;
};

const isDenoLock = is.ObjectOf({
  specifiers: as.Optional(is.RecordOf(is.String, is.String)),
}) satisfies Predicate<DenoLock>;

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
 * Read asset file from assets directory
 *
 * Uses import.meta.dirname for compatibility with deno compile.
 * The --include flag must be used when compiling to embed assets.
 *
 * @param path - Asset path relative to assets/ (e.g., "usage.txt", "templates/deno.json")
 * @returns Asset content
 */
export async function readAsset(path: string): Promise<string> {
  const url = new URL(`../../assets/${path}`, import.meta.url);
  const resp = await fetch(url);
  return await resp.text();
}

/**
 * Get version from deno.json
 *
 * Uses import.meta.dirname for compatibility with deno compile.
 * The --include flag must be used when compiling to embed deno.json.
 *
 * @returns Version string, or undefined if not available
 */
export async function getVersion(): Promise<string | undefined> {
  try {
    const url = new URL("../../deno.json", import.meta.url);
    const resp = await fetch(url);
    const content = await resp.text();
    const denoJson = ensure(JSON.parse(content), isDenoJson);
    return denoJson.version;
  } catch (err: unknown) {
    logger.debug("Failed to read version from deno.json", {
      err,
    });
    return undefined;
  }
}

/**
 * Get version information including CLI and @probitas package versions
 *
 * Reads CLI version from deno.json and package versions from deno.lock.
 * Package versions are extracted from the specifiers section of deno.lock.
 *
 * @returns Version information including CLI and package versions
 */
export async function getVersionInfo(): Promise<VersionInfo | undefined> {
  try {
    // Get CLI version from deno.json
    const denoJsonUrl = new URL("../../deno.json", import.meta.url);
    const denoJsonResp = await fetch(denoJsonUrl);
    const denoJsonContent = await denoJsonResp.text();
    const denoJson = ensure(JSON.parse(denoJsonContent), isDenoJson);

    const version = denoJson.version ?? "unknown";

    // Get package versions from deno.lock
    const denoLockUrl = new URL("../../deno.lock", import.meta.url);
    const denoLockResp = await fetch(denoLockUrl);
    const denoLockContent = await denoLockResp.text();
    const denoLock = ensure(JSON.parse(denoLockContent), isDenoLock);

    // Extract @probitas package versions from specifiers
    // Format: "jsr:@probitas/core@^0.2.0": "0.2.0"
    const packages: { name: string; version: string }[] = [];
    const seen = new Set<string>();

    if (denoLock.specifiers) {
      for (
        const [specifier, resolvedVersion] of Object.entries(
          denoLock.specifiers,
        )
      ) {
        // Match jsr:@probitas/package-name@version pattern
        const match = specifier.match(/^jsr:(@probitas\/[^@]+)@/);
        if (match && typeof resolvedVersion === "string") {
          const name = match[1];
          // Skip duplicates (same package with different version specifiers)
          if (!seen.has(name)) {
            seen.add(name);
            packages.push({ name, version: resolvedVersion });
          }
        }
      }
    }

    // Sort packages by name for consistent output
    packages.sort((a, b) => a.name.localeCompare(b.name));

    return { version, packages };
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
    const env = await load({ envPath: targetPath, export: true });
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

/**
 * Configure LogTape logging for the CLI
 *
 * @param level - Log level to use
 */
export async function configureLogging(level: LogLevel): Promise<void> {
  try {
    await configure({
      sinks: {
        console: getConsoleSink({
          formatter: getPrettyFormatter({
            timestamp: "disabled",
            colors: true,
            properties: true,
          }),
        }),
      },
      filters: {
        levelFilter: level,
        metaFilter: "warning",
      },
      loggers: [
        {
          category: ["probitas"],
          filters: ["levelFilter"],
          sinks: ["console"],
        },
        {
          category: ["logtape", "meta"],
          filters: ["metaFilter"],
          sinks: ["console"],
        },
      ],
    });
  } catch {
    // Ignore configuration errors (e.g., already configured in tests)
  }
}
