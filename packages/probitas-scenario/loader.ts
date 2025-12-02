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
 * Options for loading scenarios
 */
export interface LoadScenariosOptions {
  /**
   * Callback invoked when an import error occurs
   *
   * If not provided, errors are silently ignored.
   */
  onImportError?: (scenarioFile: string | URL, err: unknown) => void;
}

/**
 * Load scenarios from specified file paths
 *
 * @param scenarioFiles - Array of absolute file paths or URLs to load
 * @param options - Options for loading scenarios
 * @returns Array of loaded ScenarioDefinition objects
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
