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
import { stubDenoCommand } from "./_test_utils.ts";
import { runCommand } from "./run.ts";

const createScenario = (name: string, file: string, failing = false) =>
  outdent`
  export default {
    name: "${name}",
    options: { tags: [], stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
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

      const scenarioPath = sbox.resolve("test.probitas.ts");
      await Deno.writeTextFile(
        scenarioPath,
        createScenario("Passing Test", scenarioPath),
      );

      const exitCode = await runCommand([], sbox.path);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });

    it("returns 1 when scenarios fail", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("fail.probitas.ts");
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

      const scenarioPath = sbox.resolve("test.probitas.ts");
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

      const apiScenario = sbox.resolve("api/test.probitas.ts");
      const e2eScenario = sbox.resolve("e2e/test.probitas.ts");
      await Deno.writeTextFile(
        apiScenario,
        createScenario("API Test", apiScenario),
      );
      await Deno.writeTextFile(
        e2eScenario,
        createScenario("E2E Test", e2eScenario),
      );

      const exitCode = await runCommand(
        ["--include", "api/**/*.probitas.ts"],
        sbox.path,
      );

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });

    it("uses --exclude pattern to exclude files", async () => {
      await using sbox = await sandbox();

      const regularScenario = sbox.resolve("test.probitas.ts");
      const skipScenario = sbox.resolve("test.skip.probitas.ts");
      await Deno.writeTextFile(
        regularScenario,
        createScenario("Regular Test", regularScenario),
      );
      await Deno.writeTextFile(
        skipScenario,
        createScenario("Skip Test", skipScenario),
      );

      const exitCode = await runCommand(
        ["--exclude", "**/*.skip.probitas.ts"],
        sbox.path,
      );

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });

    it("combines --include and --exclude patterns", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("api"), { recursive: true });
      await Deno.mkdir(sbox.resolve("e2e"), { recursive: true });

      const apiScenario = sbox.resolve("api/test.probitas.ts");
      const apiSkipScenario = sbox.resolve("api/skip.probitas.ts");
      const e2eScenario = sbox.resolve("e2e/test.probitas.ts");
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
        "api/**/*.probitas.ts",
        "--exclude",
        "**/skip.probitas.ts",
      ], sbox.path);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });
  });

  describe("reload option", () => {
    it("forwards --reload to subprocess", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("reload.probitas.ts");
      await Deno.writeTextFile(
        scenarioPath,
        createScenario("Reload Test", scenarioPath),
      );

      const commandArgs: string[][] = [];
      using _commandStub = stubDenoCommand((args) => {
        commandArgs.push(args);
      });

      const exitCode = await runCommand(["--reload"], sbox.path);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const args = commandArgs[0] ?? [];
      const subprocessPath = new URL(
        "./run/subprocess.ts",
        import.meta.url,
      ).href;
      assertEquals(args.includes("--reload"), true);
      assertEquals(
        args.indexOf("--reload") < args.indexOf(subprocessPath),
        true,
      );
    });
  });

  describe("timeout option", () => {
    it("kills subprocess when timeout is exceeded", async () => {
      await using sbox = await sandbox();

      // Create a scenario that will hang indefinitely
      const scenarioPath = sbox.resolve("timeout.probitas.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          import { scenario } from "probitas";

          export default scenario("Timeout Test")
            .step("Hang forever", async () => {
              // This step will hang indefinitely
              await new Promise(() => {});
            })
            .build();
        `,
      );

      const output: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const startTime = Date.now();
      const exitCode = await runCommand(["--timeout", "2"], sbox.path);
      const duration = Date.now() - startTime;

      // Should fail due to timeout
      assertEquals(exitCode, EXIT_CODE.FAILURE);
      // Should complete within reasonable time after timeout (2s + buffer for subprocess cleanup)
      assertEquals(duration < 5000, true);
    });

    it("completes successfully when scenarios finish before timeout", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("quick.probitas.ts");
      await Deno.writeTextFile(
        scenarioPath,
        createScenario("Quick Test", scenarioPath),
      );

      const exitCode = await runCommand(["--timeout", "10"], sbox.path);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });
  });
});
