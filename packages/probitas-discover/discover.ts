/**
 * Scenario file discovery functions
 *
 * @module
 */

import { expandGlob } from "@std/fs/expand-glob";
import { getLogger } from "@probitas/logger";

const logger = getLogger("probitas", "discover");

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

  logger.debug("Starting file discovery", {
    paths,
    includes,
    excludes,
  });

  const filePaths = new Set<string>();

  // Process each path
  for (const path of paths) {
    try {
      logger.debug("Processing path", { path });
      const stat = await Deno.stat(path);

      if (stat.isFile) {
        // Direct file specification
        logger.debug("Path is a file, adding directly", { path });
        filePaths.add(path);
        continue;
      }

      if (stat.isDirectory) {
        // Directory - discover files within it using include patterns
        logger.debug("Path is a directory, scanning with patterns", {
          path,
          includePatterns: includes,
          excludePatterns: excludes,
        });

        for (const pattern of includes) {
          const patternStartCount = filePaths.size;
          logger.debug("Applying include pattern", { path, pattern });

          for await (
            const entry of expandGlob(pattern, {
              root: path,
              exclude: [...excludes],
              extended: true,
              globstar: true,
            })
          ) {
            if (entry.isFile) {
              logger.debug("Found file matching pattern", {
                file: entry.path,
                pattern,
              });
              filePaths.add(entry.path);
            }
          }

          const filesFound = filePaths.size - patternStartCount;
          logger.debug("Pattern matching completed", {
            pattern,
            filesFound,
          });
        }
        continue;
      }
    } catch (err) {
      // Only skip if file not found, otherwise propagate error
      if (!(err instanceof Deno.errors.NotFound)) {
        logger.error("Unexpected error processing path", { path, error: err });
        throw err;
      }
      logger.debug("Path not found, skipping", { path });
    }
  }

  const result = Array.from(filePaths).sort();

  logger.debug("File discovery completed", {
    fileCount: result.length,
    files: result,
  });

  return result;
}
