/**
 * Scenario file discovery functions
 *
 * @module
 */

import { expandGlob } from "@std/fs/expand-glob";
import { getLogger } from "@probitas/logger";

const logger = getLogger("probitas", "discover");

const DEFAULT_INCLUDE_PATTERNS = ["**/*.probitas.ts"];
const DEFAULT_EXCLUDE_PATTERNS: string[] = [];

/**
 * Options for discovering scenario files.
 *
 * Controls which files are included or excluded when scanning directories.
 */
export interface DiscoverOptions {
  /**
   * Glob patterns for files to include when scanning directories.
   *
   * Uses standard glob syntax with `**` for recursive matching.
   *
   * @default ["**\/*.probitas.ts"]
   */
  includes?: readonly string[];

  /**
   * Glob patterns for files to exclude.
   *
   * @default []
   */
  excludes?: readonly string[];
}

/**
 * Discover scenario files from paths (files or directories).
 *
 * Handles two input types:
 * - **File path**: Returns the file directly (no pattern matching)
 * - **Directory path**: Scans using include/exclude patterns
 *
 * @param paths - Array of file paths or directory paths to scan
 * @param options - Include/exclude patterns for directory scanning
 * @returns Array of absolute file paths, sorted alphabetically
 *
 * @remarks
 * - Requires `--allow-read` permission
 * - Non-existent paths are silently skipped
 * - Duplicate files are automatically deduplicated
 * - Output is always sorted for deterministic ordering
 *
 * @example Discover from directories
 * ```ts
 * import { discoverScenarioFiles } from "@probitas/discover";
 *
 * // Use default patterns (*.probitas.ts)
 * const files = await discoverScenarioFiles(["./tests", "./integration"]);
 * ```
 *
 * @example Discover with custom patterns
 * ```ts
 * const files = await discoverScenarioFiles(["./src"], {
 *   includes: ["**\/*.test.ts", "**\/*.spec.ts"],
 *   excludes: ["**\/__fixtures__/**"]
 * });
 * ```
 *
 * @example Mixed files and directories
 * ```ts
 * const files = await discoverScenarioFiles([
 *   "./tests/",           // Scan directory
 *   "./smoke.probitas.ts" // Include specific file
 * ]);
 * ```
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
