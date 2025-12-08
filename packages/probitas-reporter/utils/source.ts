import type { Source } from "@probitas/scenario";

export interface FormatSourceOptions {
  prefix?: string;
  suffix?: string;
}

export function formatSource(
  source?: Source,
  options: FormatSourceOptions = {},
): string {
  if (!source) {
    return "";
  }
  const { prefix = "", suffix = "" } = options;
  const { file, line, column } = source;
  if (column !== undefined && line !== undefined) {
    return `${prefix}${file}:${line}:${column}${suffix}`;
  } else if (line !== undefined) {
    return `${prefix}${file}:${line}${suffix}`;
  }
  return `${prefix}${file}${suffix}`;
}
