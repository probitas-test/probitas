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
import { createTempSubprocessConfig } from "../utils.ts";
import { stubDenoCommand } from "./_test_utils.ts";
import { listCommand } from "./list.ts";

const createScenario = (name: string, tags: string[] = []) =>
  outdent`
    import { scenario } from "probitas";

    export default scenario("${name}"${
    tags.length > 0 ? `, { tags: ${JSON.stringify(tags)} }` : ""
  })
      .step("Step 1", () => {})
      .build();
  `;

describe("list command", { sanitizeResources: false }, () => {
  it("displays scenarios in text format", async () => {
    await using sbox = await sandbox();
    await using stack = new AsyncDisposableStack();

    const configPath = await createTempSubprocessConfig();
    stack.defer(async () => {
      await Deno.remove(configPath);
    });

    const scenario1 = sbox.resolve("test1.probitas.ts");
    const scenario2 = sbox.resolve("test2.probitas.ts");
    await Deno.writeTextFile(scenario1, createScenario("Test 1"));
    await Deno.writeTextFile(scenario2, createScenario("Test 2"));

    // Use the subprocess directly
    const subprocessPath = new URL(
      "./list/subprocess.ts",
      import.meta.url,
    ).href;
    const cmd = new Deno.Command("deno", {
      args: ["run", "-A", "--config", configPath, subprocessPath],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    const child = cmd.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(
      new TextEncoder().encode(JSON.stringify({
        files: [scenario1, scenario2],
        selectors: [],
        json: false,
      })),
    );
    await writer.close();

    const result = await child.output();
    const stdout = new TextDecoder().decode(result.stdout);

    assertEquals(result.code, 0);
    assertEquals(stdout.includes("Test 1"), true);
    assertEquals(stdout.includes("Test 2"), true);
  });

  it("outputs scenarios in JSON format with --json flag", async () => {
    await using sbox = await sandbox();
    await using stack = new AsyncDisposableStack();

    const configPath = await createTempSubprocessConfig();
    stack.defer(async () => {
      await Deno.remove(configPath);
    });

    const scenarioPath = sbox.resolve("test.probitas.ts");
    await Deno.writeTextFile(
      scenarioPath,
      createScenario("JSON Test", ["api"]),
    );

    const subprocessPath = new URL(
      "./list/subprocess.ts",
      import.meta.url,
    ).href;
    const cmd = new Deno.Command("deno", {
      args: ["run", "-A", "--config", configPath, subprocessPath],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    const child = cmd.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(
      new TextEncoder().encode(JSON.stringify({
        files: [scenarioPath],
        selectors: [],
        json: true,
      })),
    );
    await writer.close();

    const result = await child.output();
    const stdout = new TextDecoder().decode(result.stdout);

    assertEquals(result.code, 0);
    const parsed = JSON.parse(stdout);
    assertEquals(Array.isArray(parsed), true);
    assertEquals(parsed.length, 1);
    assertEquals(parsed[0].name, "JSON Test");
    assertEquals(parsed[0].tags, ["api"]);
  });

  it("returns 0 even when no scenarios found", async () => {
    await using stack = new AsyncDisposableStack();

    const configPath = await createTempSubprocessConfig();
    stack.defer(async () => {
      await Deno.remove(configPath);
    });

    const subprocessPath = new URL(
      "./list/subprocess.ts",
      import.meta.url,
    ).href;
    const cmd = new Deno.Command("deno", {
      args: ["run", "-A", "--config", configPath, subprocessPath],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    const child = cmd.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(
      new TextEncoder().encode(JSON.stringify({
        files: [],
        selectors: [],
        json: false,
      })),
    );
    await writer.close();

    const result = await child.output();
    const stdout = new TextDecoder().decode(result.stdout);

    assertEquals(result.code, 0);
    assertEquals(stdout.includes("Total: 0 scenarios"), true);
  });

  it("shows help text with --help flag", async () => {
    await using sbox = await sandbox();

    const output: string[] = [];
    using _logStub = stub(console, "log", (...args: unknown[]) => {
      output.push(args.join(" "));
    });

    // Help is handled by the parent process, not subprocess
    const exitCode = await listCommand(["--help"], sbox.path);

    assertEquals(exitCode, 0);
    const outputText = output.join("\n");
    assertEquals(outputText.includes("probitas list"), true);
  });

  describe("reload option", () => {
    it("forwards --reload to subprocess", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("reload.probitas.ts");
      await Deno.writeTextFile(
        scenarioPath,
        createScenario("Reload Test"),
      );

      const commandArgs: string[][] = [];
      using _commandStub = stubDenoCommand((args) => {
        commandArgs.push(args);
      });

      const exitCode = await listCommand(["--reload"], sbox.path);

      assertEquals(exitCode, 0);
      const args = commandArgs[0] ?? [];
      const subprocessPath = new URL(
        "./list/subprocess.ts",
        import.meta.url,
      ).href;
      assertEquals(args.includes("--reload"), true);
      assertEquals(
        args.indexOf("--reload") < args.indexOf(subprocessPath),
        true,
      );
    });
  });

  describe("selector filtering", () => {
    it("filters scenarios by tag selector", async () => {
      await using sbox = await sandbox();
      await using stack = new AsyncDisposableStack();

      const configPath = await createTempSubprocessConfig();
      stack.defer(async () => {
        await Deno.remove(configPath);
      });

      const apiScenario = sbox.resolve("api.probitas.ts");
      const e2eScenario = sbox.resolve("e2e.probitas.ts");
      await Deno.writeTextFile(
        apiScenario,
        createScenario("API Test", ["api"]),
      );
      await Deno.writeTextFile(
        e2eScenario,
        createScenario("E2E Test", ["e2e"]),
      );

      const subprocessPath = new URL(
        "./list/subprocess.ts",
        import.meta.url,
      ).href;
      const cmd = new Deno.Command("deno", {
        args: ["run", "-A", "--config", configPath, subprocessPath],
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
      });

      const child = cmd.spawn();
      const writer = child.stdin.getWriter();
      await writer.write(
        new TextEncoder().encode(JSON.stringify({
          files: [apiScenario, e2eScenario],
          selectors: ["tag:api"],
          json: false,
        })),
      );
      await writer.close();

      const result = await child.output();
      const stdout = new TextDecoder().decode(result.stdout);

      console.log(stdout);

      assertEquals(result.code, 0);
      assertEquals(stdout.includes("API Test"), true);
      assertEquals(stdout.includes("E2E Test"), false);
    });

    it("supports negated selectors", async () => {
      await using sbox = await sandbox();
      await using stack = new AsyncDisposableStack();

      const configPath = await createTempSubprocessConfig();
      stack.defer(async () => {
        await Deno.remove(configPath);
      });

      const smokeScenario = sbox.resolve("smoke.probitas.ts");
      const slowScenario = sbox.resolve("slow.probitas.ts");
      await Deno.writeTextFile(
        smokeScenario,
        createScenario("Smoke Test", ["smoke"]),
      );
      await Deno.writeTextFile(
        slowScenario,
        createScenario("Slow Test", ["slow"]),
      );

      const subprocessPath = new URL(
        "./list/subprocess.ts",
        import.meta.url,
      ).href;
      const cmd = new Deno.Command("deno", {
        args: ["run", "-A", "--config", configPath, subprocessPath],
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
      });

      const child = cmd.spawn();
      const writer = child.stdin.getWriter();
      await writer.write(
        new TextEncoder().encode(JSON.stringify({
          files: [smokeScenario, slowScenario],
          selectors: ["!tag:slow"],
          json: false,
        })),
      );
      await writer.close();

      const result = await child.output();
      const stdout = new TextDecoder().decode(result.stdout);

      assertEquals(result.code, 0);
      assertEquals(stdout.includes("Smoke Test"), true);
      assertEquals(stdout.includes("Slow Test"), false);
    });
  });

  it("returns exit code 1 on invalid input format", async () => {
    await using stack = new AsyncDisposableStack();

    const configPath = await createTempSubprocessConfig();
    stack.defer(async () => {
      await Deno.remove(configPath);
    });

    const invalidInput = {
      // Missing required 'files' field
      json: true,
    };

    const subprocessPath = new URL(
      "./list/subprocess.ts",
      import.meta.url,
    ).href;
    const cmd = new Deno.Command("deno", {
      args: ["run", "-A", "--config", configPath, subprocessPath],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    const child = cmd.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(
      new TextEncoder().encode(JSON.stringify(invalidInput)),
    );
    await writer.close();

    const result = await child.output();
    const stderr = new TextDecoder().decode(result.stderr);

    assertEquals(result.code, 1);
    assertEquals(
      stderr.includes("Failed to parse stdin JSON as SubprocessInput"),
      true,
    );
  });
});
