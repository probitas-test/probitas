/**
 * Type definitions for the Reporter layer
 *
 * Types for reporting and formatting test execution results.
 *
 * @module
 */

import type { LogLevel } from "@probitas/logger";

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

  /** Skipped state (e.g., skipped tests) */
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
   * Log level for console output suppression
   *
   * - "fatal": Suppress all output (only critical failures)
   * - "warning": Show warnings and errors (default)
   * - "info": Show informational messages, warnings, and errors
   * - "debug": Show all including debug messages
   */
  readonly logLevel?: LogLevel;

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

// Re-export types needed by reporter implementations and consumers
export type {
  Reporter,
  ResourceDefinition,
  RunSummary,
  ScenarioDefinition,
  ScenarioResult,
  SetupDefinition,
  StepDefinition,
  StepResult,
} from "@probitas/runner";
