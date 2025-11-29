/**
 * TAP (Test Anything Protocol) Reporter
 *
 * Outputs test results in TAP version 14 format, suitable for CI/CD integration
 * and tool compatibility.
 *
 * @module
 */

import { BaseReporter } from "./base_reporter.ts";
import type {
  ReporterOptions,
  ScenarioDefinition,
  ScenarioResult,
  StepDefinition,
  StepResult,
} from "./types.ts";

/**
 * TAP Reporter - outputs Test Anything Protocol version 14 format
 */
export class TAPReporter extends BaseReporter {
  #testNumber = 0;
  #totalSteps = 0;
  #currentScenario?: string;

  /**
   * Initialize TAP reporter
   *
   * @param options Configuration options
   */
  constructor(options: ReporterOptions = {}) {
    super(options);
  }

  /**
   * Called when test run starts - outputs TAP header and test count
   *
   * @param scenarios All scenarios to be run
   */
  override async onRunStart(
    scenarios: readonly ScenarioDefinition[],
  ): Promise<void> {
    await super.onRunStart(scenarios);

    // Calculate total number of steps
    this.#totalSteps = scenarios.reduce(
      (sum, s) => sum + s.entries.filter((e) => e.kind === "step").length,
      0,
    );

    await this.write("TAP version 14\n");
    await this.write(`1..${this.#totalSteps}\n`);
  }

  /**
   * Called when scenario starts - track current scenario name
   *
   * @param scenario The scenario being executed
   */
  override onScenarioStart(scenario: ScenarioDefinition): Promise<void> {
    this.#currentScenario = scenario.name;
    return Promise.resolve();
  }

  /**
   * Called when step completes - output TAP result
   *
   * @param step The step definition
   * @param result The step execution result
   */
  override async onStepEnd(
    _step: StepDefinition,
    result: StepResult,
  ): Promise<void> {
    this.#testNumber++;
    const status = result.status === "passed" ? "ok" : "not ok";
    const testName = `${this.#currentScenario} > ${result.metadata.name}`;

    await this.write(`${status} ${this.#testNumber} - ${testName}\n`);

    // Output YAML diagnostic for failed tests
    if (result.status === "failed") {
      await this.write("  ---\n");

      const location = result.metadata.location
        ? `${result.metadata.location.file}:${result.metadata.location.line}`
        : "unknown";

      await this.write(`  location: ${location}\n`);

      if (result.error) {
        await this.write(`  message: ${result.error.message}\n`);

        if (result.error.stack) {
          const sanitizedStack = this.sanitizeStack(result.error.stack);
          await this.write(`  stack: |\n`);
          for (const line of sanitizedStack.split("\n")) {
            await this.write(`    ${line}\n`);
          }
        }
      }

      await this.write("  ...\n");
    }
  }

  // No-op methods for unneeded events
  override async onStepStart(_step: StepDefinition): Promise<void> {
    // no-op
  }

  override async onStepError(
    _step: StepDefinition,
    _error: Error,
  ): Promise<void> {
    // no-op
  }

  override async onScenarioEnd(
    _scenario: ScenarioDefinition,
    _result: ScenarioResult,
  ): Promise<void> {
    // no-op
  }
}
