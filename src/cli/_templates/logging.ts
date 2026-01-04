/**
 * Shared logging configuration for subprocess templates
 *
 * This module provides logging configuration that is shared between
 * subprocess templates and the main CLI. It must be self-contained
 * with no relative imports outside of _templates/.
 *
 * @module
 * @internal
 */

import { configure, getConsoleSink, type LogLevel } from "@logtape/logtape";
import { getPrettyFormatter } from "@logtape/pretty";

/**
 * Configure LogTape logging
 *
 * Sets up console logging with pretty formatting for Probitas CLI.
 * Safe to call multiple times - subsequent calls are silently ignored.
 *
 * @param level - Log level to use
 */
export async function configureLogging(level: LogLevel): Promise<void> {
  try {
    await configure({
      sinks: {
        console: getConsoleSink({
          formatter: getPrettyFormatter({
            timestamp: "disabled",
            colors: true,
            properties: true,
          }),
        }),
      },
      filters: {
        levelFilter: level,
        metaFilter: "warning",
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
    });
  } catch {
    // Ignore configuration errors (e.g., already configured)
  }
}
