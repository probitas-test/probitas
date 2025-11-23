/**
 * Scenario file loader for Probitas
 *
 * @module
 */

import { expandGlob } from "@std/fs";
import { join, resolve, toFileUrl } from "@std/path";
import type { ScenarioDefinition } from "../src/runner/types.ts";

const DEFAULT_INCLUDE_PATTERN = "**/*.scenario.ts";

/**
 * Options for loading scenarios
 */
export interface LoadScenarioOptions {
  /** Include patterns (glob, file, directory, or RegExp) */
  includes?: (string | RegExp)[];

  /** Exclude patterns (glob, file, directory, or RegExp) */
  excludes?: (string | RegExp)[];
}

/**
 * Load scenarios from files matching the given patterns
 *
 * @param cwd - Current working directory
 * @param options - Load options with includes/excludes patterns
 * @returns Array of loaded ScenarioDefinition objects
 *
 * @requires --allow-read Permission to read scenario files
 */
export async function loadScenarios(
  cwd: string,
  options: LoadScenarioOptions = {},
): Promise<ScenarioDefinition[]> {
  const { includes = [DEFAULT_INCLUDE_PATTERN], excludes = [] } = options;

  const filePaths = new Set<string>();

  // Process each include pattern
  for (const pattern of includes) {
    if (typeof pattern === "string") {
      // Check if it's a directory
      try {
        const stat = await Deno.stat(resolve(cwd, pattern));
        if (stat.isDirectory) {
          // Add all scenario files in the directory
          const globPattern = join(pattern, DEFAULT_INCLUDE_PATTERN);
          for await (
            const entry of expandGlob(globPattern, {
              root: cwd,
              exclude: excludes.filter((e) => typeof e === "string"),
            })
          ) {
            if (entry.isFile) {
              filePaths.add(entry.path);
            }
          }
          continue;
        }
      } catch {
        // Not a directory, treat as glob/file pattern
      }

      // Process as glob pattern
      try {
        for await (
          const entry of expandGlob(pattern, {
            root: cwd,
            exclude: excludes.filter((e) => typeof e === "string"),
          })
        ) {
          if (entry.isFile) {
            filePaths.add(entry.path);
          }
        }
      } catch {
        // Pattern doesn't match any files
      }
    } else if (pattern instanceof RegExp) {
      // RegExp pattern - search all scenario files
      for await (
        const entry of expandGlob(DEFAULT_INCLUDE_PATTERN, { root: cwd })
      ) {
        if (entry.isFile && pattern.test(entry.path)) {
          filePaths.add(entry.path);
        }
      }
    }
  }

  // Filter out excluded patterns
  const regexExcludes = excludes.filter((e) => e instanceof RegExp);
  const excludedPaths = new Set<string>();

  for (const path of filePaths) {
    for (const excludePattern of regexExcludes) {
      if (excludePattern.test(path)) {
        excludedPaths.add(path);
        break;
      }
    }
  }

  const finalPaths = [...filePaths]
    .filter((p) => !excludedPaths.has(p))
    .sort();

  // Load scenarios from each file
  const scenarios: ScenarioDefinition[] = [];

  for (const filePath of finalPaths) {
    try {
      const fileUrl = toFileUrl(filePath);
      const module = await import(fileUrl.href);
      const exported = module.default;

      if (Array.isArray(exported)) {
        // Multiple scenarios
        scenarios.push(...exported);
      } else if (exported && typeof exported === "object") {
        // Single scenario
        scenarios.push(exported);
      }
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to load scenario from ${filePath}: ${m}`);
    }
  }

  return scenarios;
}
