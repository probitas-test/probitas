/**
 * Tests for configuration file loader
 *
 * @requires --allow-read Permission to read config files
 * @requires --allow-write Permission to write temporary test files
 * @module
 */

import { assertEquals, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { sandbox } from "@lambdalisue/sandbox";
import { loadConfig } from "./config.ts";

describe("config loader", () => {
  describe("loadConfig", () => {
    it("loads probitas section from deno.json", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          probitas: {
            reporter: "dot",
            includes: ["**/*.test.ts"],
          },
        }),
      );

      const config = await loadConfig(configPath);

      assertEquals(config.reporter, "dot");
      assertEquals(config.includes, ["**/*.test.ts"]);
    });

    it("loads probitas section from deno.jsonc with comments", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("deno.jsonc");
      await Deno.writeTextFile(
        configPath,
        `{
          // Probitas configuration
          "probitas": {
            "reporter": "json",
            "maxConcurrency": 4
          }
        }`,
      );

      const config = await loadConfig(configPath);

      assertEquals(config.reporter, "json");
      assertEquals(config.maxConcurrency, 4);
    });

    it("returns empty config when no probitas section exists", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({ imports: {} }),
      );

      const config = await loadConfig(configPath);

      assertEquals(config, {});
    });

    it("handles all valid config fields", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          probitas: {
            reporter: "list",
            includes: ["**/*.scenario.ts"],
            excludes: ["**/*.skip.ts"],
            selectors: ["tag:smoke", "!tag:slow"],
            maxConcurrency: 5,
            maxFailures: 3,
          },
        }),
      );

      const config = await loadConfig(configPath);

      assertEquals(config.reporter, "list");
      assertEquals(config.includes, ["**/*.scenario.ts"]);
      assertEquals(config.excludes, ["**/*.skip.ts"]);
      assertEquals(config.selectors, ["tag:smoke", "!tag:slow"]);
      assertEquals(config.maxConcurrency, 5);
      assertEquals(config.maxFailures, 3);
    });

    it("validates reporter values", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          probitas: {
            reporter: "invalid-reporter",
          },
        }),
      );

      await assertRejects(
        async () => await loadConfig(configPath),
        Error,
      );
    });

    it("validates array fields", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          probitas: {
            includes: "not-an-array",
          },
        }),
      );

      await assertRejects(
        async () => await loadConfig(configPath),
        Error,
      );
    });

    it("allows partial config with only some fields", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          probitas: {
            reporter: "dot",
          },
        }),
      );

      const config = await loadConfig(configPath);

      assertEquals(config.reporter, "dot");
      assertEquals(config.includes, undefined);
      assertEquals(config.excludes, undefined);
    });

    it("throws error for invalid JSON syntax", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        configPath,
        "{ invalid json",
      );

      await assertRejects(
        async () => await loadConfig(configPath),
        Error,
      );
    });

    it("throws error for non-existent file", async () => {
      await assertRejects(
        async () => await loadConfig("/nonexistent/deno.json"),
        Error,
      );
    });
  });
});
