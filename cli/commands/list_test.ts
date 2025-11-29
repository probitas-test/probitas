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
  }, skip: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
      entries: [
        {
          kind: "step",
          value: {
            name: "Step 1",
            fn: () => ({}),
            options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
          }
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

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand(
        ["--include", "api/**/*.scenario.ts"],
        sbox.path,
      );

      assertEquals(exitCode, 0);
      const outputText = output.join("\n");
      assertEquals(outputText.includes("API Test"), true);
      assertEquals(outputText.includes("E2E Test"), false);
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

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand(
        ["--exclude", "**/*.skip.scenario.ts"],
        sbox.path,
      );

      assertEquals(exitCode, 0);
      const outputText = output.join("\n");
      assertEquals(outputText.includes("Regular Test"), true);
      assertEquals(outputText.includes("Skip Test"), false);
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

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand([
        "--include",
        "api/**/*.scenario.ts",
        "--exclude",
        "**/skip.scenario.ts",
      ], sbox.path);

      assertEquals(exitCode, 0);
      const outputText = output.join("\n");
      assertEquals(
        outputText.includes("API Test"),
        true,
        "Should include API Test",
      );
      assertEquals(
        outputText.includes("API Skip"),
        false,
        "Should not include API Skip (excluded by pattern)",
      );
      assertEquals(
        outputText.includes("E2E Test"),
        false,
        "Should not include E2E Test (not in api/)",
      );
    });

    it("combines file patterns with selectors", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("api"), { recursive: true });
      await Deno.mkdir(sbox.resolve("e2e"), { recursive: true });

      const apiSmokeScenario = sbox.resolve("api/smoke.scenario.ts");
      const apiSlowScenario = sbox.resolve("api/slow.scenario.ts");
      const e2eScenario = sbox.resolve("e2e/test.scenario.ts");
      await Deno.writeTextFile(
        apiSmokeScenario,
        createScenario("API Smoke", apiSmokeScenario, ["api", "smoke"]),
      );
      await Deno.writeTextFile(
        apiSlowScenario,
        createScenario("API Slow", apiSlowScenario, ["api", "slow"]),
      );
      await Deno.writeTextFile(
        e2eScenario,
        createScenario("E2E Test", e2eScenario, ["e2e"]),
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      // Include api files, but exclude slow scenarios
      const exitCode = await listCommand([
        "--include",
        "api/**/*.scenario.ts",
        "-s",
        "!tag:slow",
      ], sbox.path);

      assertEquals(exitCode, 0);
      const outputText = output.join("\n");
      assertEquals(
        outputText.includes("API Smoke"),
        true,
        "Should include API Smoke",
      );
      assertEquals(
        outputText.includes("API Slow"),
        false,
        "Should not include API Slow (selector filter)",
      );
      assertEquals(
        outputText.includes("E2E Test"),
        false,
        "Should not include E2E Test (file pattern filter)",
      );
    });
  });
});
