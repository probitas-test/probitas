/**
 * Utility for capturing source code locations from stack traces
 *
 * @module
 */

import type { SourceLocation } from "../runner/types.ts";

/**
 * Parse a single stack trace line to extract file location
 *
 * Supports two common V8 stack trace formats:
 * - With function name: "at functionName (file:///path/to/file.ts:123:45)"
 * - Without function name: "at file:///path/to/file.ts:123:45"
 *
 * @param line - Single line from stack trace
 * @param cwd - Current working directory for making paths relative
 * @returns Source location or undefined if line doesn't match expected format
 *
 * @internal
 */
export function parseStackLine(
  line: string,
  cwd: string,
): SourceLocation | undefined {
  // Try format with parentheses first: "at functionName (file:///path:line:col)"
  let match = line.match(/\((file:\/\/[^:]+):(\d+):/);

  if (!match) {
    // Try format without parentheses: "at file:///path:line:col"
    match = line.match(/at\s+(file:\/\/[^:]+):(\d+):/);
  }

  if (!match) {
    return undefined;
  }

  let [, file, lineNum] = match;

  // Remove file:// prefix
  if (file.startsWith("file://")) {
    file = file.slice(7);
  }

  // Make relative to current working directory
  if (file.startsWith(cwd)) {
    file = file.slice(cwd.length + 1);
  }

  return {
    file,
    line: parseInt(lineNum, 10),
  };
}

/**
 * Capture current source location for better error messages
 *
 * Parses the JavaScript stack trace to extract file path and line number
 * of the calling code. Useful for providing context in error messages and logs.
 *
 * @param depth - Stack depth to skip (default 2)
 * @returns Source location or undefined if unable to determine
 *
 * @example
 * ```ts
 * function myFunction() {
 *   // Captures location of caller (depth=2 skips captureSourceLocation and myFunction)
 *   const location = captureSourceLocation(2);
 *   console.log(`Called from ${location?.file}:${location?.line}`);
 * }
 * ```
 */
export function captureSourceLocation(
  depth = 2,
): SourceLocation | undefined {
  try {
    const err = new Error();
    const stack = err.stack;

    if (!stack) {
      return undefined;
    }

    const stackLines = stack.split("\n");
    const cwd = Deno.cwd();

    const skipLines = depth + 1;
    for (let i = skipLines; i < stackLines.length; i++) {
      const location = parseStackLine(stackLines[i], cwd);
      if (location) {
        return location;
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}
