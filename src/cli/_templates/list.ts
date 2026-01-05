/**
 * Subprocess entry point for list command
 *
 * Loads scenarios and outputs metadata via TCP IPC.
 * Communication is via CBOR over TCP (not stdin/stdout).
 *
 * @module
 * @internal
 */

import { loadScenarios } from "@probitas/core/loader";
import { applySelectors } from "@probitas/core/selector";
import type { ListInput, ListOutput, ScenarioMeta } from "./list_protocol.ts";
import { runSubprocess, writeOutput } from "./utils.ts";

// Run subprocess with bootstrap handling
runSubprocess<ListInput>(async (ipc, input) => {
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

  await writeOutput(
    ipc,
    {
      type: "result",
      scenarios: scenarioMetas,
    } satisfies ListOutput,
  );
});
