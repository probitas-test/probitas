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

import { getLogger } from "@probitas/logger";
import { defaultTheme, noColorTheme } from "./theme.ts";
import type {
  Reporter,
  ReporterOptions,
  RunSummary,
  ScenarioDefinition,
  Theme,
} from "./types.ts";

const logger = getLogger("probitas", "reporter");

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

    logger.debug("Reporter initialized", {
      reporterType: this.constructor.name,
      options: this.options,
    });
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
    logger.debug("Queueing write operation", {
      byteLength: text.length,
      queueDepth: this.#writeQueue === Promise.resolve() ? 0 : 1,
    });

    this.#writeQueue = this.#writeQueue.then(async () => {
      logger.debug("Writing to stream", { byteLength: text.length });
      const writer = this.output.getWriter();
      try {
        await writer.write(new TextEncoder().encode(text));
        logger.debug("Write completed", { byteLength: text.length });
      } catch (error) {
        logger.error("Write failed", { error, byteLength: text.length });
        throw error;
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
    logger.debug("onRunStart event received", {
      scenarioCount: _scenarios.length,
      scenarios: _scenarios.map((s) => s.name),
    });
    return Promise.resolve();
  }

  /**
   * Called when test run completes
   *
   * @param _summary Summary of test execution
   */
  onRunEnd(_summary: RunSummary): Promise<void> {
    logger.debug("onRunEnd event received", {
      summary: _summary,
    });
    return Promise.resolve();
  }
}
