/**
 * BaseReporter abstract class
 *
 * Provides common functionality for all Reporter implementations:
 * - Output stream management
 * - Console suppression/restoration based on verbosity
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
  ScenarioResult,
  StepDefinition,
  StepResult,
  Theme,
} from "./types.ts";

/**
 * Abstract base class for all reporters
 *
 * Provides common functionality for output management and console control.
 * Subclasses must implement the abstract methods.
 */
export abstract class BaseReporter implements Reporter {
  protected output: WritableStream;
  protected theme: Theme;
  protected options: ReporterOptions;

  #originalConsole = {
    error: console.error,
    warn: console.warn,
    log: console.log,
    info: console.info,
    debug: console.debug,
  };

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
      verbosity: options.verbosity ?? "normal",
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
   * Suppress console output based on verbosity level
   *
   * - "quiet": Suppress all console output
   * - "normal": Suppress log/info/debug, allow error/warn
   * - "verbose": Suppress debug, allow error/warn/log/info
   * - "debug": Allow all console output
   */
  protected suppressConsole(): void {
    const verbosity = this.options.verbosity ?? "normal";

    switch (verbosity) {
      case "quiet":
        console.error =
          console.warn =
          console.log =
          console.info =
          console.debug =
            () => {};
        break;
      case "normal":
        console.log = console.info = console.debug = () => {};
        break;
      case "verbose":
        console.debug = () => {};
        break;
      case "debug":
        // Do not suppress anything
        break;
    }
  }

  /**
   * Restore console output to original functions
   */
  protected restoreConsole(): void {
    Object.assign(console, this.#originalConsole);
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
   * Subclasses should call super.onRunStart() to ensure console suppression
   *
   * @param _scenarios All scenarios to be run
   */
  onRunStart(_scenarios: readonly ScenarioDefinition[]): Promise<void> {
    this.suppressConsole();
    return Promise.resolve();
  }

  /**
   * Called when scenario starts (to be implemented by subclass)
   */
  abstract onScenarioStart(scenario: ScenarioDefinition): void | Promise<void>;

  /**
   * Called when step starts (to be implemented by subclass)
   */
  abstract onStepStart(step: StepDefinition): void | Promise<void>;

  /**
   * Called when step completes successfully (to be implemented by subclass)
   */
  abstract onStepEnd(
    step: StepDefinition,
    result: StepResult,
  ): void | Promise<void>;

  /**
   * Called when step fails (to be implemented by subclass)
   */
  abstract onStepError(
    step: StepDefinition,
    error: Error,
  ): void | Promise<void>;

  /**
   * Called when scenario completes (to be implemented by subclass)
   */
  abstract onScenarioEnd(
    scenario: ScenarioDefinition,
    result: ScenarioResult,
  ): void | Promise<void>;

  /**
   * Called when test run completes
   *
   * Subclasses should call super.onRunEnd() to ensure console restoration
   *
   * @param _summary Summary of test execution
   */
  onRunEnd(_summary: RunSummary): Promise<void> {
    this.restoreConsole();
    return Promise.resolve();
  }
}
