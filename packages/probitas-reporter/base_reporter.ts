/**
 * BaseReporter abstract class
 *
 * Provides common functionality for all Reporter implementations:
 * - Output stream management
 * - Console suppression/restoration based on log level
 * - NO_COLOR environment variable support
 * - Color function selection
 *
 * @module
 */

import { defaultTheme, noColorTheme } from "./theme.ts";
import type {
  Reporter,
  ReporterOptions,
  RunSummary,
  ScenarioDefinition,
  Theme,
} from "./types.ts";

/**
 * Abstract base class for all reporters
 *
 * Provides common functionality for output management and console control.
 * Subclasses override only the methods they need.
 */
export abstract class BaseReporter implements Reporter {
  protected output: WritableStream;
  protected theme: Theme;
  protected options: ReporterOptions;

  #writeQueue: Promise<void> = Promise.resolve();

  /**
   * Initialize the reporter
   *
   * @param options Configuration options
   */
  constructor(options: ReporterOptions = {}) {
    this.output = options.output ?? Deno.stderr.writable;

    const noColor = options.noColor ?? false;

    this.options = {
      output: this.output,
      logLevel: options.logLevel ?? "warning",
      noColor: noColor,
    };

    this.theme = options.theme ?? (noColor ? noColorTheme : defaultTheme);
  }

  /**
   * Write text to output stream
   *
   * Serializes all write operations to prevent "stream is already locked" errors
   * when multiple scenarios write concurrently.
   *
   * @param text Text to write
   */
  protected async write(text: string): Promise<void> {
    this.#writeQueue = this.#writeQueue.then(async () => {
      const writer = this.output.getWriter();
      try {
        await writer.write(new TextEncoder().encode(text));
      } finally {
        writer.releaseLock();
      }
    });
    await this.#writeQueue;
  }

  /**
   * Sanitize file paths in error stack traces to make them environment-independent
   *
   * Replaces absolute file:// URLs with relative paths to ensure snapshots
   * are portable across different machines and CI environments.
   *
   * @param stack The error stack trace string
   * @returns Sanitized stack trace with normalized paths
   */
  protected sanitizeStack(stack: string): string {
    // Replace file:// URLs with relative paths
    // Matches patterns like: file:///Users/name/project/src/file.ts:123:45
    // Replaces with: src/file.ts:123:45 (preserving only relative path from project root)
    return stack.replace(
      /file:\/\/\/[^\s]*\/(src\/[^\s:)]+)/g,
      "$1",
    );
  }

  /**
   * Called when test run starts
   *
   * @param _scenarios All scenarios to be run
   */
  onRunStart(_scenarios: readonly ScenarioDefinition[]): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Called when test run completes
   *
   * @param _summary Summary of test execution
   */
  onRunEnd(_summary: RunSummary): Promise<void> {
    return Promise.resolve();
  }
}
