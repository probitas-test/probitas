import type { ScenarioMetadata, StepMetadata } from "@probitas/core";
import type { ScenarioResult } from "./scenario.ts";
import type { StepResult } from "./step.ts";
import type { RunResult } from "./run.ts";

/**
 * Reporter interface for receiving test execution events.
 *
 * All callbacks receive serializable metadata types (ScenarioMetadata, StepMetadata)
 * instead of definition types, enabling use across process/thread boundaries
 * (e.g., Web Workers).
 */
export interface Reporter {
  /**
   * Called when the test run starts, before any scenarios execute.
   */
  onRunStart?(scenarios: readonly ScenarioMetadata[]): void | Promise<void>;

  /**
   * Called when test run completes
   */
  onRunEnd?(
    scenarios: readonly ScenarioMetadata[],
    result: RunResult,
  ): void | Promise<void>;

  /**
   * Called when a scenario begins execution.
   */
  onScenarioStart?(scenario: ScenarioMetadata): void | Promise<void>;

  /**
   * Called when scenario completes
   */
  onScenarioEnd?(
    scenario: ScenarioMetadata,
    result: ScenarioResult,
  ): void | Promise<void>;

  /**
   * Called when step starts
   */
  onStepStart?(
    scenario: ScenarioMetadata,
    step: StepMetadata,
  ): void | Promise<void>;

  /**
   * Called when step completes (passed, failed, or skipped).
   *
   * The result contains status-specific information:
   * - If status is "passed": contains `value` from step execution
   * - If status is "failed" or "skipped": contains `error` information
   */
  onStepEnd?(
    scenario: ScenarioMetadata,
    step: StepMetadata,
    result: StepResult,
  ): void | Promise<void>;
}
