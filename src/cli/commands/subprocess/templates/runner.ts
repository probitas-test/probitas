/**
 * Runner subprocess entry point for scenario execution
 *
 * This file is executed as a subprocess via `deno run`.
 * It reads commands from stdin and writes results to stdout.
 * Each message is a line of JSON.
 *
 * @module
 */

import { TextLineStream } from "@std/streams";
import type { ScenarioMetadata, StepMetadata } from "@probitas/core";
import { loadScenarios } from "@probitas/core/loader";
import { configure, getConsoleSink, getLogger } from "@logtape/logtape";
import { getPrettyFormatter } from "@logtape/pretty";
import type { Reporter, ScenarioResult, StepResult } from "@probitas/runner";
import { Runner } from "@probitas/runner";
import {
  serializeError,
  serializeScenarioResult,
  serializeStepResult,
  type RunnerInput,
  type RunnerOutput,
  type RunInput,
} from "./protocol.ts";

const logger = getLogger(["probitas", "cli", "subprocess"]);
const encoder = new TextEncoder();

/**
 * Create a reporter that sends events to main process via stdout
 */
function createRunnerReporter(taskId: string): Reporter {
  return {
    onScenarioStart(scenario: ScenarioMetadata): void {
      writeOutput({
        type: "scenario_start",
        taskId,
        scenario,
      }).catch((error) => {
        logger.error("Failed to send scenario_start", { error });
      });
    },
    onScenarioEnd(
      scenario: ScenarioMetadata,
      result: ScenarioResult,
    ): void {
      writeOutput({
        type: "scenario_end",
        taskId,
        scenario,
        result: serializeScenarioResult(result),
      }).catch((error) => {
        logger.error("Failed to send scenario_end", { error });
      });
    },
    onStepStart(scenario: ScenarioMetadata, step: StepMetadata): void {
      writeOutput({
        type: "step_start",
        taskId,
        scenario,
        step,
      }).catch((error) => {
        logger.error("Failed to send step_start", { error });
      });
    },
    onStepEnd(
      scenario: ScenarioMetadata,
      step: StepMetadata,
      result: StepResult,
    ): void {
      writeOutput({
        type: "step_end",
        taskId,
        scenario,
        step,
        result: serializeStepResult(result),
      }).catch((error) => {
        logger.error("Failed to send step_end", { error });
      });
    },
  };
}

/**
 * Write a message to stdout as a line of JSON
 */
async function writeOutput(output: RunnerOutput): Promise<void> {
  const json = JSON.stringify(output) + "\n";
  await Deno.stdout.write(encoder.encode(json));
}

/**
 * Create a timeout signal
 */
function createTimeoutSignal(timeout: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller.signal;
}

/**
 * Execute a scenario from file
 */
async function runScenario(input: RunInput): Promise<void> {
  const { taskId, filePath, scenarioIndex, timeout, logLevel } = input;

  // Configure logging in subprocess if log level is provided
  // Use stderr to avoid mixing with JSON protocol on stdout
  if (logLevel) {
    // Create console object that writes to stderr
    const stderrConsole = {
      ...console,
      debug: console.error,
      info: console.error,
      warn: console.error,
      error: console.error,
    };

    await configure({
      sinks: {
        stderr: getConsoleSink({
          console: stderrConsole as Console,
          formatter: getPrettyFormatter({
            timestamp: "disabled",
            colors: true,
            properties: true,
          }),
        }),
      },
      filters: {
        levelFilter: logLevel,
        metaFilter: "warning",
      },
      loggers: [
        {
          category: ["probitas"],
          filters: ["levelFilter"],
          sinks: ["stderr"],
        },
        {
          category: [],
          filters: ["metaFilter"],
          sinks: ["stderr"],
        },
      ],
    });
  }

  logger.debug("Running scenario", { taskId, filePath, scenarioIndex });

  try {
    // Load scenarios from file
    const scenarios = await loadScenarios([filePath], {
      onImportError: (file, err) => {
        const m = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to import scenario file ${file}: ${m}`);
      },
    });

    // Get the specific scenario by index
    const scenario = scenarios[scenarioIndex];
    if (!scenario) {
      throw new Error(
        `Scenario index ${scenarioIndex} not found in ${filePath}`,
      );
    }

    // Create reporter that sends events to stdout
    const reporter = createRunnerReporter(taskId);

    // Create timeout signal if needed
    const signal = timeout ? createTimeoutSignal(timeout) : undefined;

    // Run scenario
    const runner = new Runner(reporter);
    const runResult = await runner.run([scenario], { signal });

    // Send result
    await writeOutput({
      type: "result",
      taskId,
      result: serializeScenarioResult(runResult.scenarios[0]),
    });

    logger.debug("Scenario completed", {
      taskId,
      status: runResult.scenarios[0].status,
    });
  } catch (error) {
    logger.debug("Scenario failed", { taskId, error });

    // Send error
    await writeOutput({
      type: "error",
      taskId,
      error: serializeError(error),
    });
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Set up stdin stream for line-by-line JSON
    const lines = Deno.stdin.readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());

    // Send ready message
    await writeOutput({ type: "ready" });

    // Command loop
    for await (const line of lines) {
      try {
        const input = JSON.parse(line) as RunnerInput;

        if (input.type === "terminate") {
          logger.debug("Received terminate command");
          break;
        }

        if (input.type === "run") {
          await runScenario(input);
        }
      } catch (error) {
        logger.error("Failed to process input", { error, line });
      }
    }
  } catch (error) {
    logger.error("Subprocess worker crashed", { error });
    Deno.exit(1);
  }
}

// Run main if this is the entry point
if (import.meta.main) {
  await main();
}
