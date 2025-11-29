/**
 * Scenario file loader
 *
 * @module
 */

import { toFileUrl } from "@std/path";
import type { ScenarioDefinition } from "./types.ts";

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
  const scenarios: ScenarioDefinition[] = [];

  for (const scenarioFile of scenarioFiles) {
    try {
      const fileUrl = scenarioFile instanceof URL
        ? scenarioFile
        : toFileUrl(scenarioFile);
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
      options?.onImportError?.(scenarioFile, err);
    }
  }

  return scenarios;
}
