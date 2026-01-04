/**
 * Shared utilities for subprocess templates
 *
 * These utilities are used by subprocess entry points (run.ts, list.ts)
 * for stdin/stdout communication with the parent process.
 *
 * IMPORTANT: This module must be self-contained with no relative imports
 * outside of _subprocess/. External dependencies are resolved at template
 * build time via JSR specifiers.
 *
 * @module
 * @internal
 */

import { configure, getConsoleSink, type LogLevel } from "@logtape/logtape";
import { getPrettyFormatter } from "@logtape/pretty";

/**
 * Configure LogTape logging for subprocess
 *
 * NOTE: This is intentionally duplicated from src/cli/utils.ts because
 * subprocess templates must be self-contained. Keep implementations in sync.
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

/**
 * Read all input from stdin
 *
 * Reads the entire stdin stream and returns it as a string.
 * Used to receive JSON input from the parent process.
 */
export async function readStdin(): Promise<string> {
  const decoder = new TextDecoder();
  const chunks: string[] = [];

  for await (const chunk of Deno.stdin.readable) {
    chunks.push(decoder.decode(chunk));
  }

  return chunks.join("");
}

/**
 * Write output to stdout as JSON line (NDJSON format)
 *
 * Serializes the output object to JSON and writes to stdout.
 * Each output is a single line for streaming.
 *
 * @param output - Object to serialize and write
 */
export function writeOutput(output: unknown): void {
  console.log(JSON.stringify(output));
}
