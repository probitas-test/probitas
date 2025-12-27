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

const createScenario = (name: string, tags: string[] = []) =>
  outdent`
    import { scenario } from "jsr:@probitas/probitas@^0";

    export default scenario("${name}"${
    tags.length > 0 ? `, { tags: ${JSON.stringify(tags)} }` : ""
  })
      .step("Step 1", () => {})
      .build();
  `;

describe("list command", { sanitizeResources: false }, () => {
  it("displays scenarios in text format", async () => {
    await using sbox = await sandbox();

    const scenario1 = sbox.resolve("test1.probitas.ts");
    const scenario2 = sbox.resolve("test2.probitas.ts");
    await Deno.writeTextFile(scenario1, createScenario("Test 1"));
    await Deno.writeTextFile(scenario2, createScenario("Test 2"));

    const output: string[] = [];
    using _logStub = stub(console, "log", (...args: unknown[]) => {
      output.push(args.join(" "));
    });

    const exitCode = await listCommand([scenario1, scenario2], sbox.path);
    const stdout = output.join("\n");

    assertEquals(exitCode, 0);
    assertEquals(stdout.includes("Test 1"), true);
    assertEquals(stdout.includes("Test 2"), true);
  });

  it("outputs scenarios in JSON format with --json flag", async () => {
    await using sbox = await sandbox();

    const scenarioPath = sbox.resolve("test.probitas.ts");
    await Deno.writeTextFile(
      scenarioPath,
      createScenario("JSON Test", ["api"]),
    );

    const output: string[] = [];
    using _logStub = stub(console, "log", (...args: unknown[]) => {
      output.push(args.join(" "));
    });

    const exitCode = await listCommand(["--json", scenarioPath], sbox.path);
    const stdout = output.join("\n");

    assertEquals(exitCode, 0);
    const parsed = JSON.parse(stdout);
    assertEquals(Array.isArray(parsed), true);
    assertEquals(parsed.length, 1);
    assertEquals(parsed[0].name, "JSON Test");
    assertEquals(parsed[0].tags, ["api"]);
  });

  it("returns 0 even when no scenarios found", async () => {
    await using sbox = await sandbox();

    const output: string[] = [];
    using _logStub = stub(console, "log", (...args: unknown[]) => {
      output.push(args.join(" "));
    });

    // Pass a non-existent path pattern
    const exitCode = await listCommand(
      ["nonexistent/*.probitas.ts"],
      sbox.path,
    );
    const stdout = output.join("\n");

    assertEquals(exitCode, 0);
    assertEquals(stdout.includes("Total: 0 scenarios"), true);
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

  describe("selector filtering", () => {
    it("filters scenarios by tag selector", async () => {
      await using sbox = await sandbox();

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

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand(
        ["-s", "tag:api", apiScenario, e2eScenario],
        sbox.path,
      );
      const stdout = output.join("\n");

      assertEquals(exitCode, 0);
      assertEquals(stdout.includes("API Test"), true);
      assertEquals(stdout.includes("E2E Test"), false);
    });

    it("supports negated selectors", async () => {
      await using sbox = await sandbox();

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

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand(
        ["-s", "!tag:slow", smokeScenario, slowScenario],
        sbox.path,
      );
      const stdout = output.join("\n");

      assertEquals(exitCode, 0);
      assertEquals(stdout.includes("Smoke Test"), true);
      assertEquals(stdout.includes("Slow Test"), false);
    });
  });
});
