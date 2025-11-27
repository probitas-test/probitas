/**
 * Tests for configuration file loader
 *
 * @requires --allow-read Permission to read config files
 * @requires --allow-write Permission to write temporary test files
 * @module
 */

import outdent from "@cspotcode/outdent";
import { assertEquals, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { sandbox } from "@lambdalisue/sandbox";
import { loadConfig } from "./config.ts";

describe("config loader", () => {
  describe("loadConfig", () => {
    it("returns null when no config file exists", async () => {
      await using sbox = await sandbox();

      const result = await loadConfig(sbox.path);
      assertEquals(result, null);
    });

    it("loads probitas.config.ts when exists", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.config.ts");
      const configContent = outdent`
        export default {
          reporter: "list",
          verbosity: "normal",
        };
      `;
      await Deno.writeTextFile(configPath, configContent);

      const result = await loadConfig(sbox.path);
      assertEquals(result?.reporter, "list");
      assertEquals(result?.verbosity, "normal");
    });

    it("loads probitas.config.js when exists", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.config.js");
      const configContent = outdent`
        export default {
          reporter: "dot",
          verbosity: "verbose",
        };
      `;
      await Deno.writeTextFile(configPath, configContent);

      const result = await loadConfig(sbox.path);
      assertEquals(result?.reporter, "dot");
      assertEquals(result?.verbosity, "verbose");
    });

    it("loads config from specified path", async () => {
      await using sbox = await sandbox();

      const subDir = sbox.resolve("config");
      await Deno.mkdir(subDir, { recursive: true });

      const configPath = sbox.resolve("config/custom.config.ts");
      await Deno.writeTextFile(
        configPath,
        "export default { reporter: 'json' };",
      );

      const result = await loadConfig(sbox.path, "config/custom.config.ts");
      assertEquals(result?.reporter, "json");
    });

    it("throws error when specified config file does not exist", async () => {
      await using sbox = await sandbox();

      await assertRejects(
        async () => {
          await loadConfig(sbox.path, "nonexistent.config.ts");
        },
        Error,
        "Failed to load config file",
      );
    });

    it("throws error for invalid config syntax", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.config.ts");
      const invalidContent = "export default { invalid: syntax here";
      await Deno.writeTextFile(configPath, invalidContent);

      await assertRejects(
        async () => {
          await loadConfig(sbox.path);
        },
        Error,
        "Failed to load config file",
      );
    });
  });
});
