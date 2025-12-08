/**
 * BaseReporter abstract class
 *
 * Provides common functionality for all Reporter implementations:
 * - Output stream management with serialized writes
 * - Theme selection (colored or plain text)
 * - Stack trace sanitization for portable output
 *
 * @module
 */

import { getLogger } from "@probitas/logger";
import { defaultTheme, noColorTheme } from "./theme.ts";
import type { ScenarioDefinition } from "@probitas/scenario";
import type { Reporter, RunSummary } from "@probitas/runner";
import type { ReporterOptions, Theme } from "./types.ts";

const logger = getLogger("probitas", "reporter");

/**
 * Abstract base class for all reporter implementations.
 *
 * Provides common functionality that all reporters need:
 * - Output stream management with serialized writes
 * - Theme selection (colored or plain)
 * - Stack trace sanitization for portable output
 *
 * Subclasses should override the reporter hook methods they need
 * (e.g., `onStepEnd`, `onScenarioEnd`, `onRunEnd`).
 *
 * @example Creating a custom reporter
 * ```ts
 * class MyReporter extends BaseReporter {
 *   async onScenarioEnd(scenario, result) {
 *     const icon = result.status === "passed" ? "✓" : "✗";
 *     await this.write(`${icon} ${scenario.name}\n`);
 *   }
 *
 *   async onRunEnd(summary) {
 *     await this.write(`\n${summary.passed}/${summary.total} passed\n`);
 *   }
 * }
 * ```
 *
 * @see {@linkcode ListReporter} for a detailed hierarchical reporter
 * @see {@linkcode DotReporter} for a compact progress reporter
 */
export abstract class BaseReporter implements Reporter {
  /** Output stream for writing results */
  protected output: WritableStream;

  /** Theme for styling output text */
  protected theme: Theme;

  /** Reporter configuration options */
  protected options: ReporterOptions;

  #writeQueue: Promise<void> = Promise.resolve();

  /**
   * Initialize the reporter with the given options.
   *
   * @param options - Configuration options for output and styling
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
   * Write text to the output stream.
   *
   * Serializes all write operations to prevent "stream is already locked" errors
   * when multiple scenarios run concurrently. Each write is queued and executed
   * in order.
   *
   * @param text - Text to write (will be UTF-8 encoded)
   *
   * @example
   * ```ts
   * await this.write("✓ Test passed\n");
   * await this.write(this.theme.success("PASSED") + "\n");
   * ```
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
