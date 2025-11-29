/**
 * Tests for run command
 *
 * Focuses on CLI-specific behavior: exit codes and error handling.
 * Feature functionality (filtering, reporters, etc.) is covered by unit tests.
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
import { EXIT_CODE } from "../constants.ts";
import { runCommand } from "./run.ts";

const createScenario = (name: string, file: string, failing = false) =>
  outdent`
  export default {
    name: "${name}",
    options: { tags: [], skip: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
    entries: [
      {
        kind: "step",
        value: {
          name: "Step 1",
          fn: () => ${
    failing ? '{ throw new Error("Failed"); }' : '({ result: "success" })'
  },
          options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
        }
      }
    ],
    location: { file: "${file}" }
  };
`;

describe("run command", () => {
  describe("exit codes", () => {
    it("returns 0 when all scenarios pass", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        createScenario("Passing Test", scenarioPath),
      );

      const exitCode = await runCommand([], sbox.path);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });

    it("returns 1 when scenarios fail", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("fail.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        createScenario("Failing Test", scenarioPath, true),
      );

      const output: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await runCommand([], sbox.path);

      assertEquals(exitCode, EXIT_CODE.FAILURE);
    });

    it("returns 2 on usage error", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        `export default scenario("Test").step("Test", () => {}).build();`,
      );

      const exitCode = await runCommand(
        ["--config", "/nonexistent/path"],
        sbox.path,
      );

      assertEquals(exitCode, EXIT_CODE.USAGE_ERROR);
    });

    it("returns 4 when no scenarios found", async () => {
      await using sbox = await sandbox();

      const output: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await runCommand([], sbox.path);

      assertEquals(exitCode, EXIT_CODE.NOT_FOUND);
    });
  });

  describe("help and usage", () => {
    it("shows help text with -h flag", async () => {
      await using sbox = await sandbox();

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await runCommand(["-h"], sbox.path);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertEquals(outputText.includes("probitas run"), true);
    });
  });

  describe("file pattern options", () => {
    it("uses --include pattern to filter files", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("api"), { recursive: true });
      await Deno.mkdir(sbox.resolve("e2e"), { recursive: true });

      const apiScenario = sbox.resolve("api/test.scenario.ts");
      const e2eScenario = sbox.resolve("e2e/test.scenario.ts");
      await Deno.writeTextFile(
        apiScenario,
        createScenario("API Test", apiScenario),
      );
      await Deno.writeTextFile(
        e2eScenario,
        createScenario("E2E Test", e2eScenario),
      );

      const exitCode = await runCommand(
        ["--include", "api/**/*.scenario.ts"],
        sbox.path,
      );

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });

    it("uses --exclude pattern to exclude files", async () => {
      await using sbox = await sandbox();

      const regularScenario = sbox.resolve("test.scenario.ts");
      const skipScenario = sbox.resolve("test.skip.scenario.ts");
      await Deno.writeTextFile(
        regularScenario,
        createScenario("Regular Test", regularScenario),
      );
      await Deno.writeTextFile(
        skipScenario,
        createScenario("Skip Test", skipScenario),
      );

      const exitCode = await runCommand(
        ["--exclude", "**/*.skip.scenario.ts"],
        sbox.path,
      );

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });

    it("combines --include and --exclude patterns", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("api"), { recursive: true });
      await Deno.mkdir(sbox.resolve("e2e"), { recursive: true });

      const apiScenario = sbox.resolve("api/test.scenario.ts");
      const apiSkipScenario = sbox.resolve("api/skip.scenario.ts");
      const e2eScenario = sbox.resolve("e2e/test.scenario.ts");
      await Deno.writeTextFile(
        apiScenario,
        createScenario("API Test", apiScenario),
      );
      await Deno.writeTextFile(
        apiSkipScenario,
        createScenario("API Skip", apiSkipScenario),
      );
      await Deno.writeTextFile(
        e2eScenario,
        createScenario("E2E Test", e2eScenario),
      );

      const exitCode = await runCommand([
        "--include",
        "api/**/*.scenario.ts",
        "--exclude",
        "**/skip.scenario.ts",
      ], sbox.path);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });
  });
});
