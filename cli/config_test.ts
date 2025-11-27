/**
 * Tests for configuration file loader
 *
 * @requires --allow-read Permission to read config files
 * @requires --allow-write Permission to write temporary test files
 * @module
 */

import outdent from "outdent";
import { assertEquals, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { resolve } from "@std/path";
import { defer } from "../src/helper/defer.ts";
import { loadConfig } from "./config.ts";

describe("config loader", () => {
  describe("loadConfig", () => {
    it("returns null when no config file exists", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const result = await loadConfig(tempDir);
      assertEquals(result, null);
    });

    it("loads probitas.config.ts when exists", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const configPath = resolve(tempDir, "probitas.config.ts");
      const configContent = outdent`
        export default {
          reporter: "list",
          verbosity: "normal",
        };
      `;
      await Deno.writeTextFile(configPath, configContent);

      const result = await loadConfig(tempDir);
      assertEquals(result?.reporter, "list");
      assertEquals(result?.verbosity, "normal");
    });

    it("loads probitas.config.js when exists", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const configPath = resolve(tempDir, "probitas.config.js");
      const configContent = outdent`
        export default {
          reporter: "dot",
          verbosity: "verbose",
        };
      `;
      await Deno.writeTextFile(configPath, configContent);

      const result = await loadConfig(tempDir);
      assertEquals(result?.reporter, "dot");
      assertEquals(result?.verbosity, "verbose");
    });

    it("loads config from specified path", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const subDir = resolve(tempDir, "config");
      await Deno.mkdir(subDir, { recursive: true });

      const configPath = resolve(subDir, "custom.config.ts");
      await Deno.writeTextFile(
        configPath,
        "export default { reporter: 'json' };",
      );

      const result = await loadConfig(tempDir, "config/custom.config.ts");
      assertEquals(result?.reporter, "json");
    });

    it("throws error when specified config file does not exist", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      await assertRejects(
        async () => {
          await loadConfig(tempDir, "nonexistent.config.ts");
        },
        Error,
        "Failed to load config file",
      );
    });

    it("throws error for invalid config syntax", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const configPath = resolve(tempDir, "probitas.config.ts");
      const invalidContent = "export default { invalid: syntax here";
      await Deno.writeTextFile(configPath, invalidContent);

      await assertRejects(
        async () => {
          await loadConfig(tempDir);
        },
        Error,
        "Failed to load config file",
      );
    });
  });
});
