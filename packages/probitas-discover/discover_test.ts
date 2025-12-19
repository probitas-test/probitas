/**
 * Tests for scenario file discovery
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { relative } from "@std/path";
import { sandbox } from "@lambdalisue/sandbox";
import { type DiscoverProgress, discoverScenarioFiles } from "./discover.ts";

Deno.test("discover discoverScenarioFiles discovers files from directory with default pattern", async () => {
  await using sbox = await sandbox();

  await Deno.writeTextFile(sbox.resolve("test1.probitas.ts"), "");
  await Deno.writeTextFile(sbox.resolve("test2.probitas.ts"), "");
  await Deno.writeTextFile(sbox.resolve("other.ts"), "");

  const files = await discoverScenarioFiles([sbox.path], {});

  assertEquals(files.length, 2);
  assertEquals(files.map((f) => relative(sbox.path, f)).sort(), [
    "test1.probitas.ts",
    "test2.probitas.ts",
  ]);
});

Deno.test("discover discoverScenarioFiles discovers files from specified directory", async () => {
  await using sbox = await sandbox();

  await Deno.mkdir(sbox.resolve("api"), { recursive: true });
  await Deno.mkdir(sbox.resolve("e2e"), { recursive: true });

  await Deno.writeTextFile(sbox.resolve("api/test.probitas.ts"), "");
  await Deno.writeTextFile(sbox.resolve("e2e/test.probitas.ts"), "");

  const files = await discoverScenarioFiles([sbox.path], {});

  assertEquals(files.length, 2);
  assertEquals(files.map((f) => relative(sbox.path, f)).sort(), [
    "api/test.probitas.ts",
    "e2e/test.probitas.ts",
  ]);
});

Deno.test("discover discoverScenarioFiles discovers from specific file path", async () => {
  await using sbox = await sandbox();

  const testFile = sbox.resolve("test.probitas.ts");
  await Deno.writeTextFile(testFile, "");

  const files = await discoverScenarioFiles([testFile], {});

  assertEquals(files.length, 1);
  assertEquals(files[0], testFile);
});

Deno.test("discover discoverScenarioFiles discovers from directory with custom includes", async () => {
  await using sbox = await sandbox();

  await Deno.mkdir(sbox.resolve("api"), { recursive: true });
  await Deno.mkdir(sbox.resolve("e2e"), { recursive: true });

  await Deno.writeTextFile(sbox.resolve("api/test.probitas.ts"), "");
  await Deno.writeTextFile(sbox.resolve("e2e/test.probitas.ts"), "");

  const apiDir = sbox.resolve("api");
  const files = await discoverScenarioFiles([apiDir], {});

  assertEquals(files.length, 1);
  assertEquals(relative(sbox.path, files[0]), "api/test.probitas.ts");
});

Deno.test("discover discoverScenarioFiles uses exclude patterns", async () => {
  await using sbox = await sandbox();

  await Deno.writeTextFile(sbox.resolve("test.probitas.ts"), "");
  await Deno.writeTextFile(sbox.resolve("skip.probitas.ts"), "");

  const files = await discoverScenarioFiles([sbox.path], {
    excludes: ["**/skip.probitas.ts"],
  });

  assertEquals(files.length, 1);
  assertEquals(relative(sbox.path, files[0]), "test.probitas.ts");
});

Deno.test("discover discoverScenarioFiles combines multiple paths", async () => {
  await using sbox = await sandbox();

  const file1 = sbox.resolve("test1.probitas.ts");
  const file2 = sbox.resolve("test2.probitas.ts");
  await Deno.writeTextFile(file1, "");
  await Deno.writeTextFile(file2, "");

  const files = await discoverScenarioFiles([file1, file2], {});

  assertEquals(files.length, 2);
  assertEquals(files.sort(), [file1, file2].sort());
});

Deno.test("discover discoverScenarioFiles returns sorted file paths", async () => {
  await using sbox = await sandbox();

  await Deno.writeTextFile(sbox.resolve("z.probitas.ts"), "");
  await Deno.writeTextFile(sbox.resolve("a.probitas.ts"), "");
  await Deno.writeTextFile(sbox.resolve("m.probitas.ts"), "");

  const files = await discoverScenarioFiles([sbox.path], {});

  assertEquals(files.map((f) => relative(sbox.path, f)), [
    "a.probitas.ts",
    "m.probitas.ts",
    "z.probitas.ts",
  ]);
});

Deno.test("discover discoverScenarioFiles calls onProgress callback for directories", async () => {
  await using sbox = await sandbox();

  await Deno.mkdir(sbox.resolve("dir1"), { recursive: true });
  await Deno.mkdir(sbox.resolve("dir2"), { recursive: true });

  await Deno.writeTextFile(sbox.resolve("dir1/test1.probitas.ts"), "");
  await Deno.writeTextFile(sbox.resolve("dir2/test2.probitas.ts"), "");

  const progressEvents: DiscoverProgress[] = [];

  const files = await discoverScenarioFiles(
    [sbox.resolve("dir1"), sbox.resolve("dir2")],
    {
      onProgress: (progress) => {
        progressEvents.push({ ...progress });
      },
    },
  );

  // Progress is reported at start of each directory scan
  assertEquals(progressEvents.length >= 2, true);
  // Both files should be discovered
  assertEquals(files.length, 2);
});

Deno.test("discover discoverScenarioFiles calls onProgress callback for files", async () => {
  await using sbox = await sandbox();

  const file1 = sbox.resolve("test1.probitas.ts");
  const file2 = sbox.resolve("test2.probitas.ts");
  await Deno.writeTextFile(file1, "");
  await Deno.writeTextFile(file2, "");

  const progressEvents: DiscoverProgress[] = [];

  await discoverScenarioFiles([file1, file2], {
    onProgress: (progress) => {
      progressEvents.push({ ...progress });
    },
  });

  assertEquals(progressEvents.length, 2);
  assertEquals(progressEvents[0].currentPath, file1);
  assertEquals(progressEvents[0].filesFound, 1);
  assertEquals(progressEvents[1].currentPath, file2);
  assertEquals(progressEvents[1].filesFound, 2);
});
