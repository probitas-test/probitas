/**
 * Subprocess entry point for running scenarios
 *
 * Receives configuration as JSON via stdin and executes scenarios
 * in a subprocess with the project's deno.json configuration.
 *
 * @module
 */

import { as, ensure, is, type Predicate } from "@core/unknownutil";
import { applySelectors, loadScenarios } from "@probitas/scenario";
import type { ReporterOptions } from "@probitas/reporter";
import { Runner } from "@probitas/runner";
import { configureLogging, getLogger, type LogLevel } from "@probitas/logger";
import { resolveReporter } from "../../utils.ts";

const logger = getLogger("probitas", "cli", "run", "subprocess");

/**
 * Input configuration passed via stdin
 */
interface SubprocessInput {
  /** Scenario file paths (absolute) */
  files: string[];
  /** Selectors to filter scenarios */
  selectors?: string[];
  /** Reporter name */
  reporter?: string;
  /** Log level */
  logLevel?: LogLevel;
  /** Maximum concurrent scenario execution */
  maxConcurrency?: number;
  /** Maximum number of failures before stopping */
  maxFailures?: number;
  /** Timeout for scenario execution in seconds */
  timeout?: number;
}

const isSubprocessInput = is.ObjectOf({
  files: is.ArrayOf(is.String),
  selectors: as.Optional(is.ArrayOf(is.String)),
  reporter: as.Optional(is.String),
  logLevel: as.Optional(is.LiteralOneOf(
    ["debug", "info", "warning", "error", "fatal", "trace"] as const,
  )),
  maxConcurrency: as.Optional(is.Number),
  maxFailures: as.Optional(is.Number),
  timeout: as.Optional(is.Number),
}) satisfies Predicate<SubprocessInput>;

async function main(): Promise<number> {
  // Read JSON input from stdin
  let input: SubprocessInput;
  try {
    input = ensure(
      await new Response(Deno.stdin.readable).json(),
      isSubprocessInput,
    );
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    console.error(`Error: Failed to parse stdin JSON as SubprocessInput: ${m}`);
    return 1;
  }

  const {
    files,
    selectors,
    reporter: reporterName,
    logLevel,
    maxConcurrency,
    maxFailures,
    timeout,
  } = input;

  // Configure logging
  try {
    await configureLogging(logLevel ?? "warning");
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    console.error(`Warning: Failed to configure logging: ${m}`);
  }

  logger.debug("Subprocess started", { input });

  if (!files || files.length === 0) {
    logger.error("No scenario files specified");
    console.error("Error: No scenario files specified");
    return 1;
  }

  try {
    // Load scenarios
    logger.info("Loading scenarios", { fileCount: files.length });

    let scenarios = await loadScenarios(files, {
      onImportError: (file, err) => {
        const m = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to load scenario from ${file}: ${m}`);
      },
    });

    logger.debug("Scenarios loaded", { scenarioCount: scenarios.length });

    if (scenarios.length === 0) {
      logger.error("No scenarios found in specified files");
      console.error("Error: No scenarios found in specified files");
      return 1;
    }

    // Apply selectors to filter scenarios
    if (selectors && selectors.length > 0) {
      logger.debug("Applying selectors", { selectors });
      scenarios = applySelectors(scenarios, selectors);
    }

    if (scenarios.length === 0) {
      logger.error("No scenarios matched the filter", { selectors });
      console.error("Error: No scenarios matched the filter");
      return 4; // NOT_FOUND
    }

    logger.info("Running scenarios", {
      scenarioCount: scenarios.length,
      maxConcurrency,
      maxFailures,
      timeout,
    });

    // Setup reporter
    const reporterOptions: ReporterOptions = {};
    const reporter = resolveReporter(reporterName, reporterOptions);

    // Create abort signal for timeout if specified
    const timeoutSignal = timeout
      ? AbortSignal.timeout(timeout * 1000)
      : undefined;

    // Run scenarios
    const runner = new Runner(reporter);
    const summary = await runner.run(scenarios, {
      maxConcurrency,
      maxFailures,
      signal: timeoutSignal,
    });

    logger.info("Scenarios completed", {
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      skipped: summary.skipped,
    });

    // Return exit code
    return summary.failed > 0 ? 1 : 0;
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    logger.error("Subprocess execution failed", { error: err });
    console.error(`Error: ${m}`);
    return 1;
  }
}

if (import.meta.main) {
  const exitCode = await main();
  Deno.exit(exitCode);
}
