import type { Source } from "@probitas/scenario";

export interface FormatSourceOptions {
  prefix?: string;
  suffix?: string;
  /**
   * Base directory to make paths relative to.
   * If provided, absolute paths will be converted to relative paths.
   */
  cwd?: string;
}

/**
 * Format a source location for display.
 *
 * @param source - The source location to format
 * @param options - Formatting options
 * @returns Formatted string like "(file.ts:42)" or empty string if no source
 */
export function formatSource(
  source?: Source,
  options: FormatSourceOptions = {},
): string {
  if (!source) {
    return "";
  }
  const { prefix = "", suffix = "", cwd } = options;
  let { file } = source;
  const { line, column } = source;

  // Convert absolute path to relative if cwd is provided
  if (cwd && file.startsWith(cwd)) {
    file = file.slice(cwd.length + 1);
  }

  if (column !== undefined && line !== undefined) {
    return `${prefix}${file}:${line}:${column}${suffix}`;
  } else if (line !== undefined) {
    return `${prefix}${file}:${line}${suffix}`;
  }
  return `${prefix}${file}${suffix}`;
}
