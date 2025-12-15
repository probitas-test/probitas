/**
 * Scenario file loader
 *
 * @module
 */

import { toFileUrl } from "@std/path";
import { getLogger } from "@probitas/logger";
import type { ScenarioDefinition } from "./types.ts";

const logger = getLogger("probitas", "scenario");

/**
 * Options for loading scenarios from files.
 *
 * @example Handling import errors
 * ```ts
 * const scenarios = await loadScenarios(files, {
 *   onImportError: (file, err) => {
 *     console.error(`Failed to load ${file}:`, err);
 *   }
 * });
 * ```
 */
export interface LoadScenariosOptions {
  /**
   * Callback invoked when a scenario file fails to import.
   *
   * Use this for custom error handling or logging. If not provided,
   * import errors are logged but otherwise silently ignored (the file
   * is skipped and loading continues with other files).
   *
   * @param scenarioFile - The file path or URL that failed to import
   * @param err - The error that occurred during import
   */
  onImportError?: (scenarioFile: string | URL, err: unknown) => void;
}

/**
 * Load scenario definitions from file paths.
 *
 * Dynamically imports scenario files and extracts their default exports.
 * Supports both single scenario exports and arrays of scenarios.
 *
 * @param scenarioFiles - Absolute file paths or file:// URLs to load
 * @param options - Optional error handling configuration
 * @returns Array of loaded scenario definitions
 *
 * @remarks
 * - Files must export a default value (single scenario or array)
 * - Import errors are logged and skipped (won't throw)
 * - Use with {@linkcode discoverScenarioFiles} from `@probitas/discover`
 *
 * @example Loading discovered files
 * ```ts
 * import { discoverScenarioFiles } from "@probitas/discover";
 * import { loadScenarios } from "@probitas/core";
 *
 * const files = await discoverScenarioFiles({
 *   includes: ["**\/*.probitas.ts"]
 * });
 * const scenarios = await loadScenarios(files);
 * ```
 *
 * @example Loading specific files
 * ```ts
 * const scenarios = await loadScenarios([
 *   "/project/tests/auth.probitas.ts",
 *   "/project/tests/api.probitas.ts"
 * ]);
 * ```
 */
export async function loadScenarios(
  scenarioFiles: readonly (string | URL)[],
  options?: LoadScenariosOptions,
): Promise<ScenarioDefinition[]> {
  logger.debug("Loading scenarios", {
    fileCount: scenarioFiles.length,
    files: scenarioFiles,
  });

  const scenarios: ScenarioDefinition[] = [];

  for (const scenarioFile of scenarioFiles) {
    try {
      const fileUrl = scenarioFile instanceof URL
        ? scenarioFile
        : toFileUrl(scenarioFile);

      logger.debug("Importing scenario file", { file: fileUrl.href });

      const module = await import(fileUrl.href);
      const exported = module.default;

      if (Array.isArray(exported)) {
        // Multiple scenarios
        logger.debug("Loaded multiple scenarios from file", {
          file: scenarioFile,
          count: exported.length,
        });
        scenarios.push(...exported);
      } else if (exported && typeof exported === "object") {
        // Single scenario
        logger.debug("Loaded single scenario from file", {
          file: scenarioFile,
          name: exported.name,
        });
        scenarios.push(exported);
      }
    } catch (err: unknown) {
      logger.error("Failed to import scenario file", {
        file: scenarioFile,
        error: err,
      });
      options?.onImportError?.(scenarioFile, err);
    }
  }

  logger.debug("Scenarios loading completed", {
    totalScenarios: scenarios.length,
  });

  return scenarios;
}
