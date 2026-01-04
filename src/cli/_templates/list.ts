/**
 * Subprocess entry point for list command
 *
 * Loads scenarios and outputs metadata via stdout.
 * Communication is via JSON over stdin/stdout.
 *
 * @module
 * @internal
 */

import { loadScenarios } from "@probitas/core/loader";
import { applySelectors } from "@probitas/core/selector";
import { toErrorObject } from "@core/errorutil/error-object";
import type { ListInput, ListOutput, ScenarioMeta } from "./list_protocol.ts";
import { readStdin, writeOutput } from "./utils.ts";

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Signal that subprocess is ready
  writeOutput({ type: "ready" } satisfies ListOutput);

  try {
    // Read input from stdin
    const inputJson = await readStdin();
    const input: ListInput = JSON.parse(inputJson);

    // Load scenarios from files
    const scenarios = await loadScenarios(input.filePaths, {
      onImportError: (file, err) => {
        const m = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to load scenario from ${file}: ${m}`);
      },
    });

    // Apply selectors to filter scenarios
    const filtered = input.selectors.length > 0
      ? applySelectors(scenarios, input.selectors)
      : scenarios;

    // Build output metadata
    const scenarioMetas: ScenarioMeta[] = filtered.map((s) => ({
      name: s.name,
      tags: s.tags,
      steps: s.steps.filter((e) => e.kind === "step").length,
      file: s.origin?.path || "unknown",
    }));

    writeOutput(
      {
        type: "result",
        scenarios: scenarioMetas,
      } satisfies ListOutput,
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    writeOutput(
      {
        type: "error",
        error: toErrorObject(err),
      } satisfies ListOutput,
    );
  }
}

main();
