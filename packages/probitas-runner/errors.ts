/**
 * Error classes for the Runner layer
 *
 * Specialized error types for different failure scenarios during test execution.
 *
 * @module
 */

import type { ScenarioDefinition, StepDefinition } from "./types.ts";

/**
 * Error that occurs during scenario execution
 */
export class ScenarioError extends Error {
  /**
   * Create a scenario error
   *
   * @param message Error message
   * @param scenario The scenario that failed
   * @param cause The underlying error (if any)
   */
  constructor(
    message: string,
    public readonly scenario: ScenarioDefinition,
    public override readonly cause?: Error,
  ) {
    super(message);
    this.name = "ScenarioError";
  }
}

/**
 * Error that occurs during step execution
 */
export class StepError extends Error {
  /**
   * Create a step error
   *
   * @param message Error message
   * @param step The step that failed
   * @param attempt Attempt number (1-based)
   * @param cause The underlying error (if any)
   */
  constructor(
    message: string,
    public readonly step: StepDefinition,
    public readonly attempt: number,
    public override readonly cause?: Error,
  ) {
    super(message);
    this.name = "StepError";
  }
}

/**
 * Error that occurs when a step exceeds its timeout
 */
export class TimeoutError extends Error {
  /**
   * Create a timeout error
   *
   * @param message Error message
   * @param timeout The timeout value in milliseconds
   */
  constructor(
    message: string,
    public readonly timeout: number,
  ) {
    super(message);
    this.name = "TimeoutError";
  }
}
