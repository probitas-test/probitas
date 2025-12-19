/**
 * Tests for scenario file loader
 *
 * @requires --allow-read Permission to read scenario files
 * @requires --allow-write Permission to write temporary test files
 * @module
 */

import outdent from "@cspotcode/outdent";
import { assertEquals } from "@std/assert";
import { sandbox } from "@lambdalisue/sandbox";
import { loadScenarios } from "./loader.ts";

Deno.test("loadScenarios loads single scenario from file", async () => {
  await using sbox = await sandbox();

  const scenarioPath = sbox.resolve("test.probitas.ts");
  const content = outdent`
    export default {
      name: "Test Scenario",
      options: { tags: [], stepOptions: {} },
      entries: [{ kind: "step", value: { name: "step", fn: () => {}, options: {} } }],
      source: { file: "${scenarioPath}" }
    };
  `;
  await Deno.writeTextFile(scenarioPath, content);

  const scenarios = await loadScenarios([scenarioPath]);

  assertEquals(scenarios.length, 1);
  assertEquals(scenarios[0].name, "Test Scenario");
});

Deno.test("loadScenarios loads multiple scenarios from array export", async () => {
  await using sbox = await sandbox();

  const scenarioPath = sbox.resolve("multi.probitas.ts");
  const content = outdent`
    export default [
      {
        name: "Scenario 1",
        options: { tags: [], stepOptions: {} },
        entries: [],
        source: { file: "${scenarioPath}" }
      },
      {
        name: "Scenario 2",
        options: { tags: [], stepOptions: {} },
        entries: [],
        source: { file: "${scenarioPath}" }
      }
    ];
  `;
  await Deno.writeTextFile(scenarioPath, content);

  const scenarios = await loadScenarios([scenarioPath]);

  assertEquals(scenarios.length, 2);
  assertEquals(scenarios[0].name, "Scenario 1");
  assertEquals(scenarios[1].name, "Scenario 2");
});

Deno.test("loadScenarios loads from multiple files", async () => {
  await using sbox = await sandbox();

  const file1 = sbox.resolve("test1.probitas.ts");
  const file2 = sbox.resolve("test2.probitas.ts");

  const content = (name: string, path: string) =>
    outdent`
    export default {
      name: "${name}",
      options: { tags: [], stepOptions: {} },
      entries: [],
      source: { file: "${path}" }
    };
  `;

  await Deno.writeTextFile(file1, content("Scenario 1", file1));
  await Deno.writeTextFile(file2, content("Scenario 2", file2));

  const scenarios = await loadScenarios([file1, file2]);

  assertEquals(scenarios.length, 2);
  assertEquals(scenarios[0].name, "Scenario 1");
  assertEquals(scenarios[1].name, "Scenario 2");
});

Deno.test("loadScenarios returns empty array for empty file list", async () => {
  const scenarios = await loadScenarios([]);

  assertEquals(scenarios, []);
});

Deno.test("loadScenarios calls onImportError for invalid syntax in scenario file", async () => {
  await using sbox = await sandbox();

  const scenarioPath = sbox.resolve("invalid.probitas.ts");
  await Deno.writeTextFile(
    scenarioPath,
    "export default { invalid: syntax here",
  );

  const errors: { file: string | URL; err: unknown }[] = [];
  const scenarios = await loadScenarios([scenarioPath], {
    onImportError: (file, err) => {
      errors.push({ file, err });
    },
  });

  assertEquals(scenarios, []);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].file, scenarioPath);
});

Deno.test("loadScenarios calls onImportError for non-existent file", async () => {
  const errors: { file: string | URL; err: unknown }[] = [];
  const scenarios = await loadScenarios(["/nonexistent/file.ts"], {
    onImportError: (file, err) => {
      errors.push({ file, err });
    },
  });

  assertEquals(scenarios, []);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].file, "/nonexistent/file.ts");
});

Deno.test("loadScenarios silently ignores errors when onImportError is not provided", async () => {
  const scenarios = await loadScenarios(["/nonexistent/file.ts"]);
  assertEquals(scenarios, []);
});
