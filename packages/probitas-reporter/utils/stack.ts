/**
 * Sanitize file paths in error stack traces to make them environment-independent
 *
 * Replaces absolute file:// URLs with relative paths to ensure snapshots
 * are portable across different machines and CI environments.
 *
 * @param stack The error stack trace string
 * @returns Sanitized stack trace with normalized paths
 */
export function sanitizeStack(stack: string): string {
  // Replace file:// URLs with relative paths
  // Matches patterns like: file:///Users/name/project/src/file.ts:123:45
  // Replaces with: src/file.ts:123:45 (preserving only relative path from project root)
  return stack.replace(
    /file:\/\/\/[^\s]*\/(src\/[^\s:)]+)/g,
    "$1",
  );
}
