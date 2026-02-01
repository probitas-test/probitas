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
import { findProbitasConfigFile, loadConfig } from "./config.ts";

describe("config loader", () => {
  describe("findProbitasConfigFile", () => {
    it("finds probitas.json in current directory", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve("probitas.json"), "{}");

      const result = await findProbitasConfigFile(sbox.path);

      assertEquals(result, sbox.resolve("probitas.json"));
    });

    it("finds probitas.jsonc in current directory", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve("probitas.jsonc"), "{}");

      const result = await findProbitasConfigFile(sbox.path);

      assertEquals(result, sbox.resolve("probitas.jsonc"));
    });

    it("finds .probitas.json in current directory", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve(".probitas.json"), "{}");

      const result = await findProbitasConfigFile(sbox.path);

      assertEquals(result, sbox.resolve(".probitas.json"));
    });

    it("finds .probitas.jsonc in current directory", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve(".probitas.jsonc"), "{}");

      const result = await findProbitasConfigFile(sbox.path);

      assertEquals(result, sbox.resolve(".probitas.jsonc"));
    });

    it("prefers probitas.json over probitas.jsonc", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve("probitas.json"), "{}");
      await Deno.writeTextFile(sbox.resolve("probitas.jsonc"), "{}");

      const result = await findProbitasConfigFile(sbox.path);

      assertEquals(result, sbox.resolve("probitas.json"));
    });

    it("prefers probitas.json over .probitas.json", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve("probitas.json"), "{}");
      await Deno.writeTextFile(sbox.resolve(".probitas.json"), "{}");

      const result = await findProbitasConfigFile(sbox.path);

      assertEquals(result, sbox.resolve("probitas.json"));
    });

    it("returns undefined when no config file exists", async () => {
      await using sbox = await sandbox();

      const result = await findProbitasConfigFile(sbox.path);

      assertEquals(result, undefined);
    });

    it("finds config in parent directory with parentLookup", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("subdir"), { recursive: true });
      await Deno.writeTextFile(sbox.resolve("probitas.json"), "{}");

      const result = await findProbitasConfigFile(sbox.resolve("subdir"), {
        parentLookup: true,
      });

      assertEquals(result, sbox.resolve("probitas.json"));
    });

    it("finds config in deeply nested parent directory", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("a/b/c"), { recursive: true });
      await Deno.writeTextFile(sbox.resolve("probitas.json"), "{}");

      const result = await findProbitasConfigFile(sbox.resolve("a/b/c"), {
        parentLookup: true,
      });

      assertEquals(result, sbox.resolve("probitas.json"));
    });

    it("does not search parent directories without parentLookup", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("subdir"), { recursive: true });
      await Deno.writeTextFile(sbox.resolve("probitas.json"), "{}");

      const result = await findProbitasConfigFile(sbox.resolve("subdir"));

      assertEquals(result, undefined);
    });

    it("stops at filesystem root with parentLookup", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("subdir"), { recursive: true });
      // No config file in any parent

      const result = await findProbitasConfigFile(sbox.resolve("subdir"), {
        parentLookup: true,
      });

      assertEquals(result, undefined);
    });
  });

  describe("loadConfig", () => {
    it("loads configuration from probitas.json", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          reporter: "json",
          includes: ["**/*.test.ts"],
        }),
      );

      const config = await loadConfig(configPath);

      assertEquals(config.reporter, "json");
      assertEquals(config.includes, ["**/*.test.ts"]);
    });

    it("loads configuration from probitas.jsonc with comments", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.jsonc");
      await Deno.writeTextFile(
        configPath,
        `{
          // Reporter type
          "reporter": "json",
          "maxConcurrency": 4
        }`,
      );

      const config = await loadConfig(configPath);

      assertEquals(config.reporter, "json");
      assertEquals(config.maxConcurrency, 4);
    });

    it("returns empty config for empty object", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(configPath, "{}");

      const config = await loadConfig(configPath);

      assertEquals(config, {});
    });

    it("handles all valid config fields", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          reporter: "list",
          includes: ["**/*.probitas.ts"],
          excludes: ["**/*.skip.ts"],
          selectors: ["tag:smoke", "!tag:slow"],
          maxConcurrency: 5,
          maxFailures: 3,
          timeout: "30s",
        }),
      );

      const config = await loadConfig(configPath);

      assertEquals(config.reporter, "list");
      assertEquals(config.includes, ["**/*.probitas.ts"]);
      assertEquals(config.excludes, ["**/*.skip.ts"]);
      assertEquals(config.selectors, ["tag:smoke", "!tag:slow"]);
      assertEquals(config.maxConcurrency, 5);
      assertEquals(config.maxFailures, 3);
      assertEquals(config.timeout, "30s");
    });

    it("validates reporter values", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          reporter: "invalid-reporter",
        }),
      );

      await assertRejects(
        async () => await loadConfig(configPath),
        Error,
      );
    });

    it("validates array fields", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          includes: "not-an-array",
        }),
      );

      await assertRejects(
        async () => await loadConfig(configPath),
        Error,
      );
    });

    it("allows partial config with only some fields", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          reporter: "json",
        }),
      );

      const config = await loadConfig(configPath);

      assertEquals(config.reporter, "json");
      assertEquals(config.includes, undefined);
      assertEquals(config.excludes, undefined);
    });

    it("throws error for invalid JSON syntax", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
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
        async () => await loadConfig("/nonexistent/probitas.json"),
        Error,
      );
    });

    it("loads timeout configuration", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          timeout: "10m",
        }),
      );

      const config = await loadConfig(configPath);

      assertEquals(config.timeout, "10m");
    });

    it("validates timeout must be string", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          timeout: 123,
        }),
      );

      await assertRejects(
        async () => await loadConfig(configPath),
        Error,
      );
    });

    it("loads stepOptions configuration", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          stepOptions: {
            timeout: 60000,
            retry: {
              maxAttempts: 3,
              backoff: "exponential",
            },
          },
        }),
      );

      const config = await loadConfig(configPath);

      assertEquals(config.stepOptions, {
        timeout: 60000,
        retry: {
          maxAttempts: 3,
          backoff: "exponential",
        },
      });
    });

    it("loads partial stepOptions with only timeout", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          stepOptions: {
            timeout: 45000,
          },
        }),
      );

      const config = await loadConfig(configPath);

      assertEquals(config.stepOptions, {
        timeout: 45000,
      });
    });

    it("loads partial stepOptions with only retry", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          stepOptions: {
            retry: {
              maxAttempts: 5,
            },
          },
        }),
      );

      const config = await loadConfig(configPath);

      assertEquals(config.stepOptions, {
        retry: {
          maxAttempts: 5,
        },
      });
    });

    it("validates stepOptions.timeout must be number", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          stepOptions: {
            timeout: "30s",
          },
        }),
      );

      await assertRejects(
        async () => await loadConfig(configPath),
        Error,
      );
    });

    it("validates stepOptions.retry.backoff values", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          stepOptions: {
            retry: {
              backoff: "invalid",
            },
          },
        }),
      );

      await assertRejects(
        async () => await loadConfig(configPath),
        Error,
      );
    });

    it("validates stepOptions.retry.maxAttempts must be number", async () => {
      await using sbox = await sandbox();

      const configPath = sbox.resolve("probitas.json");
      await Deno.writeTextFile(
        configPath,
        JSON.stringify({
          stepOptions: {
            retry: {
              maxAttempts: "3",
            },
          },
        }),
      );

      await assertRejects(
        async () => await loadConfig(configPath),
        Error,
      );
    });
  });
});
