/**
 * Type definitions for the Reporter layer
 *
 * Types for reporting and formatting test execution results.
 *
 * @module
 */

/**
 * Theme function for terminal output
 */
export type ThemeFunction = (text: string) => string;

/**
 * Theme interface - semantic color functions
 */
export interface Theme {
  /** Success state (e.g., passed tests) */
  readonly success: ThemeFunction;

  /** Failure state (e.g., failed tests) */
  readonly failure: ThemeFunction;

  /** Skip/pending state */
  readonly skip: ThemeFunction;

  /** Dimmed/secondary information (e.g., file paths, timestamps) */
  readonly dim: ThemeFunction;

  /** Title/header text */
  readonly title: ThemeFunction;

  /** Information/neutral text */
  readonly info: ThemeFunction;

  /** Warning state */
  readonly warning: ThemeFunction;
}

/**
 * Options for reporter initialization
 */
export interface ReporterOptions {
  /**
   * Output stream for writing results
   * Defaults to Deno.stderr.writable
   */
  readonly output?: WritableStream;

  /**
   * Verbosity level for console output suppression
   *
   * - "quiet": Suppress all output
   * - "normal": Show error/warn only (default)
   * - "verbose": Show error/warn/log/info
   * - "debug": Show all including debug
   */
  readonly verbosity?: "quiet" | "normal" | "verbose" | "debug";

  /**
   * Disable colored output
   *
   * Automatically set to true if NO_COLOR environment variable is present.
   */
  readonly noColor?: boolean;

  /**
   * Custom theme for output formatting
   */
  readonly theme?: Theme;
}

// Re-export
export type {
  Reporter,
  ReporterConstructor,
  RunSummary,
  ScenarioDefinition,
  ScenarioResult,
  StepDefinition,
  StepResult,
} from "../runner/types.ts";
