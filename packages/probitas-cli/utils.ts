/**
 * Utility functions for CLI
 *
 * @module
 */

import { as, ensure, is, type Predicate } from "@core/unknownutil";
import { getLogger } from "@probitas/logger";
import { JSONReporter, ListReporter } from "@probitas/reporter";
import type { Reporter } from "@probitas/runner";
import type { ReporterOptions } from "@probitas/reporter";

const logger = getLogger("probitas", "cli", "utils");

type DenoJson = {
  version?: string;
};

const isDenoJson = is.ObjectOf({
  version: as.Optional(is.String),
}) satisfies Predicate<DenoJson>;

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
    logger.error("Unknown reporter", {
      reporter,
      availableReporters: Object.keys(reporterMap),
    });
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
export async function getVersion(): Promise<string | undefined> {
  try {
    const resp = await fetch(new URL("./deno.json", import.meta.url));
    const denoJson = ensure(await resp.json(), isDenoJson);
    return denoJson.version;
  } catch (err: unknown) {
    logger.debug("Failed to read version from deno.json", {
      err,
    });
    return undefined;
  }
}
