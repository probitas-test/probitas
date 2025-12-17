/**
 * Logging utilities for Probitas using LogTape.
 *
 * @module
 */

import {
  configure,
  getConsoleSink,
  getLogger as getLogTapeLogger,
  type Logger,
  type LogLevel,
  reset,
} from "@logtape/logtape";
import { getPrettyFormatter } from "@logtape/pretty";

/**
 * Configure the logging system with the specified log level.
 *
 * Initializes LogTape with pretty-printed console output. Can be called
 * multiple times to change the log level during execution.
 *
 * @param level - Minimum log level to output
 *
 * @remarks
 * Log levels from least to most verbose:
 * - `"fatal"`: Only critical errors that stop execution
 * - `"error"`: Errors that don't stop execution
 * - `"warning"`: Potential issues (default)
 * - `"info"`: Informational messages about execution
 * - `"debug"`: Detailed debugging information
 *
 * @example Basic configuration
 * ```ts
 * import { configureLogging } from "@probitas/logger";
 *
 * // Enable debug logging for troubleshooting
 * await configureLogging("debug");
 * ```
 *
 * @example In test setup
 * ```ts
 * // Suppress logs during tests
 * await configureLogging("fatal");
 *
 * // ... run tests ...
 *
 * await resetLogging();
 * ```
 */
export async function configureLogging(
  level: LogLevel = "warning",
): Promise<void> {
  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: getPrettyFormatter({
          timestamp: "date-time",
          colors: true,
          properties: true,
        }),
      }),
    },
    filters: {
      levelFilter: level,
      metaFilter: "warning", // Suppress LogTape meta logger info messages
    },
    loggers: [
      {
        category: ["probitas"],
        filters: ["levelFilter"],
        sinks: ["console"],
      },
      {
        category: ["logtape", "meta"],
        filters: ["metaFilter"],
        sinks: ["console"],
      },
    ],
    reset: true, // Reset configuration on each call
  });
}

/**
 * Get a logger instance for the specified category.
 *
 * Categories follow a hierarchical structure matching the package organization.
 * Child loggers inherit configuration from their parents.
 *
 * @param category - Category path segments (e.g., "probitas", "runner", "step")
 * @returns Logger instance with `debug`, `info`, `warning`, `error`, `fatal` methods
 *
 * @example Basic usage
 * ```ts
 * import { getLogger } from "@probitas/logger";
 *
 * const logger = getLogger("probitas", "cli", "run");
 *
 * logger.info("Starting run command");
 * logger.debug("Processing options", { maxConcurrency: 4 });
 * logger.error("Failed to load scenario", { file: "test.ts", error: "not found" });
 * ```
 *
 * @example In a module
 * ```ts
 * import { getLogger } from "@probitas/logger";
 *
 * // At module top level
 * const logger = getLogger("probitas", "runner");
 *
 * interface ScenarioDefinition {
 *   name: string;
 * }
 *
 * export function runScenario(scenario: ScenarioDefinition) {
 *   logger.info("Running scenario", { name: scenario.name });
 * }
 * ```
 */
export function getLogger(...category: string[]): Logger {
  return getLogTapeLogger(category);
}

/**
 * Reset the logging configuration to its initial state.
 *
 * Clears all configured sinks and loggers. Primarily used in tests
 * to ensure clean state between test cases.
 *
 * @example Test cleanup
 * ```ts
 * import { configureLogging, resetLogging } from "@probitas/logger";
 *
 * Deno.test("my test", async () => {
 *   await configureLogging("fatal");  // Suppress logs during test
 *
 *   // ... test code ...
 *
 *   await resetLogging();  // Clean up
 * });
 * ```
 */
export async function resetLogging(): Promise<void> {
  await reset();
}

// Re-export types from LogTape for convenience
export type { Logger, LogLevel };
