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
    it("loads scenarios from glob pattern", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("test.scenario.ts");
      const content = outdent`
        export default {
          name: "Test Scenario",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: [{ name: "step", fn: () => {}, options: {} }],
          location: { file: "${scenarioPath}" }
        };
      `;
      await Deno.writeTextFile(scenarioPath, content);

      const scenarios = await loadScenarios(sbox.path, {
        includes: ["**/*.scenario.ts"],
      });

      assertEquals(scenarios.length, 1);
      assertEquals(scenarios[0].name, "Test Scenario");
    });

    it("applies exclude patterns", async () => {
      await using sbox = await sandbox();

      const scenario1 = sbox.resolve("scenario1.scenario.ts");
      const scenario2 = sbox.resolve("skip_scenario2.scenario.ts");

      const content = (name: string, path: string) =>
        outdent`
        export default {
          name: "${name}",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: [],
          location: { file: "${path}" }
        };
      `;

      await Deno.writeTextFile(scenario1, content("Scenario 1", scenario1));
      await Deno.writeTextFile(
        scenario2,
        content("Skip Scenario 2", scenario2),
      );

      const scenarios = await loadScenarios(sbox.path, {
        includes: ["**/*.scenario.ts"],
        excludes: ["**/skip_*"],
      });

      assertEquals(scenarios.length, 1);
      assertEquals(scenarios[0].name, "Scenario 1");
    });

    it("loads single ScenarioDefinition as default export", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("single.scenario.ts");
      const content = outdent`
        export default {
          name: "Single Scenario",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: [{ name: "step", fn: () => {}, options: {} }],
          location: { file: "${scenarioPath}" }
        };
      `;
      await Deno.writeTextFile(scenarioPath, content);

      const scenarios = await loadScenarios(sbox.path);

      assertEquals(scenarios.length, 1);
      assertEquals(scenarios[0].name, "Single Scenario");
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
          await loadScenarios(sbox.path);
        },
        Error,
        "Failed to load scenario from",
      );
    });
  });
});
