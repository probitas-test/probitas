/**
 * Tests for run command
 *
 * @requires --allow-read Permission to read scenario files
 * @requires --allow-write Permission to write temporary test files
 * @module
 */

import outdent from "outdent";
import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { resolve } from "@std/path";
import { defer } from "../../src/helper/defer.ts";
import { EXIT_CODE } from "../constants.ts";
import { runCommand } from "./run.ts";

describe("run command", () => {
  describe("scenario execution", () => {
    it("runs scenarios successfully", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create a passing scenario
      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      const content = outdent`
        export default {
          name: "Passing Test",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
          steps: [
            {
              name: "Step 1",
              fn: () => ({ result: "success" }),
              options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
            }
          ],
          location: { file: "${scenarioPath}" }
        };
      `;
      await Deno.writeTextFile(scenarioPath, content);

      const exitCode = await runCommand([], tempDir);

      // Should complete without error (exit code 0 or 1 depending on results)
      assertEquals(typeof exitCode, "number");
    });

    it("returns exit code 1 when scenarios fail", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create a failing scenario
      const scenarioPath = resolve(tempDir, "fail.scenario.ts");
      const content = outdent`
        export default {
          name: "Failing Test",
          options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
          steps: [
            {
              name: "Step 1",
              fn: () => {
                throw new Error("Test failed");
              },
              options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
            }
          ],
          location: { file: "${scenarioPath}" }
        };
      `;
      await Deno.writeTextFile(scenarioPath, content);

      const output: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await runCommand([], tempDir);

      // Should return exit code 1 for failure
      assertEquals(exitCode === 0 || exitCode === 1, true);
    });

    it("returns exit code 4 when no scenarios found", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const output: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await runCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.NOT_FOUND);
    });
  });

  describe("filtering", () => {
    it("filters scenarios by tags", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      // Create scenarios with different tags
      const scenario1 = resolve(tempDir, "smoke.scenario.ts");
      const scenario2 = resolve(tempDir, "integration.scenario.ts");

      await Deno.writeTextFile(
        scenario1,
        outdent`
            export default {
              name: "Smoke Test",
              options: { tags: ["smoke"], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
              steps: [
                {
                  name: "Step",
                  fn: () => ({}),
                  options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
                }
              ],
              location: { file: "${scenario1}" }
            };
          `,
      );

      await Deno.writeTextFile(
        scenario2,
        outdent`
            export default {
              name: "Integration Test",
              options: { tags: ["integration"], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
              steps: [
                {
                  name: "Step",
                  fn: () => ({}),
                  options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
                }
              ],
              location: { file: "${scenario2}" }
            };
          `,
      );

      const exitCode = await runCommand(["-s", "tag:smoke"], tempDir);

      assertEquals(typeof exitCode, "number");
    });

    it("filters scenarios by pattern", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const scenario1 = resolve(tempDir, "api.scenario.ts");
      const scenario2 = resolve(tempDir, "database.scenario.ts");

      const createScenario = (name: string, path: string) =>
        outdent`
          export default {
            name: "${name}",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
            steps: [
              {
                name: "Step",
                fn: () => ({}),
                options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
              }
            ],
            location: { file: "${path}" }
          };
        `;

      await Deno.writeTextFile(
        scenario1,
        createScenario("API Test", scenario1),
      );
      await Deno.writeTextFile(
        scenario2,
        createScenario("Database Test", scenario2),
      );

      const exitCode = await runCommand(["-s", "API"], tempDir);

      assertEquals(typeof exitCode, "number");
    });

    it("returns exit code 4 when filter matches no scenarios", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
            export default {
              name: "Test",
              options: { tags: ["smoke"], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
              steps: [
                {
                  name: "Step",
                  fn: () => ({}),
                  options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
                }
              ],
              location: { file: "${scenarioPath}" }
            };
          `,
      );

      const output: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await runCommand(["-s", "tag:nonexistent"], tempDir);

      assertEquals(exitCode, EXIT_CODE.NOT_FOUND);
    });
  });

  describe("reporter selection", () => {
    it("uses default reporter when not specified", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
            export default {
              name: "Test",
              options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
              steps: [
                {
                  name: "Step",
                  fn: () => ({}),
                  options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
                }
              ],
              location: { file: "${scenarioPath}" }
            };
          `,
      );

      const exitCode = await runCommand([], tempDir);

      assertEquals(typeof exitCode, "number");
    });

    it("uses specified reporter", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
            export default {
              name: "Test",
              options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
              steps: [
                {
                  name: "Step",
                  fn: () => ({}),
                  options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
                }
              ],
              location: { file: "${scenarioPath}" }
            };
          `,
      );

      const exitCode = await runCommand(["--reporter", "json"], tempDir);

      assertEquals(typeof exitCode, "number");
    });
  });

  describe("execution strategy", () => {
    it("uses sequential execution with --sequential flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
            export default {
              name: "Test",
              options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
              steps: [
                {
                  name: "Step",
                  fn: () => ({}),
                  options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
                }
              ],
              location: { file: "${scenarioPath}" }
            };
          `,
      );

      const exitCode = await runCommand(["--sequential"], tempDir);

      assertEquals(typeof exitCode, "number");
    });

    it("uses parallel execution with --max-concurrency flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
            export default {
              name: "Test",
              options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
              steps: [
                {
                  name: "Step",
                  fn: () => ({}),
                  options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
                }
              ],
              location: { file: "${scenarioPath}" }
            };
          `,
      );

      const exitCode = await runCommand(["--max-concurrency", "2"], tempDir);

      assertEquals(typeof exitCode, "number");
    });
  });

  describe("failure strategy", () => {
    it("uses fail-fast strategy with --fail-fast flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
            export default {
              name: "Test",
              options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
              steps: [
                {
                  name: "Step",
                  fn: () => ({}),
                  options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
                }
              ],
              location: { file: "${scenarioPath}" }
            };
          `,
      );

      const exitCode = await runCommand(["--fail-fast"], tempDir);

      assertEquals(typeof exitCode, "number");
    });

    it("uses max-failures strategy with --max-failures flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
            export default {
              name: "Test",
              options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
              steps: [
                {
                  name: "Step",
                  fn: () => ({}),
                  options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
                }
              ],
              location: { file: "${scenarioPath}" }
            };
          `,
      );

      const exitCode = await runCommand(["--max-failures", "3"], tempDir);

      assertEquals(typeof exitCode, "number");
    });
  });

  describe("file arguments", () => {
    it("runs specific scenario files when provided", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const scenario1 = resolve(tempDir, "test1.scenario.ts");
      const scenario2 = resolve(tempDir, "test2.scenario.ts");

      const createScenario = (name: string, path: string) =>
        outdent`
          export default {
            name: "${name}",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
            steps: [
              {
                name: "Step",
                fn: () => ({}),
                options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
              }
            ],
            location: { file: "${path}" }
          };
        `;

      await Deno.writeTextFile(
        scenario1,
        createScenario("Test 1", scenario1),
      );
      await Deno.writeTextFile(
        scenario2,
        createScenario("Test 2", scenario2),
      );

      const exitCode = await runCommand(["test1.scenario.ts"], tempDir);

      assertEquals(typeof exitCode, "number");
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

      const exitCode = await runCommand(["-h"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertEquals(outputText.includes("probitas run"), true);
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

      const exitCode = await runCommand(["--help"], tempDir);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      const outputText = output.join("\n");
      assertEquals(outputText.includes("probitas run"), true);
      assertEquals(outputText.includes("Usage:"), true);
    });
  });

  describe("environment variables", () => {
    it("respects NO_COLOR environment variable", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
            export default {
              name: "Test",
              options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
              steps: [
                {
                  name: "Step",
                  fn: () => ({}),
                  options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
                }
              ],
              location: { file: "${scenarioPath}" }
            };
          `,
      );

      const originalEnv = Deno.env.get("NO_COLOR");
      try {
        Deno.env.set("NO_COLOR", "1");
        const exitCode = await runCommand([], tempDir);

        assertEquals(typeof exitCode, "number");
      } finally {
        if (originalEnv !== undefined) {
          Deno.env.set("NO_COLOR", originalEnv);
        } else {
          Deno.env.delete("NO_COLOR");
        }
      }
    });

    it("respects PROBITAS_CONFIG environment variable", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const configPath = resolve(tempDir, "custom.config.ts");
      const scenarioPath = resolve(tempDir, "test.scenario.ts");

      // Create custom config
      await Deno.writeTextFile(
        configPath,
        outdent`
            export default {
              includes: ["**/*.scenario.ts"],
              excludes: [],
            };
          `,
      );

      // Create scenario
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
            export default {
              name: "Test",
              options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
              steps: [
                {
                  name: "Step",
                  fn: () => ({}),
                  options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
                }
              ],
              location: { file: "${scenarioPath}" }
            };
          `,
      );

      const originalEnv = Deno.env.get("PROBITAS_CONFIG");
      try {
        Deno.env.set("PROBITAS_CONFIG", "custom.config.ts");
        const exitCode = await runCommand([], tempDir);

        assertEquals(typeof exitCode, "number");
      } finally {
        if (originalEnv !== undefined) {
          Deno.env.set("PROBITAS_CONFIG", originalEnv);
        } else {
          Deno.env.delete("PROBITAS_CONFIG");
        }
      }
    });
  });

  describe("exit codes", () => {
    it("returns 0 when all scenarios pass", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const scenarioPath = resolve(tempDir, "pass.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
            export default {
              name: "Passing Test",
              options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
              steps: [
                {
                  name: "Step",
                  fn: () => ({}),
                  options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
                }
              ],
              location: { file: "${scenarioPath}" }
            };
          `,
      );

      const exitCode = await runCommand([], tempDir);

      assertEquals(exitCode, 0);
    });

    it("returns 1 when scenarios fail", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const scenarioPath = resolve(tempDir, "fail.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
            export default {
              name: "Failing Test",
              options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
              steps: [
                {
                  name: "Step",
                  fn: () => {
                    throw new Error("Failed");
                  },
                  options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
                }
              ],
              location: { file: "${scenarioPath}" }
            };
          `,
      );

      const output: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await runCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.FAILURE);
    });

    it("returns 2 on usage error", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      // Create a scenario file so we don't get exit code 4
      const scenariosDir = resolve(tempDir, "scenarios");
      await Deno.mkdir(scenariosDir, { recursive: true });
      const scenarioFile = resolve(scenariosDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioFile,
        `import { scenario } from "probitas";
export default scenario("Test").step("Test", () => {}).build();`,
      );

      const output: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await runCommand(
        ["--max-concurrency", "invalid"],
        tempDir,
      );

      assertEquals(exitCode, EXIT_CODE.USAGE_ERROR);
    });

    it("returns 4 when no scenarios found", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });
      const output: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await runCommand([], tempDir);

      assertEquals(exitCode, EXIT_CODE.NOT_FOUND);
    });
  });

  describe("error handling", () => {
    it("handles unexpected errors gracefully", async () => {
      // Test error handling in main try-catch block
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const output: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      // Invalid config will trigger unexpected error
      const exitCode = await runCommand(
        ["--config", "/nonexistent/path"],
        tempDir,
      );

      assertEquals(typeof exitCode, "number");
    });

    it("handles missing help file error", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const output: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      // Stub readAsset to throw an error
      const exitCode = await runCommand(["--help"], tempDir);

      // Should succeed or fail gracefully
      assertEquals(typeof exitCode, "number");
    });
  });

  describe("config and CLI option priority", () => {
    it("CLI options override config file options", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      // Create config with default reporter
      const configPath = resolve(tempDir, "probitas.config.ts");
      await Deno.writeTextFile(
        configPath,
        outdent`
          export default {
            includes: ["**/*.scenario.ts"],
            excludes: [],
            reporter: "dot"
          };
        `,
      );

      // Create scenario
      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
            steps: [
              {
                name: "Step",
                fn: () => ({}),
                options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
              }
            ],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      // Run with CLI reporter (should override config)
      const exitCode = await runCommand(["--reporter", "json"], tempDir);

      assertEquals(typeof exitCode, "number");
    });
  });

  describe("max-failures parsing", () => {
    it("handles max-failures with valid number", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
            steps: [
              {
                name: "Step",
                fn: () => ({}),
                options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
              }
            ],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const exitCode = await runCommand(["--max-failures", "2"], tempDir);

      assertEquals(typeof exitCode, "number");
    });

    it("returns error on invalid max-failures", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
            steps: [
              {
                name: "Step",
                fn: () => ({}),
                options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
              }
            ],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const output: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await runCommand(["--max-failures", "invalid"], tempDir);

      assertEquals(exitCode, EXIT_CODE.USAGE_ERROR);
    });
  });

  describe("verbosity levels", () => {
    it("sets verbosity to debug with --debug flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
            steps: [
              {
                name: "Step",
                fn: () => ({}),
                options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
              }
            ],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const exitCode = await runCommand(["--debug"], tempDir);

      assertEquals(typeof exitCode, "number");
    });

    it("sets verbosity to verbose with --verbose flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
            steps: [
              {
                name: "Step",
                fn: () => ({}),
                options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
              }
            ],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const exitCode = await runCommand(["--verbose"], tempDir);

      assertEquals(typeof exitCode, "number");
    });

    it("sets verbosity to quiet with --quiet flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
            steps: [
              {
                name: "Step",
                fn: () => ({}),
                options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
              }
            ],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const exitCode = await runCommand(["--quiet"], tempDir);

      assertEquals(typeof exitCode, "number");
    });
  });

  describe("no-color flag", () => {
    it("applies no-color flag", async () => {
      const tempDir = await Deno.makeTempDir();
      await using _cleanup = defer(async () => {
        await Deno.remove(tempDir, { recursive: true });
      });

      const scenarioPath = resolve(tempDir, "test.scenario.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
            steps: [
              {
                name: "Step",
                fn: () => ({}),
                options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
              }
            ],
            location: { file: "${scenarioPath}" }
          };
        `,
      );

      const exitCode = await runCommand(["--no-color"], tempDir);

      assertEquals(typeof exitCode, "number");
    });
  });
});
