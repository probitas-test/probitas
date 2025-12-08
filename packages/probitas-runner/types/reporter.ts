/**
 * Type definitions for the Runner layer
 *
 * Core types for executing scenario definitions and managing test lifecycle.
 * Re-exports scenario definition types from the scenario module.
 *
 * @module
 */

import type { ScenarioDefinition, StepDefinition } from "@probitas/scenario";
import type { ScenarioResult } from "./scenario.ts";
import type { StepResult } from "./step.ts";
import type { RunSummary } from "./run.ts";

/**
 * Reporter interface for observing and reporting test execution.
 *
 * Implement this interface to create custom reporters. All methods are
 * optional - implement only the hooks you need. Methods can be sync or async.
 *
 * Built-in reporters:
 * - {@linkcode ListReporter} - Detailed hierarchical output
 * - {@linkcode DotReporter} - Compact dot notation
 * - {@linkcode TAPReporter} - TAP format for CI integration
 * - {@linkcode JSONReporter} - Machine-readable JSON
 *
 * @example Custom reporter
 * ```ts
 * class MyReporter implements Reporter {
 *   onRunStart(scenarios) {
 *     console.log(`Running ${scenarios.length} scenarios...`);
 *   }
 *
 *   onScenarioEnd(scenario, result) {
 *     const icon = result.status === "passed" ? "✓" : "✗";
 *     console.log(`${icon} ${scenario.name}`);
 *   }
 *
 *   onRunEnd(summary) {
 *     console.log(`\n${summary.passed}/${summary.total} passed`);
 *   }
 * }
 * ```
 */
export interface Reporter {
  /**
   * Called when the test run starts, before any scenarios execute.
   *
   * @param scenarios - All scenarios that will be executed
   */
  onRunStart?(scenarios: readonly ScenarioDefinition[]): void | Promise<void>;

  /**
   * Called when a scenario begins execution.
   *
   * @param scenario - The scenario definition about to run
   */
  onScenarioStart?(scenario: ScenarioDefinition): void | Promise<void>;

  /**
   * Called when step starts
   *
   * @param step - The step definition being executed
   * @param scenario - The scenario containing the step (for parallel-safe reporting)
   */
  onStepStart?(
    step: StepDefinition,
    scenario: ScenarioDefinition,
  ): void | Promise<void>;

  /**
   * Called when step completes successfully
   *
   * @param step - The step definition that completed
   * @param result - The step execution result
   * @param scenario - The scenario containing the step (for parallel-safe reporting)
   */
  onStepEnd?(
    step: StepDefinition,
    result: StepResult,
    scenario: ScenarioDefinition,
  ): void | Promise<void>;

  /**
   * Called when step fails
   *
   * @param step - The step definition that failed
   * @param error - The error that occurred
   * @param duration - Step execution duration in milliseconds
   * @param scenario - The scenario containing the step (for parallel-safe reporting)
   */
  onStepError?(
    step: StepDefinition,
    error: Error,
    duration: number,
    scenario: ScenarioDefinition,
  ): void | Promise<void>;

  /**
   * Called when scenario is skipped
   *
   * @param scenario - The scenario that was skipped
   * @param reason - Optional skip reason
   * @param duration - Scenario execution duration in milliseconds
   */
  onScenarioSkip?(
    scenario: ScenarioDefinition,
    reason: string | undefined,
    duration: number,
  ): void | Promise<void>;

  /**
   * Called when scenario completes
   */
  onScenarioEnd?(
    scenario: ScenarioDefinition,
    result: ScenarioResult,
  ): void | Promise<void>;

  /**
   * Called when test run completes
   */
  onRunEnd?(summary: RunSummary): void | Promise<void>;
}
