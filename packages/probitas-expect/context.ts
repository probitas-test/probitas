/**
 * Source code context utilities for expectation error messages.
 *
 * This module provides utilities to capture call sites and format
 * source code context for more informative error messages.
 *
 * @module
 */

import type { Origin } from "@probitas/core/origin";
import { formatOrigin } from "@probitas/core/origin";
import { captureStack } from "@probitas/core/stack";
import type { Theme } from "@probitas/core/theme";

/**
 * Source code context information for error messages.
 */
export interface SourceContext {
  /** The starting position (expect() call site) */
  readonly start: Origin;
  /** The ending position (matcher call site) */
  readonly end: Origin;
  /** Formatted source code lines with line numbers */
  readonly content: readonly string[];
  /** Whether middle lines were omitted */
  readonly hasEllipsis: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** Default number of lines to show before start and after end */
const CONTEXT_LINES = 1;

/** Distance threshold for ellipsis (if distance > this, show ellipsis) */
const ELLIPSIS_THRESHOLD = 5;

/** Line number separator */
const SEPARATOR = "│";

/** Ellipsis separator (dotted line) */
const ELLIPSIS_SEPARATOR = "┆";

// ============================================================================
// File Cache
// ============================================================================

const fileCache = new Map<string, readonly string[]>();

/**
 * Read source file lines with caching.
 */
function readSourceLines(path: string): readonly string[] | null {
  if (fileCache.has(path)) {
    return fileCache.get(path)!;
  }
  try {
    const content = Deno.readTextFileSync(path);
    const lines = content.split("\n");
    fileCache.set(path, lines);
    return lines;
  } catch {
    return null;
  }
}

/**
 * Check if a path belongs to probitas packages (excluding test files).
 */
function isProbitasPath(path: string): boolean {
  // Test files are not considered internal
  if (path.endsWith("_test.ts") || path.endsWith(".test.ts")) {
    return false;
  }
  return /probitas[-_]/.test(path) || path.includes("@probitas/");
}

/**
 * Capture the current call site origin.
 *
 * Returns the first user code frame (not inside probitas packages).
 * Test files are not considered internal packages.
 */
export function captureOrigin(): Origin | undefined {
  const frames = captureStack();

  for (const frame of frames) {
    if (frame.user && !isProbitasPath(frame.path)) {
      return {
        path: frame.path,
        line: frame.line,
        column: frame.column,
      };
    }
  }
  return undefined;
}

// ============================================================================
// Line Formatting
// ============================================================================

/**
 * Format a single source line with line number.
 */
function formatLine(
  lineNumber: number,
  content: string,
  lineNumWidth: number,
): string {
  const lineNumStr = String(lineNumber).padStart(lineNumWidth);
  return `${lineNumStr}${SEPARATOR} ${content}`;
}

/**
 * Format a marker line (caret indicator).
 */
function formatMarker(
  column: number | undefined,
  lineNumWidth: number,
): string {
  const padding = " ".repeat(lineNumWidth);
  const offset = column !== undefined ? column - 1 : 0;
  return `${padding}${SEPARATOR} ${" ".repeat(offset)}^`;
}

/**
 * Format ellipsis line (dotted separator only).
 */
function formatEllipsis(lineNumWidth: number): string {
  const padding = " ".repeat(lineNumWidth);
  return `${padding}${ELLIPSIS_SEPARATOR}`;
}

/**
 * Get source code context between two origins.
 *
 * @param start - The starting position (expect() call site)
 * @param end - The ending position (matcher call site)
 * @param options - Display options
 */
export function getSourceContext(
  start: Origin,
  end: Origin,
  options?: {
    /** Distance threshold for ellipsis (default: 5) */
    ellipsisThreshold?: number;
  },
): SourceContext | null {
  // Must be same file
  if (start.path !== end.path) {
    return null;
  }

  // Must have line numbers
  if (start.line === undefined || end.line === undefined) {
    return null;
  }

  const lines = readSourceLines(start.path);
  if (!lines) {
    return null;
  }

  const threshold = options?.ellipsisThreshold ?? ELLIPSIS_THRESHOLD;
  const startLine = start.line;
  const endLine = end.line;
  const distance = endLine - startLine;
  const hasEllipsis = distance > threshold;

  // Calculate line ranges
  const startRangeBegin = Math.max(1, startLine - CONTEXT_LINES);
  const startRangeEnd = startLine + CONTEXT_LINES;
  const endRangeBegin = endLine - CONTEXT_LINES;
  const endRangeEnd = Math.min(lines.length, endLine + CONTEXT_LINES);

  // Pre-calculate line number width once
  const lineNumWidth = String(endRangeEnd).length;
  const content: string[] = [];

  // Helper to append lines in a range with optional marker
  const appendLines = (from: number, to: number) => {
    for (let i = from; i <= to; i++) {
      content.push(formatLine(i, lines[i - 1], lineNumWidth));
      if (i === endLine) {
        content.push(formatMarker(end.column, lineNumWidth));
      }
    }
  };

  if (hasEllipsis) {
    // Show start range, ellipsis, then end range
    appendLines(startRangeBegin, startRangeEnd);
    content.push(formatEllipsis(lineNumWidth));
    appendLines(Math.max(endRangeBegin, startRangeEnd + 1), endRangeEnd);
  } else {
    // Show continuous range
    appendLines(startRangeBegin, endRangeEnd);
  }

  return {
    start,
    end,
    content,
    hasEllipsis,
  };
}

/**
 * Format source context as a string for error messages.
 *
 * Output format (with theme):
 * ```
 * **Context** (dim:path:line:col)
 *
 *   dim:123│ code line
 *   dim:   │     ^
 * ```
 *
 * @param ctx - The source context to format
 * @param options - Formatting options
 */
export function formatSourceContext(
  ctx: SourceContext,
  options?: {
    /** Base directory to make paths relative */
    cwd?: string;
    /** Theme for styling */
    theme?: Theme;
  },
): string {
  const { cwd, theme } = options ?? {};
  const location = formatOrigin(ctx.start, { cwd });

  // Format header: "Context" is bold, "(path)" is dim
  const header = theme
    ? `${theme.title("Context")} ${theme.dim(`(${location})`)}`
    : `Context (${location})`;

  // Format body: add 2-space indent and apply styling
  // Marker lines (ending with ^) get red color, others get dim
  let body: string;
  if (theme) {
    body = ctx.content.map((line) => {
      if (line.trimEnd().endsWith("^")) {
        // Marker line: dim the prefix, red for the caret
        const caretIndex = line.lastIndexOf("^");
        const prefix = line.slice(0, caretIndex);
        return `  ${theme.dim(prefix)}${theme.failure("^")}`;
      }
      return `  ${theme.dim(line)}`;
    }).join("\n");
  } else {
    body = ctx.content.map((line) => `  ${line}`).join("\n");
  }

  return `${header}\n\n${body}`;
}
