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
      // Check new includes pattern
      assertStringIncludes(
        config.probitas.includes[0],
        "probitas/**/*.probitas.ts",
      );
    });
  });

  describe("when deno.json exists", () => {
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
    it("preserves comments when adding probitas config", async () => {
      await using sbox = await sandbox();

      const denoJsoncPath = sbox.resolve("deno.jsonc");
      const originalContent = `{
  // Project configuration
  "name": "my-app",
  "imports": {}
}`;
      await Deno.writeTextFile(denoJsoncPath, originalContent);

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 0);

      const content = await Deno.readTextFile(denoJsoncPath);
      // Comments should be preserved
      assertStringIncludes(content, "// Project configuration");
      // Probitas config should be added
      assertStringIncludes(content, '"probitas"');
    });

    it("adds probitas config to jsonc file", async () => {
      await using sbox = await sandbox();

      const denoJsoncPath = sbox.resolve("deno.jsonc");
      await Deno.writeTextFile(
        denoJsoncPath,
        JSON.stringify({ imports: {} }, null, 2),
      );

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 0);

      const content = await Deno.readTextFile(denoJsoncPath);
      assertStringIncludes(content, '"probitas"');
      assertStringIncludes(content, "probitas/**/*.probitas.ts");
    });

    it("overwrites probitas section with --force", async () => {
      await using sbox = await sandbox();

      const denoJsoncPath = sbox.resolve("deno.jsonc");
      await Deno.writeTextFile(
        denoJsoncPath,
        `{
  // My custom comment
  "imports": {},
  "probitas": { "reporter": "dot" }
}`,
      );

      const exitCode = await initCommand(["--force"], sbox.path);

      assertEquals(exitCode, 0);

      const content = await Deno.readTextFile(denoJsoncPath);
      // Comments should be preserved
      assertStringIncludes(content, "// My custom comment");
      // Probitas config should be overwritten
      assertStringIncludes(content, '"reporter": "list"');
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

  describe("probitas directory", () => {
    it("creates probitas directory, example file, and Claude Code skill", async () => {
      await using sbox = await sandbox();

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 0);

      const probitasDir = sbox.resolve("probitas");
      const examplePath = sbox.resolve("probitas/example.probitas.ts");
      const skillPath = sbox.resolve(".claude/skills/probitas/SKILL.md");
      const overviewPath = sbox.resolve(".claude/skills/probitas/overview.md");

      assertEquals(await exists(probitasDir), true);
      assertEquals(await exists(examplePath), true);
      assertEquals(await exists(skillPath), true);
      assertEquals(await exists(overviewPath), true);

      const exampleContent = await Deno.readTextFile(examplePath);
      assertStringIncludes(exampleContent, "Example Scenario");

      const skillContent = await Deno.readTextFile(skillPath);
      assertStringIncludes(skillContent, "Probitas Skill");
      assertStringIncludes(skillContent, "jsr-probitas.github.io/documents");

      const overviewContent = await Deno.readTextFile(overviewPath);
      assertStringIncludes(overviewContent, "Probitas Overview");
      assertStringIncludes(overviewContent, "jsr-probitas.github.io/documents");
    });

    it("returns error when example exists without --force", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("probitas"), { recursive: true });
      await Deno.writeTextFile(
        sbox.resolve("probitas/example.probitas.ts"),
        "old content",
      );

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 2);

      // Content should be unchanged
      const content = await Deno.readTextFile(
        sbox.resolve("probitas/example.probitas.ts"),
      );
      assertEquals(content, "old content");
    });

    it("overwrites example with --force", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("probitas"), { recursive: true });
      await Deno.writeTextFile(
        sbox.resolve("probitas/example.probitas.ts"),
        "old content",
      );

      const exitCode = await initCommand(["--force"], sbox.path);

      assertEquals(exitCode, 0);

      const content = await Deno.readTextFile(
        sbox.resolve("probitas/example.probitas.ts"),
      );
      assertStringIncludes(content, "Example Scenario");
    });
  });

  describe("Claude Code skill", () => {
    it("returns error when skill exists without --force", async () => {
      await using sbox = await sandbox();

      const skillPath = sbox.resolve(".claude/skills/probitas/SKILL.md");
      await Deno.mkdir(sbox.resolve(".claude/skills/probitas"), {
        recursive: true,
      });
      await Deno.writeTextFile(skillPath, "old skill content");

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 2);

      const content = await Deno.readTextFile(skillPath);
      assertEquals(content, "old skill content");
    });

    it("returns error when overview exists without --force", async () => {
      await using sbox = await sandbox();

      const overviewPath = sbox.resolve(".claude/skills/probitas/overview.md");
      await Deno.mkdir(sbox.resolve(".claude/skills/probitas"), {
        recursive: true,
      });
      await Deno.writeTextFile(overviewPath, "old overview content");

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 2);

      const content = await Deno.readTextFile(overviewPath);
      assertEquals(content, "old overview content");
    });

    it("overwrites skill with --force", async () => {
      await using sbox = await sandbox();

      const skillPath = sbox.resolve(".claude/skills/probitas/SKILL.md");
      const overviewPath = sbox.resolve(".claude/skills/probitas/overview.md");
      await Deno.mkdir(sbox.resolve(".claude/skills/probitas"), {
        recursive: true,
      });
      await Deno.writeTextFile(skillPath, "old skill content");
      await Deno.writeTextFile(overviewPath, "old overview content");

      const exitCode = await initCommand(["--force"], sbox.path);

      assertEquals(exitCode, 0);

      const content = await Deno.readTextFile(skillPath);
      assertStringIncludes(content, "Probitas Skill");

      const overviewContent = await Deno.readTextFile(overviewPath);
      assertStringIncludes(overviewContent, "Probitas Overview");
    });
  });

  describe("help", () => {
    it("shows help text with --help flag", async () => {
      await using sbox = await sandbox();

      const exitCode = await initCommand(["--help"], sbox.path);

      assertEquals(exitCode, 0);
    });
  });

  describe("error handling", () => {
    it("shows user-friendly error for invalid JSON syntax", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(
        sbox.resolve("deno.json"),
        "{ invalid json }",
      );

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 2);
    });

    it("shows user-friendly error for invalid imports section", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(
        sbox.resolve("deno.json"),
        JSON.stringify({ imports: "not an object" }, null, 2),
      );

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 2);
    });

    it("shows user-friendly error for non-string import value", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(
        sbox.resolve("deno.json"),
        JSON.stringify({ imports: { foo: 123 } }, null, 2),
      );

      const exitCode = await initCommand([], sbox.path);

      assertEquals(exitCode, 2);
    });
  });
});
