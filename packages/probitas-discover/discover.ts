/**
 * Scenario file discovery functions
 *
 * @module
 */

import { walk } from "@std/fs/walk";
import { globToRegExp } from "@std/path/glob-to-regexp";
import { getLogger } from "@probitas/logger";

const logger = getLogger("probitas", "discover");

const DEFAULT_INCLUDE_PATTERNS = ["**/*.probitas.ts"];
const DEFAULT_EXCLUDE_PATTERNS: string[] = [];

/**
 * Progress information during file discovery.
 *
 * Provides real-time feedback about the discovery process, useful for
 * displaying progress in CLI applications.
 */
export interface DiscoverProgress {
  /**
   * The directory or file path currently being processed.
   */
  currentPath: string;

  /**
   * Total number of matching files found so far.
   */
  filesFound: number;
}

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

  /**
   * Callback invoked during discovery to report progress.
   *
   * Called when processing each path (file or directory) and after
   * completing pattern matching within a directory. This allows CLI
   * applications to display real-time progress feedback.
   *
   * @example
   * ```ts
   * await discoverScenarioFiles(["./scenarios"], {
   *   onProgress: ({ currentPath, filesFound }) => {
   *     console.log(`Discovering: ${currentPath} (${filesFound} files found)`);
   *   },
   * });
   * ```
   */
  onProgress?: (progress: DiscoverProgress) => void;
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
    onProgress,
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
        onProgress?.({ currentPath: path, filesFound: filePaths.size });
        continue;
      }

      if (stat.isDirectory) {
        // Directory - discover files within it using walk
        logger.debug("Path is a directory, scanning with patterns", {
          path,
          includePatterns: includes,
          excludePatterns: excludes,
        });

        // Convert glob patterns to RegExp for matching
        const includeRegexps = includes.map((p) =>
          globToRegExp(p, { extended: true, globstar: true })
        );
        const excludeRegexps = excludes.map((p) =>
          globToRegExp(p, { extended: true, globstar: true })
        );

        // Report progress at start of directory scan
        onProgress?.({ currentPath: path, filesFound: filePaths.size });

        let lastReportedDir = "";
        for await (const entry of walk(path, { includeDirs: false })) {
          // Get relative path for pattern matching
          const relativePath = entry.path.slice(path.length + 1);

          // Report progress when entering new directory
          const currentDir = entry.path.substring(
            0,
            entry.path.lastIndexOf("/"),
          );
          if (currentDir !== lastReportedDir) {
            lastReportedDir = currentDir;
            onProgress?.({
              currentPath: currentDir,
              filesFound: filePaths.size,
            });
          }

          // Check if excluded
          if (excludeRegexps.some((re) => re.test(relativePath))) {
            continue;
          }

          // Check if included
          if (!includeRegexps.some((re) => re.test(relativePath))) {
            continue;
          }

          logger.debug("Found file matching pattern", { file: entry.path });
          filePaths.add(entry.path);
        }

        logger.debug("Directory scan completed", {
          path,
          filesFound: filePaths.size,
        });
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
