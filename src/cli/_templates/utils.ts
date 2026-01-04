/**
 * Shared utilities for subprocess templates
 *
 * These utilities are used by subprocess entry points (run.ts, list.ts)
 * for stdin/stdout communication with the parent process.
 *
 * IMPORTANT: This module must be self-contained with no relative imports
 * outside of _templates/. External dependencies are resolved at template
 * build time via JSR specifiers.
 *
 * @module
 * @internal
 */

export { configureLogging } from "./logging.ts";

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
