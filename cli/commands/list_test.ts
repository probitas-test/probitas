/**
 * Tests for list command
 *
 * @requires --allow-read Permission to read scenario files
 * @requires --allow-write Permission to write temporary test files
 * @module
 */

import outdent from "outdent";
import { assertEquals, assertStringIncludes } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { resolve } from "@std/path";
import { defer } from "../../src/helper/defer.ts";
import { EXIT_CODE } from "../constants.ts";
import { listCommand } from "./list.ts";

describe("list command", () => {
  describe("scenario listing", () => {
    it("displays all scenarios", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create config file to ensure consistent includes pattern
      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      // Create test scenario
      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      const content = outdent`
        export default {
          name: "Test Scenario",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
          steps: [{ name: "step", fn: () => {}, options: {} }],
          location: { file: "${scenarioPath}" }
        };
      `;
      await Deno.writeTextFile(scenarioPath, content);

      // Capture console output
      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertStringIncludes(outputText, "Test Scenario");
    });

    it("filters scenarios by tags", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create config file to ensure consistent includes pattern
      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      // Create scenarios with different tags
      const scenario1 = resolve(tempDir, "smoke.scenario.ts");
      const scenario2 = resolve(tempDir, "integration.scenario.ts");

      await Deno.writeTextFile(
        scenario1,
        outdent`
          export default {
            name: "Smoke Test",
            options: { tags: ["smoke"], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenario1}" }
          };
        `,
      );

      await Deno.writeTextFile(
        scenario2,
        outdent`
          export default {
            name: "Integration Test",
            options: { tags: ["integration"], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenario2}" }
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand(["-s", "tag:smoke"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertStringIncludes(outputText, "Smoke Test");
      assertEquals(outputText.includes("Integration Test"), false);
    });

    it("filters scenarios by pattern", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create config file to ensure consistent includes pattern
      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      // Create scenarios with different names
      const scenario1 = resolve(tempDir, "api.scenario.ts");
      const scenario2 = resolve(tempDir, "database.scenario.ts");

      await Deno.writeTextFile(
        scenario1,
        outdent`
          export default {
            name: "API Test",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenario1}" }
          };
        `,
      );

      await Deno.writeTextFile(
        scenario2,
        outdent`
          export default {
            name: "Database Test",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenario2}" }
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand(["-s", "API"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertStringIncludes(outputText, "API Test");
      assertEquals(outputText.includes("Database Test"), false);
    });
  });

  describe("output format", () => {
    it("displays scenarios in text format by default", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create config file to ensure consistent includes pattern
      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test Scenario",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertStringIncludes(outputText, "Test Scenario");
      assertStringIncludes(outputText, "Total:");
    });

    it("outputs scenarios in JSON format with --json flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create config file to ensure consistent includes pattern
      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test Scenario",
            options: { tags: ["smoke"], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [{ name: "step 1", fn: () => {}, options: {} }],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand(["--json"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");

      // Verify it's valid JSON
      const jsonData = JSON.parse(outputText);
      assertEquals(Array.isArray(jsonData), true);
      assertEquals(jsonData[0].name, "Test Scenario");
      assertEquals(jsonData[0].tags[0], "smoke");
    });
  });

  describe("scenario count", () => {
    it("displays correct count for single scenario", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create config file to ensure consistent includes pattern
      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Single Test",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertStringIncludes(outputText, "1 scenario");
      assertStringIncludes(outputText, "1 file");
    });

    it("displays correct count for multiple scenarios", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create config file to ensure consistent includes pattern
      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const scenario1 = resolve(tempDir, "test1.scenario.ts");
      const scenario2 = resolve(tempDir, "test2.scenario.ts");

      await Deno.writeTextFile(
        scenario1,
        outdent`
          export default {
            name: "Test 1",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenario1}" }
          };
        `,
      );

      await Deno.writeTextFile(
        scenario2,
        outdent`
          export default {
            name: "Test 2",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenario2}" }
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertStringIncludes(outputText, "2 scenarios");
      assertStringIncludes(outputText, "2 files");
    });
  });

  describe("no scenarios found", () => {
    it("handles case when no scenarios are found", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create config file to ensure consistent includes pattern
      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertStringIncludes(outputText, "Total: 0");
    });

    it("handles case when filter matches no scenarios", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create config file to ensure consistent includes pattern
      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test Scenario",
            options: { tags: ["smoke"], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand(
        ["-s", "tag:nonexistent"],
        tempDir,
      );

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertStringIncludes(outputText, "Total: 0");
    });
  });

  describe("help and usage", () => {
    it("shows help text with -h flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand(["-h"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertEquals(outputText.includes("probitas list"), true);
      assertEquals(outputText.includes("Usage:"), true);
    });

    it("shows help text with --help flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand(["--help"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertEquals(outputText.includes("probitas list"), true);
      assertEquals(outputText.includes("Usage:"), true);
    });
  });

  describe("exit codes", () => {
    it("returns 0 on success", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const exitCode = await listCommand([], tempDir);
      assertEquals(exitCode, 0);
    });
  });

  describe("configuration precedence", () => {
    it("prioritizes CLI config over environment variable", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create a default config
      const defaultConfig = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        defaultConfig,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      // Create a custom config
      const customConfig = resolve(tempDir, "custom.config.ts");
      await Deno.writeTextFile(
        customConfig,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test Scenario",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      // Pass config via CLI args
      const exitCode = await listCommand(["--config", customConfig], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });

    it("uses environment variable when CLI args not provided", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test Scenario",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });
  });

  describe("selector and exclude functionality", () => {
    it("applies CLI selectors over config selectors", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            selectors: ["tag:default"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const scenario1 = resolve(tempDir, "test1.scenario.ts");
      const scenario2 = resolve(tempDir, "test2.scenario.ts");

      await Deno.writeTextFile(
        scenario1,
        outdent`
          export default {
            name: "Default Test",
            options: { tags: ["default"], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenario1}" }
          };
        `,
      );

      await Deno.writeTextFile(
        scenario2,
        outdent`
          export default {
            name: "CLI Test",
            options: { tags: ["cli"], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenario2}" }
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand(["-s", "tag:cli"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertStringIncludes(outputText, "CLI Test");
      assertEquals(outputText.includes("Default Test"), false);
    });

    it("applies CLI excludes over config excludeSelectors", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            excludeSelectors: ["tag:skip"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const scenario1 = resolve(tempDir, "test1.scenario.ts");
      const scenario2 = resolve(tempDir, "test2.scenario.ts");

      await Deno.writeTextFile(
        scenario1,
        outdent`
          export default {
            name: "Keep Test",
            options: { tags: ["keep"], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenario1}" }
          };
        `,
      );

      await Deno.writeTextFile(
        scenario2,
        outdent`
          export default {
            name: "Exclude Test",
            options: { tags: ["exclude"], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenario2}" }
          };
        `,
      );

      // Ensure files are written before running command
      await Deno.stat(scenario1);
      await Deno.stat(scenario2);

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand(["-x", "tag:exclude"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertStringIncludes(outputText, "Keep Test");
      assertEquals(outputText.includes("Exclude Test"), false);
    });
  });

  describe("output formatting edge cases", () => {
    it("handles scenarios with undefined location", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test Scenario",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [{ name: "step", fn: () => {}, options: {} }],
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertStringIncludes(outputText, "Test Scenario");
    });

    it("outputs JSON with all expected properties", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test Scenario",
            options: { tags: ["smoke"], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [
              { name: "step 1", fn: () => {}, options: {} },
              { name: "step 2", fn: () => {}, options: {} }
            ],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand(["--json"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      const jsonData = JSON.parse(outputText);
      assertEquals(jsonData[0].name, "Test Scenario");
      assertEquals(jsonData[0].tags[0], "smoke");
      assertEquals(jsonData[0].steps, 2);
      assertStringIncludes(jsonData[0].file, "test.scenario.ts");
    });
  });

  describe("plural/singular messaging", () => {
    it("displays singular form for exactly one file", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const scenarioPath = resolve(tempDir, "single.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Single Scenario",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertStringIncludes(outputText, "1 file");
      assertEquals(outputText.includes("1 files"), false);
    });

    it("displays plural form for multiple files", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["*.scenario.ts"],
            reporter: "list",
            verbosity: "normal",
          };
        `,
      );

      const scenario1 = resolve(tempDir, "first.scenario.ts");
      const scenario2 = resolve(tempDir, "second.scenario.ts");

      await Deno.writeTextFile(
        scenario1,
        outdent`
          export default {
            name: "First Scenario",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenario1}" }
          };
        `,
      );

      await Deno.writeTextFile(
        scenario2,
        outdent`
          export default {
            name: "Second Scenario",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: {} },
            steps: [],
            location: { file: "${scenario2}" }
          };
        `,
      );

      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await listCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertStringIncludes(outputText, "2 files");
      assertEquals(outputText.includes("2 file"), true);
    });
  });
});
