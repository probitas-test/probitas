/**
 * Subprocess entry point for listing scenarios
 *
 * Receives configuration as JSON via stdin and lists scenarios
 * in a subprocess with the project's deno.json configuration.
 *
 * @module
 */

import { as, ensure, is, type Predicate } from "@core/unknownutil";
import type { ScenarioDefinition } from "@probitas/scenario";
import { applySelectors, loadScenarios } from "@probitas/scenario";
import { configureLogging, getLogger, type LogLevel } from "@probitas/logger";

const logger = getLogger("probitas", "cli", "list", "subprocess");

/**
 * Input configuration passed via stdin
 */
interface SubprocessInput {
  /** Scenario file paths (absolute) */
  files: string[];
  /** Selectors to filter scenarios */
  selectors?: string[];
  /** Output format */
  json?: boolean;
  /** Log level */
  logLevel?: LogLevel;
}

const isSubprocessInput = is.ObjectOf({
  files: is.ArrayOf(is.String),
  selectors: as.Optional(is.ArrayOf(is.String)),
  json: as.Optional(is.Boolean),
  logLevel: as.Optional(is.LiteralOneOf(
    ["debug", "info", "warning", "error", "fatal", "trace"] as const,
  )),
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

  // Configure logging
  try {
    await configureLogging(input.logLevel ?? "warning");
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    console.error(`Warning: Failed to configure logging: ${m}`);
  }

  logger.debug("Subprocess started", { input });

  const { files, selectors, json } = input;

  if (!files || files.length === 0) {
    logger.debug("No files specified, returning empty list");
    // No files is valid for list - just output empty
    if (json) {
      console.log("[]");
    } else {
      console.log("\nTotal: 0 scenarios in 0 files");
    }
    return 0;
  }

  try {
    // Load scenarios
    logger.info("Loading scenarios", { fileCount: files.length });

    const scenarios = await loadScenarios(files, {
      onImportError: (file, err) => {
        const m = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to load scenario from ${file}: ${m}`);
      },
    });

    logger.debug("Scenarios loaded", { scenarioCount: scenarios.length });

    // Apply selectors to filter scenarios
    const filteredScenarios = selectors && selectors.length > 0
      ? applySelectors(scenarios, selectors)
      : scenarios;

    if (selectors && selectors.length > 0) {
      logger.debug("Applied selectors", {
        selectors,
        filteredCount: filteredScenarios.length,
      });
    }

    // Output results
    if (json) {
      outputJson(filteredScenarios);
    } else {
      outputText(scenarios, filteredScenarios);
    }

    logger.info("List completed", {
      totalScenarios: scenarios.length,
      filteredScenarios: filteredScenarios.length,
    });

    return 0;
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    logger.error("Subprocess execution failed", { error: err });
    console.error(`Error: ${m}`);
    return 1;
  }
}

/**
 * Output scenarios in text format
 */
function outputText(
  allScenarios: ScenarioDefinition[],
  filteredScenarios: ScenarioDefinition[],
): void {
  // Group scenarios by file
  const byFile = new Map<string, ScenarioDefinition[]>();

  for (const scenario of allScenarios) {
    const file = scenario.source?.file || "unknown";
    if (!byFile.has(file)) {
      byFile.set(file, []);
    }
    byFile.get(file)!.push(scenario);
  }

  // Output grouped scenarios
  let outputCount = 0;
  for (const [file, scenariosInFile] of byFile) {
    console.log(file);
    for (const scenario of scenariosInFile) {
      if (filteredScenarios.includes(scenario)) {
        console.log(`  ${scenario.name}`);
        outputCount++;
      }
    }
  }

  console.log(
    `\nTotal: ${outputCount} scenario${
      outputCount === 1 ? "" : "s"
    } in ${byFile.size} file${byFile.size === 1 ? "" : "s"}`,
  );
}

/**
 * Output scenarios in JSON format
 */
function outputJson(scenarios: ScenarioDefinition[]): void {
  const output = scenarios.map((scenario) => ({
    name: scenario.name,
    tags: scenario.options?.tags,
    steps: scenario.entries.filter((e) => e.kind === "step").length,
    file: scenario.source?.file || "unknown",
  }));

  console.log(JSON.stringify(output, null, 2));
}

if (import.meta.main) {
  const exitCode = await main();
  Deno.exit(exitCode);
}
