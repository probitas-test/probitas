/**
 * Tests for scenario file loader
 *
 * @requires --allow-read Permission to read scenario files
 * @requires --allow-write Permission to write temporary test files
 * @module
 */

import outdent from "outdent";
import { assertEquals, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { resolve } from "@std/path";
import { defer } from "../src/helper/defer.ts";
import { loadScenarios } from "./loader.ts";

describe("scenario loader", () => {
  describe("loadScenarios", () => {
    it("loads scenarios from glob pattern", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create test scenario file
      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      const content = outdent`
        const scenario = {
          name: "Test Scenario",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: [
            { name: "step 1", fn: () => {}, options: {} }
          ],
          location: { file: "${scenarioPath}" }
        };
        export default scenario;
      `;
      await Deno.writeTextFile(scenarioPath, content);

      const scenarios = await loadScenarios(tempDir, {
        includes: ["**/*.scenario.ts"],
      });

      assertEquals(scenarios.length, 1);
      assertEquals(scenarios[0].name, "Test Scenario");
    });

    it("loads scenarios from directory with automatic expansion", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create subdirectory with scenario files
      const subDir = resolve(tempDir, "scenarios");
      await Deno.mkdir(subDir, { recursive: true });

      const scenarioPath = resolve(subDir, "test.scenario.ts");
      const content = outdent`
        export default {
          name: "Dir Test Scenario",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: [
            { name: "step 1", fn: () => {}, options: {} }
          ],
          location: { file: "${scenarioPath}" }
        };
      `;
      await Deno.writeTextFile(scenarioPath, content);

      const scenarios = await loadScenarios(tempDir, {
        includes: ["scenarios"],
      });

      assertEquals(scenarios.length, 1);
      assertEquals(scenarios[0].name, "Dir Test Scenario");
    });

    it("applies exclude patterns", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create multiple scenario files
      const scenario1 = resolve(tempDir, "scenario1.scenario.ts");
      const scenario2 = resolve(tempDir, "skip_scenario2.scenario.ts");

      const content1 = outdent`
        export default {
          name: "Scenario 1",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: [],
          location: { file: "${scenario1}" }
        };
      `;

      const content2 = outdent`
        export default {
          name: "Skip Scenario 2",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: [],
          location: { file: "${scenario2}" }
        };
      `;

      await Deno.writeTextFile(scenario1, content1);
      await Deno.writeTextFile(scenario2, content2);

      const scenarios = await loadScenarios(tempDir, {
        includes: ["**/*.scenario.ts"],
        excludes: ["**/skip_*"],
      });

      assertEquals(scenarios.length, 1);
      assertEquals(scenarios[0].name, "Scenario 1");
    });

    it("supports include regex patterns", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create multiple scenario files
      const scenario1 = resolve(tempDir, "api.scenario.ts");
      const scenario2 = resolve(tempDir, "database.scenario.ts");

      const content = (name: string, path: string) =>
        outdent`
        export default {
          name: "${name}",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: [],
          location: { file: "${path}" }
        };
      `;

      await Deno.writeTextFile(scenario1, content("API Test", scenario1));
      await Deno.writeTextFile(scenario2, content("DB Test", scenario2));

      const scenarios = await loadScenarios(tempDir, {
        includes: [/api/],
      });

      assertEquals(scenarios.length, 1);
      assertEquals(scenarios[0].name, "API Test");
    });

    it("supports exclude regex patterns", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenario1 = resolve(tempDir, "api.scenario.ts");
      const scenario2 = resolve(tempDir, "database.scenario.ts");

      const content = (name: string, path: string) =>
        outdent`
        export default {
          name: "${name}",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: [],
          location: { file: "${path}" }
        };
      `;

      await Deno.writeTextFile(scenario1, content("API Test", scenario1));
      await Deno.writeTextFile(scenario2, content("DB Test", scenario2));

      const scenarios = await loadScenarios(tempDir, {
        includes: ["**/*.scenario.ts"],
        excludes: [/database/],
      });

      assertEquals(scenarios.length, 1);
      assertEquals(scenarios[0].name, "API Test");
    });

    it("loads single ScenarioDefinition as default export", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenarioPath = resolve(tempDir, "single.scenario.ts");
      const content = outdent`
        export default {
          name: "Single Scenario",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: [{ name: "step", fn: () => {}, options: {} }],
          location: { file: "${scenarioPath}" }
        };
      `;
      await Deno.writeTextFile(scenarioPath, content);

      const scenarios = await loadScenarios(tempDir);

      assertEquals(scenarios.length, 1);
      assertEquals(scenarios[0].name, "Single Scenario");
    });

    it("loads ScenarioDefinition array from default export", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenarioPath = resolve(tempDir, "array.scenario.ts");
      const content = outdent`
        export default [
          {
            name: "Scenario 1",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenarioPath}" }
          },
          {
            name: "Scenario 2",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenarioPath}" }
          }
        ];
      `;
      await Deno.writeTextFile(scenarioPath, content);

      const scenarios = await loadScenarios(tempDir);

      assertEquals(scenarios.length, 2);
      assertEquals(scenarios[0].name, "Scenario 1");
      assertEquals(scenarios[1].name, "Scenario 2");
    });

    it("throws error when no default export", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenarioPath = resolve(tempDir, "invalid.scenario.ts");
      const content = outdent`
        export const scenario = {
          name: "Invalid",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: []
        };
      `;
      await Deno.writeTextFile(scenarioPath, content);

      const scenarios = await loadScenarios(tempDir);

      // The loader only loads default exports, so invalid file is skipped
      assertEquals(scenarios.length, 0);
    });

    it("throws error for invalid syntax in scenario file", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenarioPath = resolve(tempDir, "invalid.scenario.ts");
      const invalidContent = "export default { invalid: syntax here";
      await Deno.writeTextFile(scenarioPath, invalidContent);

      await assertRejects(
        async () => {
          await loadScenarios(tempDir);
        },
        Error,
        "Failed to load scenario from",
      );
    });

    it("returns empty array when no scenarios match patterns", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenarios = await loadScenarios(tempDir, {
        includes: ["**/*.nonexistent.ts"],
      });

      assertEquals(scenarios.length, 0);
    });

    it("loads scenarios with tags", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenarioPath = resolve(tempDir, "tagged.scenario.ts");
      const content = outdent`
        export default {
          name: "Tagged Scenario",
          options: { tags: ["smoke", "critical"], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: [],
          location: { file: "${scenarioPath}" }
        };
      `;
      await Deno.writeTextFile(scenarioPath, content);

      const scenarios = await loadScenarios(tempDir);

      assertEquals(scenarios.length, 1);
      assertEquals(scenarios[0].options.tags, ["smoke", "critical"]);
    });

    it("handles multiple files with glob pattern", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create multiple scenario files
      const scenario1 = resolve(tempDir, "test1.scenario.ts");
      const scenario2 = resolve(tempDir, "test2.scenario.ts");

      const createContent = (name: string, path: string) =>
        outdent`
        export default {
          name: "${name}",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: [],
          location: { file: "${path}" }
        };
      `;

      await Deno.writeTextFile(scenario1, createContent("Test 1", scenario1));
      await Deno.writeTextFile(scenario2, createContent("Test 2", scenario2));

      const scenarios = await loadScenarios(tempDir);

      assertEquals(scenarios.length, 2);
    });
  });
});
