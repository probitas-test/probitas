/**
 * Tests for list command
 *
 * Focuses on CLI-specific behavior: output and exit codes.
 * Filtering logic is covered by utils_test.ts.
 *
 * @requires --allow-read Permission to read scenario files
 * @requires --allow-write Permission to write temporary test files
 * @module
 */

import outdent from "@cspotcode/outdent";
import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { sandbox } from "@lambdalisue/sandbox";
import { listCommand } from "./list.ts";

const createScenario = (name: string, file: string, tags: string[] = []) =>
  outdent`
    export default {
      name: "${name}",
      options: { tags: ${
    JSON.stringify(tags)
  }, skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
      steps: [
        {
          name: "Step 1",
          fn: () => ({}),
          options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
        }
      ],
      location: { file: "${file}" }
    };
  `;

describe("list command", () => {
  it("displays scenarios in text format", async () => {
    await using sbox = await sandbox();

    const scenario1 = sbox.resolve("test1.scenario.ts");
    const scenario2 = sbox.resolve("test2.scenario.ts");
    await Deno.writeTextFile(scenario1, createScenario("Test 1", scenario1));
    await Deno.writeTextFile(scenario2, createScenario("Test 2", scenario2));

    const output: string[] = [];
    using _logStub = stub(console, "log", (...args: unknown[]) => {
      output.push(args.join(" "));
    });

    const exitCode = await listCommand([], sbox.path);

    assertEquals(exitCode, 0);
    const outputText = output.join("\n");
    assertEquals(outputText.includes("Test 1"), true);
    assertEquals(outputText.includes("Test 2"), true);
  });

  it("outputs scenarios in JSON format with --json flag", async () => {
    await using sbox = await sandbox();

    const scenarioPath = sbox.resolve("test.scenario.ts");
    await Deno.writeTextFile(
      scenarioPath,
      createScenario("JSON Test", scenarioPath, ["api"]),
    );

    const output: string[] = [];
    using _logStub = stub(console, "log", (...args: unknown[]) => {
      output.push(args.join(" "));
    });

    const exitCode = await listCommand(["--json"], sbox.path);

    assertEquals(exitCode, 0);
    const outputText = output.join("\n");
    const parsed = JSON.parse(outputText);
    assertEquals(Array.isArray(parsed), true);
    assertEquals(parsed.length, 1);
    assertEquals(parsed[0].name, "JSON Test");
  });

  it("returns 0 even when no scenarios found", async () => {
    await using sbox = await sandbox();

    const output: string[] = [];
    using _logStub = stub(console, "log", (...args: unknown[]) => {
      output.push(args.join(" "));
    });

    const exitCode = await listCommand([], sbox.path);

    assertEquals(exitCode, 0);
  });

  it("shows help text with --help flag", async () => {
    await using sbox = await sandbox();

    const output: string[] = [];
    using _logStub = stub(console, "log", (...args: unknown[]) => {
      output.push(args.join(" "));
    });

    const exitCode = await listCommand(["--help"], sbox.path);

    assertEquals(exitCode, 0);
    const outputText = output.join("\n");
    assertEquals(outputText.includes("probitas list"), true);
  });
});
