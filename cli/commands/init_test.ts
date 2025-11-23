/**
 * Tests for init command
 *
 * @requires --allow-read Permission to read generated files
 * @requires --allow-write Permission to write test files
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { resolve } from "@std/path";
import { defer } from "../../src/helper/defer.ts";
import { EXIT_CODE } from "../constants.ts";
import { initCommand } from "./init.ts";

describe("init command", () => {
  describe("file generation", () => {
    it("generates probitas.config.ts", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const exitCode = await initCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);

      const configPath = resolve(tempDir, "probitas.config.ts");
      const stat = await Deno.stat(configPath);
      assertEquals(stat.isFile, true);
    });

    it("generates scenarios/deno.jsonc", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const exitCode = await initCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);

      const denoJsoncPath = resolve(tempDir, "scenarios", "deno.jsonc");
      const stat = await Deno.stat(denoJsoncPath);
      assertEquals(stat.isFile, true);
    });

    it("generates scenarios/example.scenario.ts", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const exitCode = await initCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);

      const examplePath = resolve(
        tempDir,
        "scenarios",
        "example.scenario.ts",
      );
      const stat = await Deno.stat(examplePath);
      assertEquals(stat.isFile, true);
    });

    it("creates files with correct content", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const exitCode = await initCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);

      // Check config content
      const configPath = resolve(tempDir, "probitas.config.ts");
      const configContent = await Deno.readTextFile(configPath);
      assertEquals(configContent.includes("export default"), true);
      assertEquals(configContent.includes("ProbitasConfig"), true);

      // Check deno.jsonc content
      const denoJsoncPath = resolve(tempDir, "scenarios", "deno.jsonc");
      const denoJsoncContent = await Deno.readTextFile(denoJsoncPath);
      assertEquals(denoJsoncContent.includes("imports"), true);
      assertEquals(denoJsoncContent.includes("probitas"), true);

      // Check example scenario content
      const examplePath = resolve(
        tempDir,
        "scenarios",
        "example.scenario.ts",
      );
      const exampleContent = await Deno.readTextFile(examplePath);
      assertEquals(exampleContent.includes("scenario"), true);
      assertEquals(exampleContent.includes("step"), true);
    });
  });

  describe("existing file handling", () => {
    it("returns error code 2 when probitas.config.ts exists", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(configPath, "// existing config");

      const exitCode = await initCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.USAGE_ERROR);
    });

    it("returns error code 2 when scenarios/deno.jsonc exists", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenariosDir = resolve(tempDir, "scenarios");
      await Deno.mkdir(scenariosDir, { recursive: true });

      const denoJsoncPath = resolve(scenariosDir, "deno.jsonc");
      await Deno.writeTextFile(denoJsoncPath, "{}");

      const exitCode = await initCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.USAGE_ERROR);
    });

    it("returns error code 2 when scenarios/example.scenario.ts exists", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenariosDir = resolve(tempDir, "scenarios");
      await Deno.mkdir(scenariosDir, { recursive: true });

      const examplePath = resolve(scenariosDir, "example.scenario.ts");
      await Deno.writeTextFile(examplePath, "// existing scenario");

      const exitCode = await initCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.USAGE_ERROR);
    });
  });

  describe("force flag", () => {
    it("overwrites existing files with --force flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(configPath, "// old config");

      const exitCode = await initCommand(["--force"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);

      const configContent = await Deno.readTextFile(configPath);
      assertEquals(configContent.includes("// old config"), false);
      assertEquals(configContent.includes("export default"), true);
    });

    it("overwrites all files when --force is used", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create existing files
      const configPath = resolve(tempDir, "probitas.config.ts");
      const scenariosDir = resolve(tempDir, "scenarios");
      await Deno.mkdir(scenariosDir, { recursive: true });

      await Deno.writeTextFile(configPath, "// old");
      await Deno.writeTextFile(
        resolve(scenariosDir, "deno.jsonc"),
        "{}",
      );
      await Deno.writeTextFile(
        resolve(scenariosDir, "example.scenario.ts"),
        "// old",
      );

      const exitCode = await initCommand(["--force"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);

      // Verify all files are updated
      const configContent = await Deno.readTextFile(configPath);
      assertEquals(configContent.includes("export default"), true);

      const denoJsoncContent = await Deno.readTextFile(
        resolve(scenariosDir, "deno.jsonc"),
      );
      assertEquals(denoJsoncContent.includes("imports"), true);

      const exampleContent = await Deno.readTextFile(
        resolve(scenariosDir, "example.scenario.ts"),
      );
      assertEquals(exampleContent.includes("scenario"), true);
    });
  });

  describe("directory creation", () => {
    it("creates scenarios directory if it does not exist", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenariosDir = resolve(tempDir, "scenarios");

      // Verify directory doesn't exist yet
      try {
        await Deno.stat(scenariosDir);
        assertEquals(false, true); // Should not reach here
      } catch {
        // Expected
      }

      const exitCode = await initCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);

      const stat = await Deno.stat(scenariosDir);
      assertEquals(stat.isDirectory, true);
    });

    it("reuses existing scenarios directory", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenariosDir = resolve(tempDir, "scenarios");
      await Deno.mkdir(scenariosDir, { recursive: true });

      // Create a marker file to verify directory isn't recreated
      const markerPath = resolve(scenariosDir, ".marker");
      await Deno.writeTextFile(markerPath, "marker");

      const exitCode = await initCommand(["--force"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);

      // Marker should still exist
      const stat = await Deno.stat(markerPath);
      assertEquals(stat.isFile, true);
    });
  });

  describe("help and usage", () => {
    it("shows help text with -h flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await initCommand(["-h"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertEquals(outputText.includes("probitas init"), true);
      assertEquals(outputText.includes("Usage:"), true);
    });

    it("shows help text with --help flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await initCommand(["--help"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertEquals(outputText.includes("probitas init"), true);
      assertEquals(outputText.includes("Usage:"), true);
    });
  });

  describe("exit codes", () => {
    it("returns 0 on success", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const exitCode = await initCommand([], tempDir);
      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });

    it("returns 2 on file conflict", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(configPath, "// existing");

      const exitCode = await initCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.USAGE_ERROR);
    });
  });
});
