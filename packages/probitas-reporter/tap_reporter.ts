/**
 * TAP (Test Anything Protocol) Reporter
 *
 * Outputs test results in TAP version 14 format, suitable for CI/CD integration
 * and tool compatibility.
 *
 * @module
 */

import { BaseReporter } from "./base_reporter.ts";
import type { ScenarioDefinition, StepDefinition } from "@probitas/scenario";
import type { RunSummary, StepResult } from "@probitas/runner";
import type { ReporterOptions } from "./types.ts";

/**
 * TAP Reporter - outputs Test Anything Protocol version 14 format
 */
export class TAPReporter extends BaseReporter {
  #testNumber = 0;
  #totalSteps = 0;
  #skippedScenarioSteps: Map<string, number> = new Map();

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

    // Store step counts per scenario for skip handling
    for (const scenario of scenarios) {
      const stepCount = scenario.steps.filter((e) => e.kind === "step").length;
      this.#skippedScenarioSteps.set(scenario.name, stepCount);
    }

    // Calculate total number of steps
    this.#totalSteps = scenarios.reduce(
      (sum, s) => sum + s.steps.filter((e) => e.kind === "step").length,
      0,
    );

    await this.write("TAP version 14\n");
    await this.write(`1..${this.#totalSteps}\n`);
  }

  /**
   * Called when step completes - output TAP result
   *
   * @param _step The step definition
   * @param result The step execution result
   * @param scenario The scenario being executed
   */
  async onStepEnd(
    _step: StepDefinition,
    result: StepResult,
    scenario: ScenarioDefinition,
  ): Promise<void> {
    this.#testNumber++;
    const status = result.status === "passed" ? "ok" : "not ok";
    const testName = `${scenario.name} > ${result.metadata.name}`;

    await this.write(`${status} ${this.#testNumber} - ${testName}\n`);

    // Output YAML diagnostic for failed tests
    if (result.status === "failed") {
      await this.write("  ---\n");

      const source = result.metadata.source
        ? `${result.metadata.source.file}:${result.metadata.source.line}`
        : "unknown";

      await this.write(`  source: ${source}\n`);

      if (result.error) {
        const m = result.error instanceof Error
          ? result.error.message
          : String(result.error);
        await this.write(`  message: ${m}\n`);

        if (result.error instanceof Error && result.error.stack) {
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

  /**
   * Called when scenario is skipped - output SKIP directive for all steps
   *
   * @param scenario The scenario that was skipped
   * @param reason Optional skip reason
   * @param _duration Scenario execution duration (not used in TAP format)
   */
  async onScenarioSkip(
    scenario: ScenarioDefinition,
    reason: string | undefined,
    _duration: number,
  ): Promise<void> {
    const stepCount = this.#skippedScenarioSteps.get(scenario.name) ?? 0;
    const directive = reason ? `# SKIP ${reason}` : "# SKIP";

    // Output skip for each step in the scenario
    for (let i = 0; i < stepCount; i++) {
      this.#testNumber++;
      await this.write(
        `ok ${this.#testNumber} - ${scenario.name} ${directive}\n`,
      );
    }
  }

  /**
   * Called when test run completes - reset state
   *
   * @param summary The execution summary
   */
  override async onRunEnd(summary: RunSummary): Promise<void> {
    this.#skippedScenarioSteps.clear();
    await super.onRunEnd(summary);
  }
}
