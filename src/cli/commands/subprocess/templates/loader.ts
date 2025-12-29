/**
 * Subprocess loader for list command
 *
 * Reads file paths from stdin and outputs loaded scenarios to stdout.
 * This allows list command to load scenarios with correct deno.json/deno.lock.
 *
 * @module
 */

import { TextLineStream } from "@std/streams";
import { loadScenarios } from "@probitas/core/loader";
import type { ScenarioDefinition } from "@probitas/core";

/**
 * Input message from main process
 */
interface LoaderInput {
  files: string[];
}

/**
 * Output message to main process (success)
 */
interface LoaderSuccessOutput {
  type: "success";
  scenarios: ScenarioDefinition[];
}

/**
 * Output message to main process (error)
 */
interface LoaderErrorOutput {
  type: "error";
  error: string;
  file?: string;
}

/**
 * Output message (discriminated union)
 */
type LoaderOutput = LoaderSuccessOutput | LoaderErrorOutput;

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Read input from stdin
    const reader = Deno.stdin.readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
      .getReader();

    const { value } = await reader.read();
    if (!value) {
      throw new Error("No input received");
    }

    const input = JSON.parse(value) as LoaderInput;
    const { files } = input;

    // Load scenarios
    const scenarios = await loadScenarios(files, {
      onImportError: (file, err) => {
        const output: LoaderErrorOutput = {
          type: "error",
          error: err instanceof Error ? err.message : String(err),
          file: typeof file === "string" ? file : file.href,
        };
        console.log(JSON.stringify(output));
        Deno.exit(1);
      },
    });

    // Output scenarios as JSON
    const output: LoaderSuccessOutput = { type: "success", scenarios };
    console.log(JSON.stringify(output));
  } catch (error) {
    const output: LoaderErrorOutput = {
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    };
    console.log(JSON.stringify(output));
    Deno.exit(1);
  }
}

// Run main if this is the entry point
if (import.meta.main) {
  await main();
}
