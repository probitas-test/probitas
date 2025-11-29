/**
 * JSON Reporter
 *
 * Outputs test results in JSONLine format (one JSON object per line)
 * for easy parsing and integration with external tools.
 *
 * @module
 */

import { BaseReporter } from "./base_reporter.ts";
import type {
  ReporterOptions,
  RunSummary,
  ScenarioDefinition,
  ScenarioResult,
  StepDefinition,
  StepResult,
} from "./types.ts";

/**
 * JSON Reporter - outputs results in JSONLine format
 */
export class JSONReporter extends BaseReporter {
  /**
   * Initialize JSON reporter
   *
   * @param options Configuration options
   */
  constructor(options: ReporterOptions = {}) {
    super(options);
  }

  /**
   * Called when test run starts
   *
   * @param scenarios All scenarios to be run
   */
  override async onRunStart(
    scenarios: readonly ScenarioDefinition[],
  ): Promise<void> {
    await super.onRunStart(scenarios);
    await this.write(
      JSON.stringify({
        type: "runStart",
        scenarios,
      }) + "\n",
    );
  }

  /**
   * Called when scenario starts
   *
   * @param scenario The scenario being executed
   */
  async onScenarioStart(scenario: ScenarioDefinition): Promise<void> {
    await this.write(
      JSON.stringify({
        type: "scenarioStart",
        scenario,
      }) + "\n",
    );
  }

  /**
   * Called when step starts
   *
   * @param step The step being executed
   * @param scenario The scenario being executed
   */
  async onStepStart(
    step: StepDefinition,
    scenario: ScenarioDefinition,
  ): Promise<void> {
    await this.write(
      JSON.stringify({
        type: "stepStart",
        step,
        scenario,
      }) + "\n",
    );
  }

  /**
   * Called when step completes
   *
   * @param _step The step definition
   * @param result The step execution result
   * @param scenario The scenario being executed
   */
  async onStepEnd(
    step: StepDefinition,
    result: StepResult,
    scenario: ScenarioDefinition,
  ): Promise<void> {
    await this.write(
      JSON.stringify({
        type: "stepEnd",
        step,
        result,
        scenario,
      }) + "\n",
    );
  }

  /**
   * Called when step fails
   *
   * @param step The step definition
   * @param error The error that occurred
   * @param scenario The scenario being executed
   */
  async onStepError(
    step: StepDefinition,
    error: Error,
    scenario: ScenarioDefinition,
  ): Promise<void> {
    await this.write(
      JSON.stringify({
        type: "stepError",
        step,
        scenario,
        error: {
          message: error.message,
          stack: error.stack ? this.sanitizeStack(error.stack) : undefined,
        },
      }) + "\n",
    );
  }

  /**
   * Called when scenario completes
   *
   * @param scenario The scenario definition
   * @param result The scenario execution result
   */
  async onScenarioEnd(
    scenario: ScenarioDefinition,
    result: ScenarioResult,
  ): Promise<void> {
    await this.write(
      JSON.stringify({
        type: "scenarioEnd",
        scenario,
        result,
      }) + "\n",
    );
  }

  /**
   * Called when test run completes
   *
   * @param summary The execution summary
   */
  override async onRunEnd(summary: RunSummary): Promise<void> {
    await this.write(
      JSON.stringify({
        type: "runEnd",
        summary,
      }) + "\n",
    );
    await super.onRunEnd(summary);
  }
}
