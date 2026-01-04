/**
 * Subprocess entry point for list command
 *
 * Loads scenarios and outputs metadata via TCP IPC.
 * Communication is via NDJSON over TCP (not stdin/stdout).
 *
 * @module
 * @internal
 */

import { loadScenarios } from "@probitas/core/loader";
import { applySelectors } from "@probitas/core/selector";
import { toErrorObject } from "@core/errorutil/error-object";
import type { ListInput, ListOutput, ScenarioMeta } from "./list_protocol.ts";
import {
  closeIpc,
  connectIpc,
  parseIpcPort,
  readInput,
  writeOutput,
} from "./utils.ts";

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Parse IPC port from command line arguments
  const port = parseIpcPort(Deno.args);

  // Connect to parent process IPC server
  const ipc = await connectIpc(port);

  try {
    // Read input from IPC (TCP connection establishes readiness)
    const input = await readInput(ipc) as ListInput;

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
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    try {
      await writeOutput(
        ipc,
        {
          type: "error",
          error: toErrorObject(err),
        } satisfies ListOutput,
      );
    } catch {
      // Failed to write error to IPC, log to console as fallback
      console.error("Subprocess error:", error);
    }
  } finally {
    closeIpc(ipc);
  }
}

main();
