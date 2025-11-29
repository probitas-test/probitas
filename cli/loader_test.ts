/**
 * Tests for scenario file loader
 *
 * @requires --allow-read Permission to read scenario files
 * @requires --allow-write Permission to write temporary test files
 * @module
 */

import outdent from "@cspotcode/outdent";
import { assertEquals, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { sandbox } from "@lambdalisue/sandbox";
import { loadScenarios } from "./loader.ts";

describe("scenario loader", () => {
  describe("loadScenarios", () => {
    it("loads single scenario from file", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("test.scenario.ts");
      const content = outdent`
        export default {
          name: "Test Scenario",
          options: { tags: [], skip: null, stepOptions: {} },
          entries: [{ kind: "step", value: { name: "step", fn: () => {}, options: {} } }],
          location: { file: "${scenarioPath}" }
        };
      `;
      await Deno.writeTextFile(scenarioPath, content);

      const scenarios = await loadScenarios([scenarioPath]);

      assertEquals(scenarios.length, 1);
      assertEquals(scenarios[0].name, "Test Scenario");
    });

    it("loads multiple scenarios from array export", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("multi.scenario.ts");
      const content = outdent`
        export default [
          {
            name: "Scenario 1",
            options: { tags: [], skip: null, stepOptions: {} },
            entries: [],
            location: { file: "${scenarioPath}" }
          },
          {
            name: "Scenario 2",
            options: { tags: [], skip: null, stepOptions: {} },
            entries: [],
            location: { file: "${scenarioPath}" }
          }
        ];
      `;
      await Deno.writeTextFile(scenarioPath, content);

      const scenarios = await loadScenarios([scenarioPath]);

      assertEquals(scenarios.length, 2);
      assertEquals(scenarios[0].name, "Scenario 1");
      assertEquals(scenarios[1].name, "Scenario 2");
    });

    it("loads from multiple files", async () => {
      await using sbox = await sandbox();

      const file1 = sbox.resolve("test1.scenario.ts");
      const file2 = sbox.resolve("test2.scenario.ts");

      const content = (name: string, path: string) =>
        outdent`
        export default {
          name: "${name}",
          options: { tags: [], skip: null, stepOptions: {} },
          entries: [],
          location: { file: "${path}" }
        };
      `;

      await Deno.writeTextFile(file1, content("Scenario 1", file1));
      await Deno.writeTextFile(file2, content("Scenario 2", file2));

      const scenarios = await loadScenarios([file1, file2]);

      assertEquals(scenarios.length, 2);
      assertEquals(scenarios[0].name, "Scenario 1");
      assertEquals(scenarios[1].name, "Scenario 2");
    });

    it("returns empty array for empty file list", async () => {
      const scenarios = await loadScenarios([]);

      assertEquals(scenarios, []);
    });

    it("throws error for invalid syntax in scenario file", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("invalid.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        "export default { invalid: syntax here",
      );

      await assertRejects(
        async () => {
          await loadScenarios([scenarioPath]);
        },
        Error,
        "Failed to load scenario from",
      );
    });

    it("throws error for non-existent file", async () => {
      await assertRejects(
        async () => {
          await loadScenarios(["/nonexistent/file.ts"]);
        },
        Error,
        "Failed to load scenario from",
      );
    });
  });
});
