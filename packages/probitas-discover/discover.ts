/**
 * Scenario file discovery functions
 *
 * @module
 */

import { expandGlob } from "@std/fs/expand-glob";

const DEFAULT_INCLUDE_PATTERNS = ["**/*.scenario.ts"];
const DEFAULT_EXCLUDE_PATTERNS: string[] = [];

/**
 * Options for discovering scenario files
 */
export interface DiscoverOptions {
  /** Include patterns (glob) for directory discovery */
  includes?: readonly string[];

  /** Exclude patterns (glob) */
  excludes?: readonly string[];
}

/**
 * Discover scenario files from paths
 *
 * Behavior:
 * - File path → Returns that file as absolute path
 * - Directory path → Discovers files within using include patterns
 *
 * @param paths - Paths (files or directories) - shell has already expanded globs
 * @param options - Discovery options with includes/excludes patterns
 * @returns Array of absolute file paths (sorted)
 *
 * @requires --allow-read Permission to read files
 *
 * @example
 * // Specific files and directories
 * await discoverScenarioFiles(["test.scenario.ts", "api/"], {});
 *
 * // With custom patterns
 * const files = await discoverScenarioFiles(["api/"], {
 *   includes: ["test.ts"],
 *   excludes: ["skip.ts"]
 * });
 */
export async function discoverScenarioFiles(
  paths: readonly string[],
  options: DiscoverOptions = {},
): Promise<string[]> {
  const {
    includes = DEFAULT_INCLUDE_PATTERNS,
    excludes = DEFAULT_EXCLUDE_PATTERNS,
  } = options;

  const filePaths = new Set<string>();

  // Process each path
  for (const path of paths) {
    try {
      const stat = await Deno.stat(path);

      if (stat.isFile) {
        // Direct file specification
        filePaths.add(path);
        continue;
      }

      if (stat.isDirectory) {
        // Directory - discover files within it using include patterns
        for (const pattern of includes) {
          for await (
            const entry of expandGlob(pattern, {
              root: path,
              exclude: [...excludes],
              extended: true,
              globstar: true,
            })
          ) {
            if (entry.isFile) {
              filePaths.add(entry.path);
            }
          }
        }
        continue;
      }
    } catch (err) {
      // Only skip if file not found, otherwise propagate error
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err;
      }
    }
  }

  return Array.from(filePaths).sort();
}
