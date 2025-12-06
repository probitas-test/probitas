/**
 * Tests for init command
 *
 * @requires --allow-read Permission to read files
 * @requires --allow-write Permission to write files
 * @module
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { exists } from "@std/fs";
import { sandbox } from "@lambdalisue/sandbox";
import { initCommand } from "./init.ts";

describe("init command", () => {
  describe("when no deno.json exists", () => {
    it("creates deno.json with template content", async () => {
      await using sbox = await sandbox();

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 0);

      const denoJsonPath = sbox.resolve("deno.json");
      assertEquals(await exists(denoJsonPath), true);

      const content = await Deno.readTextFile(denoJsonPath);
      const config = JSON.parse(content);

      // Has imports.probitas
      assertEquals(typeof config.imports, "object");
      assertEquals(typeof config.imports.probitas, "string");
      assertStringIncludes(
        config.imports.probitas,
        "jsr:@probitas/probitas",
      );

      // Has probitas section
      assertEquals(typeof config.probitas, "object");
      assertEquals(config.probitas.reporter, "list");
      assertEquals(Array.isArray(config.probitas.includes), true);
      assertEquals(Array.isArray(config.probitas.excludes), true);
    });
  });

  describe("when deno.json exists (no comments)", () => {
    it("adds probitas import when not exists", async () => {
      await using sbox = await sandbox();

      const denoJsonPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        denoJsonPath,
        JSON.stringify(
          { imports: { "existing": "jsr:@example/pkg" } },
          null,
          2,
        ),
      );

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 0);

      const content = await Deno.readTextFile(denoJsonPath);
      const config = JSON.parse(content);

      // Preserves existing imports
      assertEquals(config.imports.existing, "jsr:@example/pkg");
      // Adds probitas import
      assertStringIncludes(
        config.imports.probitas,
        "jsr:@probitas/probitas",
      );
    });

    it("does not overwrite existing probitas import", async () => {
      await using sbox = await sandbox();

      const denoJsonPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        denoJsonPath,
        JSON.stringify(
          {
            imports: { "probitas": "jsr:@probitas/probitas@^0" },
          },
          null,
          2,
        ),
      );

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 0);

      const content = await Deno.readTextFile(denoJsonPath);
      const config = JSON.parse(content);

      // Should keep existing version
      assertEquals(config.imports.probitas, "jsr:@probitas/probitas@^0");
    });

    it("adds probitas section when not exists", async () => {
      await using sbox = await sandbox();

      const denoJsonPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        denoJsonPath,
        JSON.stringify(
          {
            imports: { "probitas": "jsr:@probitas/probitas@^0" },
          },
          null,
          2,
        ),
      );

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 0);

      const content = await Deno.readTextFile(denoJsonPath);
      const config = JSON.parse(content);

      assertEquals(typeof config.probitas, "object");
      assertEquals(config.probitas.reporter, "list");
    });

    it("does not overwrite existing probitas section without --force", async () => {
      await using sbox = await sandbox();

      const denoJsonPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        denoJsonPath,
        JSON.stringify(
          {
            imports: { "probitas": "jsr:@probitas/probitas" },
            probitas: { reporter: "dot", maxConcurrency: 10 },
          },
          null,
          2,
        ),
      );

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 2);

      // Config should be unchanged
      const content = await Deno.readTextFile(denoJsonPath);
      const config = JSON.parse(content);
      assertEquals(config.probitas.reporter, "dot");
      assertEquals(config.probitas.maxConcurrency, 10);
    });

    it("overwrites existing probitas section with --force", async () => {
      await using sbox = await sandbox();

      const denoJsonPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        denoJsonPath,
        JSON.stringify(
          {
            imports: { "probitas": "jsr:@probitas/probitas" },
            probitas: { reporter: "dot", maxConcurrency: 10 },
          },
          null,
          2,
        ),
      );

      const exitCode = await initCommand(["--force"], sbox.path);

      assertEquals(exitCode, 0);

      const content = await Deno.readTextFile(denoJsonPath);
      const config = JSON.parse(content);

      // Should overwrite with template values
      assertEquals(config.probitas.reporter, "list");
      assertEquals(config.probitas.maxConcurrency, undefined);
    });
  });

  describe("when deno.jsonc exists (with comments)", () => {
    it("returns error without --force", async () => {
      await using sbox = await sandbox();

      const denoJsoncPath = sbox.resolve("deno.jsonc");
      await Deno.writeTextFile(
        denoJsoncPath,
        `{
          // This is a comment
          "imports": {}
        }`,
      );

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 2);
    });

    it("adds probitas when no comments exist", async () => {
      await using sbox = await sandbox();

      const denoJsoncPath = sbox.resolve("deno.jsonc");
      await Deno.writeTextFile(
        denoJsoncPath,
        JSON.stringify({ imports: {} }, null, 2),
      );

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 0);

      const content = await Deno.readTextFile(denoJsoncPath);
      const config = JSON.parse(content);

      assertEquals(typeof config.probitas, "object");
    });

    it("overwrites with --force (comments are lost)", async () => {
      await using sbox = await sandbox();

      const denoJsoncPath = sbox.resolve("deno.jsonc");
      await Deno.writeTextFile(
        denoJsoncPath,
        `{
          // This comment will be lost
          "imports": {}
        }`,
      );

      const exitCode = await initCommand(["--force"], sbox.path);

      assertEquals(exitCode, 0);

      const content = await Deno.readTextFile(denoJsoncPath);
      const config = JSON.parse(content);

      assertEquals(typeof config.probitas, "object");
      // Comments are lost after rewrite
      assertEquals(content.includes("//"), false);
    });
  });

  describe("when both deno.json and deno.jsonc exist", () => {
    it("prefers deno.json", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(
        sbox.resolve("deno.json"),
        JSON.stringify({ imports: {} }, null, 2),
      );
      await Deno.writeTextFile(
        sbox.resolve("deno.jsonc"),
        JSON.stringify({ imports: {} }, null, 2),
      );

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 0);

      // Should update deno.json
      const content = await Deno.readTextFile(sbox.resolve("deno.json"));
      const config = JSON.parse(content);
      assertEquals(typeof config.probitas, "object");

      // deno.jsonc should remain unchanged
      const jsoncContent = await Deno.readTextFile(sbox.resolve("deno.jsonc"));
      const jsoncConfig = JSON.parse(jsoncContent);
      assertEquals(jsoncConfig.probitas, undefined);
    });
  });

  describe("scenario directory", () => {
    it("creates scenarios directory and example file", async () => {
      await using sbox = await sandbox();

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 0);

      const scenariosDir = sbox.resolve("scenarios");
      const examplePath = sbox.resolve("scenarios/example.scenario.ts");

      assertEquals(await exists(scenariosDir), true);
      assertEquals(await exists(examplePath), true);

      const exampleContent = await Deno.readTextFile(examplePath);
      assertStringIncludes(exampleContent, "Example Scenario");
    });

    it("returns error when example exists without --force", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("scenarios"), { recursive: true });
      await Deno.writeTextFile(
        sbox.resolve("scenarios/example.scenario.ts"),
        "old content",
      );

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 2);

      // Content should be unchanged
      const content = await Deno.readTextFile(
        sbox.resolve("scenarios/example.scenario.ts"),
      );
      assertEquals(content, "old content");
    });

    it("overwrites example with --force", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("scenarios"), { recursive: true });
      await Deno.writeTextFile(
        sbox.resolve("scenarios/example.scenario.ts"),
        "old content",
      );

      const exitCode = await initCommand(["--force"], sbox.path);

      assertEquals(exitCode, 0);

      const content = await Deno.readTextFile(
        sbox.resolve("scenarios/example.scenario.ts"),
      );
      assertStringIncludes(content, "Example Scenario");
    });
  });

  describe("help", () => {
    it("shows help text with --help flag", async () => {
      await using sbox = await sandbox();

      const exitCode = await initCommand(["--help"], sbox.path);

      assertEquals(exitCode, 0);
    });
  });
});
