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
        scenarios: scenarios.length,
      }) + "\n",
    );
  }

  /**
   * Called when scenario starts
   *
   * @param scenario The scenario being executed
   */
  override async onScenarioStart(scenario: ScenarioDefinition): Promise<void> {
    await this.write(
      JSON.stringify({
        type: "scenarioStart",
        name: scenario.name,
        location: scenario.location,
        tags: scenario.options.tags,
      }) + "\n",
    );
  }

  /**
   * Called when step starts
   *
   * @param step The step being executed
   */
  override async onStepStart(step: StepDefinition): Promise<void> {
    await this.write(
      JSON.stringify({
        type: "stepStart",
        name: step.name,
        location: step.location,
      }) + "\n",
    );
  }

  /**
   * Called when step completes
   *
   * @param _step The step definition
   * @param result The step execution result
   */
  override async onStepEnd(
    _step: StepDefinition,
    result: StepResult,
  ): Promise<void> {
    await this.write(
      JSON.stringify({
        type: "stepEnd",
        name: result.metadata.name,
        status: result.status,
        duration: result.duration,
      }) + "\n",
    );
  }

  /**
   * Called when step fails
   *
   * @param step The step definition
   * @param error The error that occurred
   */
  override async onStepError(
    step: StepDefinition,
    error: Error,
  ): Promise<void> {
    await this.write(
      JSON.stringify({
        type: "stepError",
        name: step.name,
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
  override async onScenarioEnd(
    scenario: ScenarioDefinition,
    result: ScenarioResult,
  ): Promise<void> {
    await this.write(
      JSON.stringify({
        type: "scenarioEnd",
        name: scenario.name,
        status: result.status,
        duration: result.duration,
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
        summary: {
          total: summary.total,
          passed: summary.passed,
          failed: summary.failed,
          duration: summary.duration,
        },
      }) + "\n",
    );
    await super.onRunEnd(summary);
  }
}
