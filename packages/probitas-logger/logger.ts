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
 * Can be called multiple times; LogTape will handle reconfiguration.
 *
 * @param level - The minimum log level to output (default: "warning")
 *   - "fatal": Only fatal errors
 *   - "warning": Warnings, errors, and fatal (default)
 *   - "info": Info, warnings, errors, and fatal
 *   - "debug": All logs including debug
 *
 * @example
 * ```ts
 * import { configureLogging } from "@probitas/logger";
 *
 * await configureLogging("debug");
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
 * Get a logger for the specified category path.
 * Categories follow the package hierarchy.
 *
 * @param category - Category segments (e.g., "probitas", "cli", "run")
 * @returns A logger instance
 *
 * @example
 * ```ts
 * import { getLogger } from "@probitas/logger";
 *
 * const logger = getLogger("probitas", "cli", "run");
 * logger.info("Starting run command");
 * ```
 */
export function getLogger(...category: string[]): Logger {
  return getLogTapeLogger(category);
}

/**
 * Reset logging configuration.
 * Primarily used for testing to ensure clean state between tests.
 *
 * @example
 * ```ts
 * import { resetLogging } from "@probitas/logger";
 *
 * await resetLogging();
 * ```
 */
export async function resetLogging(): Promise<void> {
  await reset();
}

// Re-export types from LogTape for convenience
export type { Logger, LogLevel };
