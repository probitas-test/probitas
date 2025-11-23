/**
 * Utility functions for CLI
 *
 * @module
 */

import {
  DotReporter,
  JSONReporter,
  ListReporter,
  LiveReporter,
  TAPReporter,
} from "../src/reporter/mod.ts";
import type { ReporterOptions } from "../src/reporter/types.ts";
import type { Reporter, ScenarioDefinition } from "../src/runner/types.ts";
import type { Selector, SelectorType } from "./types.ts";

/**
 * Resolve reporter by name or return Reporter instance
 *
 * @param reporter - Reporter name or instance
 * @param options - Optional reporter options
 * @returns Reporter instance
 */
export function resolveReporter(
  reporter: string | Reporter | undefined,
  options?: ReporterOptions,
): Reporter {
  if (!reporter) {
    return new ListReporter(options);
  }

  if (typeof reporter === "string") {
    const reporterMap: Record<string, (opts?: ReporterOptions) => Reporter> = {
      "list": (opts) => new ListReporter(opts),
      "dot": (opts) => new DotReporter(opts),
      "json": (opts) => new JSONReporter(opts),
      "live": (opts) => new LiveReporter(opts),
      "tap": (opts) => new TAPReporter(opts),
    };

    const factory = reporterMap[reporter];
    if (!factory) {
      throw new Error(`Unknown reporter: ${reporter}`);
    }

    return factory(options);
  }

  return reporter;
}

/**
 * Parse max concurrency option
 *
 * @param maxConcurrency - Max concurrency value
 * @returns Concurrency value or undefined for default
 */
export function parseMaxConcurrency(
  maxConcurrency?: string | number,
): number | undefined {
  if (maxConcurrency === undefined) {
    return undefined;
  }

  if (typeof maxConcurrency === "string" && maxConcurrency.includes(".")) {
    throw new Error("max-concurrency must be a positive integer");
  }

  const num = typeof maxConcurrency === "number"
    ? maxConcurrency
    : parseInt(maxConcurrency, 10);

  if (isNaN(num) || num < 1 || !Number.isInteger(num)) {
    throw new Error("max-concurrency must be a positive integer");
  }

  return num;
}

/**
 * Parse max failures option
 *
 * @param maxFailures - Max failures value
 * @returns Failure count or undefined if not set
 */
export function parseMaxFailures(
  maxFailures?: string | number,
): number | undefined {
  if (maxFailures === undefined) {
    return undefined;
  }

  if (typeof maxFailures === "string" && maxFailures.includes(".")) {
    throw new Error("max-failures must be a positive integer");
  }

  const num = typeof maxFailures === "number"
    ? maxFailures
    : parseInt(maxFailures, 10);

  if (isNaN(num) || num < 1 || !Number.isInteger(num)) {
    throw new Error("max-failures must be a positive integer");
  }

  return num;
}

/**
 * Read template file from assets/templates
 *
 * @param filename - Template filename
 * @returns Template content
 * @requires --allow-read Permission to read template files
 */
export async function readTemplate(filename: string): Promise<string> {
  return await readAsset(`templates/${filename}`);
}

/**
 * Read asset file (help text, etc.)
 *
 * @param path - Asset filename (e.g., "usage.txt", "usage-run.txt")
 * @returns Asset content
 * @requires --allow-read Permission to read asset files
 */
export async function readAsset(path: string): Promise<string> {
  const assetPath = new URL(
    `../assets/${path}`,
    import.meta.url,
  );
  const resp = await fetch(assetPath);
  return await resp.text();
}

/**
 * Get version from import.meta.url
 *
 * @returns Version string from deno.jsonc or "unknown" if unable to read
 */
export function getVersion(): string {
  const prefix = "https://jsr.io/@lambdalisue/probitas/";
  if (import.meta.url.startsWith(prefix)) {
    return import.meta.url.slice(prefix.length).split("/").at(0) ?? "unknown";
  }
  return "unknown";
}

/**
 * Parse a selector string into an array of Selector objects
 *
 * @param input - Selector string (e.g., "tag:api", "login", "tag:api,name:User")
 * @returns Array of Selector objects
 *
 * @example
 * parseSelector("tag:api") // [{ type: "tag", value: /api/ }]
 * parseSelector("login") // [{ type: "name", value: /login/ }]
 * parseSelector("tag:api,name:User") // [{ type: "tag", value: /api/ }, { type: "name", value: /User/ }]
 */
export function parseSelector(input: string): Selector[] {
  const parts = input.split(",").map((s) => s.trim()).filter((s) =>
    s.length > 0
  );

  return parts.map((part) => {
    if (part.includes(":")) {
      const colonIndex = part.indexOf(":");
      const type = part.slice(0, colonIndex) as SelectorType;
      const value = part.slice(colonIndex + 1);

      if (type !== "tag" && type !== "name") {
        throw new Error(
          `Invalid selector type: ${type}. Must be "tag" or "name".`,
        );
      }

      return {
        type,
        value: new RegExp(value, "i"), // Case-insensitive
      };
    } else {
      // Default to "name" type
      return {
        type: "name" as SelectorType,
        value: new RegExp(part, "i"), // Case-insensitive
      };
    }
  });
}

/**
 * Check if a scenario matches a single selector
 *
 * @param scenario - Scenario definition to check
 * @param selector - Selector to match against
 * @returns True if the scenario matches the selector
 */
export function matchesSelector(
  scenario: ScenarioDefinition,
  selector: Selector,
): boolean {
  const pattern = selector.value instanceof RegExp
    ? selector.value
    : new RegExp(selector.value);

  if (selector.type === "tag") {
    return scenario.options.tags.some((tag) => pattern.test(tag));
  } else if (selector.type === "name") {
    return pattern.test(scenario.name);
  }

  return false;
}

/**
 * Apply selectors to scenarios with AND/OR logic
 *
 * @param scenarios - All scenarios to filter
 * @param selectorInputs - Array of selector strings (OR between strings, AND within strings)
 * @param excludeInputs - Array of exclude selector strings (OR between strings, AND within strings)
 * @returns Filtered scenarios
 *
 * @example
 * // Select scenarios with "api" OR "db" tag
 * applySelectors(scenarios, ["tag:api", "tag:db"], [])
 *
 * // Select scenarios with "api" AND "critical" tag
 * applySelectors(scenarios, ["tag:api,tag:critical"], [])
 *
 * // Select "api" OR "db" tag, excluding "slow" tag
 * applySelectors(scenarios, ["tag:api", "tag:db"], ["tag:slow"])
 */
export function applySelectors(
  scenarios: ScenarioDefinition[],
  selectorInputs: readonly string[],
  excludeInputs: readonly string[],
): ScenarioDefinition[] {
  let result = scenarios;

  // Apply select filters (OR between selector strings, AND within each string)
  if (selectorInputs.length > 0) {
    result = result.filter((scenario) => {
      return selectorInputs.some((input) => {
        const selectors = parseSelector(input);
        // All selectors within one input must match (AND)
        return selectors.every((selector) =>
          matchesSelector(scenario, selector)
        );
      });
    });
  }

  // Apply exclude filters (OR between exclude strings, AND within each string)
  if (excludeInputs.length > 0) {
    result = result.filter((scenario) => {
      return !excludeInputs.some((input) => {
        const selectors = parseSelector(input);
        // All selectors within one input must match (AND)
        return selectors.every((selector) =>
          matchesSelector(scenario, selector)
        );
      });
    });
  }

  return result;
}
