/**
 * State persistence for CLI commands
 *
 * Manages the `.probitas/` directory and stores run state between executions.
 *
 * @module
 */

import { join } from "@std/path";
import { relative } from "@std/path/relative";
import type { RunResult } from "@probitas/runner";

/**
 * A scenario that failed in a previous run
 */
export interface FailedScenario {
  /** Scenario name */
  readonly name: string;
  /** Relative file path from project root */
  readonly file: string;
  /** Error message (optional, for display purposes) */
  readonly error?: string;
}

/**
 * State of the last run
 */
export interface LastRunState {
  /** Schema version for forward compatibility */
  readonly version: 1;
  /** ISO timestamp of when the run completed */
  readonly timestamp: string;
  /** List of failed scenarios */
  readonly failed: readonly FailedScenario[];
}

const STATE_DIR_NAME = ".probitas";
const LAST_RUN_FILE = "last-run.json";
const CURRENT_VERSION = 1;

/**
 * Get the state directory path, creating it if it doesn't exist
 *
 * @param cwd - Project root directory
 * @returns Path to the state directory
 */
export async function getStateDir(cwd: string): Promise<string> {
  const stateDir = join(cwd, STATE_DIR_NAME);
  try {
    await Deno.mkdir(stateDir, { recursive: true });
  } catch (error) {
    // Ignore if already exists
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
  return stateDir;
}

/**
 * Save the last run state to disk
 *
 * Extracts failed scenarios from the run result and persists them
 * to `.probitas/last-run.json`.
 *
 * @param cwd - Project root directory
 * @param result - Run result from scenario execution
 */
export async function saveLastRunState(
  cwd: string,
  result: RunResult,
): Promise<void> {
  const stateDir = await getStateDir(cwd);
  const statePath = join(stateDir, LAST_RUN_FILE);

  // Extract failed scenarios from result
  const failed: FailedScenario[] = [];
  for (const s of result.scenarios) {
    if (s.status !== "failed") continue;

    // Now TypeScript knows s.status is "failed" and s.error exists
    const metadata = s.metadata;
    const filePath = metadata.origin?.path ?? "unknown";
    const relativeFile = filePath !== "unknown"
      ? relative(cwd, filePath)
      : "unknown";

    failed.push({
      name: metadata.name,
      file: relativeFile,
      error: s.error instanceof Error
        ? s.error.message
        : typeof s.error === "string"
        ? s.error
        : undefined,
    });
  }

  const state: LastRunState = {
    version: CURRENT_VERSION,
    timestamp: new Date().toISOString(),
    failed,
  };

  await Deno.writeTextFile(statePath, JSON.stringify(state, null, 2) + "\n");
}

/**
 * Load the last run state from disk
 *
 * @param cwd - Project root directory
 * @returns The last run state, or undefined if no state file exists or it's invalid
 */
export async function loadLastRunState(
  cwd: string,
): Promise<LastRunState | undefined> {
  const statePath = join(cwd, STATE_DIR_NAME, LAST_RUN_FILE);

  try {
    const content = await Deno.readTextFile(statePath);
    const state = JSON.parse(content);

    // Validate version
    if (state.version !== CURRENT_VERSION) {
      return undefined;
    }

    // Basic validation of required fields
    if (
      typeof state.timestamp !== "string" ||
      !Array.isArray(state.failed)
    ) {
      return undefined;
    }

    return state as LastRunState;
  } catch (error) {
    // File doesn't exist or can't be read
    if (error instanceof Deno.errors.NotFound) {
      return undefined;
    }
    // Invalid JSON or other error - treat as missing state
    if (error instanceof SyntaxError) {
      return undefined;
    }
    throw error;
  }
}
