/**
 * Tests for utility functions
 *
 * @module
 */

import {
  assertEquals,
  assertInstanceOf,
  assertStringIncludes,
  assertThrows,
} from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { sandbox } from "@lambdalisue/sandbox";
import { toFileUrl } from "@std/path";
import {
  createTempSubprocessConfig,
  findDenoConfigFile,
  getVersion,
  parsePositiveInteger,
  readAsset,
  readTemplate,
  resolveReporter,
} from "./utils.ts";
import {
  DotReporter,
  JSONReporter,
  ListReporter,
  TAPReporter,
} from "@probitas/reporter";

describe("utils", () => {
  describe("resolveReporter", () => {
    const reporters = [
      { name: "list", class: ListReporter },
      { name: "dot", class: DotReporter },
      { name: "json", class: JSONReporter },
      { name: "tap", class: TAPReporter },
    ];

    for (const { name, class: ReporterClass } of reporters) {
      it(`resolves '${name}' to ${ReporterClass.name}`, () => {
        const reporter = resolveReporter(name);
        assertInstanceOf(reporter, ReporterClass);
      });
    }

    it("returns ListReporter as default", () => {
      assertEquals(resolveReporter(undefined) instanceof ListReporter, true);
      assertEquals(resolveReporter("") instanceof ListReporter, true);
    });

    it("throws error for unknown reporter name", () => {
      assertThrows(
        () => resolveReporter("unknown"),
        Error,
        "Unknown reporter: unknown",
      );
    });
  });

  describe("parsePositiveInteger", () => {
    it("parses string number", () => {
      const result = parsePositiveInteger("10", "test");
      assertEquals(result, 10);
    });

    it("parses numeric value", () => {
      const result = parsePositiveInteger(5, "test");
      assertEquals(result, 5);
    });

    it("returns undefined when undefined is passed", () => {
      const result = parsePositiveInteger(undefined, "test");
      assertEquals(result, undefined);
    });

    it("throws error for invalid number string", () => {
      assertThrows(
        () => parsePositiveInteger("abc", "test"),
        Error,
        "test must be a positive integer",
      );
    });

    it("throws error for decimal number", () => {
      assertThrows(
        () => parsePositiveInteger("1.5", "test"),
        Error,
        "test must be a positive integer",
      );
    });

    it("throws error for zero", () => {
      assertThrows(
        () => parsePositiveInteger("0", "test"),
        Error,
        "test must be a positive integer",
      );
    });

    it("throws error for negative number", () => {
      assertThrows(
        () => parsePositiveInteger("-1", "test"),
        Error,
        "test must be a positive integer",
      );
    });
  });

  describe("readTemplate", () => {
    it("reads template files", async () => {
      const denoJson = await readTemplate("deno.json");
      assertStringIncludes(denoJson, "imports");
      assertStringIncludes(denoJson, "probitas");

      const example = await readTemplate("example.scenario.ts");
      assertStringIncludes(example, "Example Scenario");
    });
  });

  describe("readAsset", () => {
    it("reads asset files", async () => {
      const usage = await readAsset("usage.txt");
      assertStringIncludes(usage, "Probitas");

      const usageRun = await readAsset("usage-run.txt");
      assertStringIncludes(usageRun, "probitas run");
    });
  });

  describe("getVersion", () => {
    it("returns version string or undefined", () => {
      const version = getVersion();
      // Should be a version string or undefined
      if (version !== undefined) {
        assertEquals(typeof version, "string");
      }
    });
  });

  describe("findDenoConfigFile", () => {
    it("finds deno.json in current directory", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve("deno.json"), "{}");

      const result = await findDenoConfigFile(sbox.path);

      assertEquals(result, sbox.resolve("deno.json"));
    });

    it("finds deno.jsonc in current directory", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve("deno.jsonc"), "{}");

      const result = await findDenoConfigFile(sbox.path);

      assertEquals(result, sbox.resolve("deno.jsonc"));
    });

    it("prefers deno.json over deno.jsonc", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve("deno.json"), "{}");
      await Deno.writeTextFile(sbox.resolve("deno.jsonc"), "{}");

      const result = await findDenoConfigFile(sbox.path);

      assertEquals(result, sbox.resolve("deno.json"));
    });

    it("returns undefined when no config file exists", async () => {
      await using sbox = await sandbox();

      const result = await findDenoConfigFile(sbox.path);

      assertEquals(result, undefined);
    });

    it("finds config in parent directory with parentLookup", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve("deno.json"), "{}");
      await Deno.mkdir(sbox.resolve("subdir"), { recursive: true });

      const result = await findDenoConfigFile(sbox.resolve("subdir"), {
        parentLookup: true,
      });

      assertEquals(result, sbox.resolve("deno.json"));
    });

    it("finds config in nested parent directory", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve("deno.json"), "{}");
      await Deno.mkdir(sbox.resolve("a/b/c"), { recursive: true });

      const result = await findDenoConfigFile(sbox.resolve("a/b/c"), {
        parentLookup: true,
      });

      assertEquals(result, sbox.resolve("deno.json"));
    });

    it("does not look up parent without parentLookup option", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve("deno.json"), "{}");
      await Deno.mkdir(sbox.resolve("subdir"), { recursive: true });

      const result = await findDenoConfigFile(sbox.resolve("subdir"));

      assertEquals(result, undefined);
    });

    it("stops at filesystem root with parentLookup", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("subdir"), { recursive: true });

      const result = await findDenoConfigFile(sbox.resolve("subdir"), {
        parentLookup: true,
      });

      assertEquals(result, undefined);
    });
  });

  describe("createTempSubprocessConfig", () => {
    it("creates config with probitas imports", async () => {
      await using stack = new AsyncDisposableStack();

      const configPath = await createTempSubprocessConfig(undefined);
      stack.defer(async () => {
        await Deno.remove(configPath);
      });

      const text = await Deno.readTextFile(configPath);
      const config = JSON.parse(text);

      // Verify probitas import exists
      assertEquals(typeof config.imports.probitas, "string");
      assertStringIncludes(config.imports.probitas, "probitas");

      // Verify other probitas packages exist
      assertEquals(typeof config.imports["@probitas/scenario"], "string");
      assertEquals(typeof config.imports["@probitas/runner"], "string");

      // Verify external dependencies exist
      assertEquals(typeof config.imports["@core/unknownutil"], "string");
      assertEquals(typeof config.imports["@std/cli"], "string");
    });

    it("merges user's imports", async () => {
      await using sbox = await sandbox();
      await using stack = new AsyncDisposableStack();

      // Create user's deno.json
      const userConfigPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        userConfigPath,
        JSON.stringify({
          imports: {
            "my-lib": "jsr:@my/lib@^1",
          },
        }),
      );

      const configPath = await createTempSubprocessConfig(userConfigPath);
      stack.defer(async () => {
        await Deno.remove(configPath);
      });

      const text = await Deno.readTextFile(configPath);
      const config = JSON.parse(text);

      // User's imports should be preserved
      assertEquals(config.imports["my-lib"], "jsr:@my/lib@^1");

      // Probitas import should be added
      assertEquals(typeof config.imports.probitas, "string");
    });

    it("resolves relative paths to file:// URLs", async () => {
      await using sbox = await sandbox();
      await using stack = new AsyncDisposableStack();

      // Create user's deno.json with relative path imports
      const userConfigPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        userConfigPath,
        JSON.stringify({
          imports: {
            "my-lib": "./lib/mod.ts",
            "my-utils": "../utils/mod.ts",
            "external": "jsr:@external/lib@^1",
          },
        }),
      );

      const configPath = await createTempSubprocessConfig(userConfigPath);
      stack.defer(async () => {
        await Deno.remove(configPath);
      });

      const text = await Deno.readTextFile(configPath);
      const config = JSON.parse(text);

      // Relative paths should be resolved to file:// URLs
      assertEquals(
        config.imports["my-lib"],
        toFileUrl(sbox.resolve("lib/mod.ts")).href,
      );
      assertEquals(
        config.imports["my-utils"],
        toFileUrl(sbox.resolve("../utils/mod.ts")).href,
      );

      // Non-relative paths should be preserved as-is
      assertEquals(config.imports["external"], "jsr:@external/lib@^1");
    });

    it("overrides user's probitas import with correct version", async () => {
      await using sbox = await sandbox();
      await using stack = new AsyncDisposableStack();

      // Create user's deno.json with old probitas import
      const userConfigPath = sbox.resolve("deno.json");
      await Deno.writeTextFile(
        userConfigPath,
        JSON.stringify({
          imports: {
            "probitas": "./old/path/mod.ts", // Should be overridden
          },
        }),
      );

      const configPath = await createTempSubprocessConfig(userConfigPath);
      stack.defer(async () => {
        await Deno.remove(configPath);
      });

      const text = await Deno.readTextFile(configPath);
      const config = JSON.parse(text);

      // Probitas import should be overridden (not the old path)
      assertEquals(typeof config.imports.probitas, "string");
      assertEquals(config.imports.probitas.includes("./old/path"), false);
      assertEquals(
        config.imports.probitas.includes("probitas") ||
          config.imports.probitas.includes("mod.ts"),
        true,
      );
    });
  });
});
