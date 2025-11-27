/**
 * Tests for init command
 *
 * Focuses on CLI-specific behavior: file generation and error handling.
 *
 * @requires --allow-read Permission to read files
 * @requires --allow-write Permission to write files
 * @module
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { exists } from "@std/fs";
import { resolve } from "@std/path";
import { defer } from "../../src/helper/defer.ts";
import { initCommand } from "./init.ts";

describe("init command", () => {
  it("creates all required files with correct content", async () => {
    const tempDir = await Deno.makeTempDir();
    await using _cleanup = defer(async () => {
      await Deno.remove(tempDir, { recursive: true });
    });

    const exitCode = await initCommand([], tempDir);

    assertEquals(exitCode, 0);

    const configPath = resolve(tempDir, "probitas.config.ts");
    const denoJsonPath = resolve(tempDir, "scenarios", "deno.jsonc");
    const examplePath = resolve(tempDir, "scenarios", "example.scenario.ts");

    assertEquals(await exists(configPath), true);
    assertEquals(await exists(denoJsonPath), true);
    assertEquals(await exists(examplePath), true);

    const configContent = await Deno.readTextFile(configPath);
    assertStringIncludes(configContent, "ProbitasConfig");

    const denoJsonContent = await Deno.readTextFile(denoJsonPath);
    assertStringIncludes(denoJsonContent, "imports");

    const exampleContent = await Deno.readTextFile(examplePath);
    assertStringIncludes(exampleContent, "Example Scenario");
  });

  it("returns error when file exists", async () => {
    const tempDir = await Deno.makeTempDir();
    await using _cleanup = defer(async () => {
      await Deno.remove(tempDir, { recursive: true });
    });

    const configPath = resolve(tempDir, "probitas.config.ts");
    await Deno.writeTextFile(configPath, "existing content");

    const exitCode = await initCommand([], tempDir);

    assertEquals(exitCode, 2);
  });

  it("overwrites existing files with --force flag", async () => {
    const tempDir = await Deno.makeTempDir();
    await using _cleanup = defer(async () => {
      await Deno.remove(tempDir, { recursive: true });
    });

    const configPath = resolve(tempDir, "probitas.config.ts");
    await Deno.writeTextFile(configPath, "old content");

    const exitCode = await initCommand(["--force"], tempDir);

    assertEquals(exitCode, 0);

    const content = await Deno.readTextFile(configPath);
    assertStringIncludes(content, "ProbitasConfig");
  });

  it("shows help text with --help flag", async () => {
    const tempDir = await Deno.makeTempDir();
    await using _cleanup = defer(async () => {
      await Deno.remove(tempDir, { recursive: true });
    });

    const exitCode = await initCommand(["--help"], tempDir);

    assertEquals(exitCode, 0);
  });
});
