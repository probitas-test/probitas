/**
 * Tests for scenario file discovery
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { relative } from "@std/path";
import { sandbox } from "@lambdalisue/sandbox";
import { discoverScenarioFiles } from "./discover.ts";

describe("discover", () => {
  describe("discoverScenarioFiles", () => {
    it("discovers files from directory with default pattern", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve("test1.scenario.ts"), "");
      await Deno.writeTextFile(sbox.resolve("test2.scenario.ts"), "");
      await Deno.writeTextFile(sbox.resolve("other.ts"), "");

      const files = await discoverScenarioFiles([sbox.path], {});

      assertEquals(files.length, 2);
      assertEquals(files.map((f) => relative(sbox.path, f)).sort(), [
        "test1.scenario.ts",
        "test2.scenario.ts",
      ]);
    });

    it("discovers files from specified directory", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("api"), { recursive: true });
      await Deno.mkdir(sbox.resolve("e2e"), { recursive: true });

      await Deno.writeTextFile(sbox.resolve("api/test.scenario.ts"), "");
      await Deno.writeTextFile(sbox.resolve("e2e/test.scenario.ts"), "");

      const files = await discoverScenarioFiles([sbox.path], {});

      assertEquals(files.length, 2);
      assertEquals(files.map((f) => relative(sbox.path, f)).sort(), [
        "api/test.scenario.ts",
        "e2e/test.scenario.ts",
      ]);
    });

    it("discovers from specific file path", async () => {
      await using sbox = await sandbox();

      const testFile = sbox.resolve("test.scenario.ts");
      await Deno.writeTextFile(testFile, "");

      const files = await discoverScenarioFiles([testFile], {});

      assertEquals(files.length, 1);
      assertEquals(files[0], testFile);
    });

    it("discovers from directory with custom includes", async () => {
      await using sbox = await sandbox();

      await Deno.mkdir(sbox.resolve("api"), { recursive: true });
      await Deno.mkdir(sbox.resolve("e2e"), { recursive: true });

      await Deno.writeTextFile(sbox.resolve("api/test.scenario.ts"), "");
      await Deno.writeTextFile(sbox.resolve("e2e/test.scenario.ts"), "");

      const apiDir = sbox.resolve("api");
      const files = await discoverScenarioFiles([apiDir], {});

      assertEquals(files.length, 1);
      assertEquals(relative(sbox.path, files[0]), "api/test.scenario.ts");
    });

    it("uses exclude patterns", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve("test.scenario.ts"), "");
      await Deno.writeTextFile(sbox.resolve("skip.scenario.ts"), "");

      const files = await discoverScenarioFiles([sbox.path], {
        excludes: ["**/skip.scenario.ts"],
      });

      assertEquals(files.length, 1);
      assertEquals(relative(sbox.path, files[0]), "test.scenario.ts");
    });

    it("combines multiple paths", async () => {
      await using sbox = await sandbox();

      const file1 = sbox.resolve("test1.scenario.ts");
      const file2 = sbox.resolve("test2.scenario.ts");
      await Deno.writeTextFile(file1, "");
      await Deno.writeTextFile(file2, "");

      const files = await discoverScenarioFiles([file1, file2], {});

      assertEquals(files.length, 2);
      assertEquals(files.sort(), [file1, file2].sort());
    });

    it("returns sorted file paths", async () => {
      await using sbox = await sandbox();

      await Deno.writeTextFile(sbox.resolve("z.scenario.ts"), "");
      await Deno.writeTextFile(sbox.resolve("a.scenario.ts"), "");
      await Deno.writeTextFile(sbox.resolve("m.scenario.ts"), "");

      const files = await discoverScenarioFiles([sbox.path], {});

      assertEquals(files.map((f) => relative(sbox.path, f)), [
        "a.scenario.ts",
        "m.scenario.ts",
        "z.scenario.ts",
      ]);
    });
  });
});
