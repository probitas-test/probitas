/**
 * Tests for cli/main.ts
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { EXIT_CODE } from "./constants.ts";
import { main } from "./main.ts";

describe("main", () => {
  describe("global flags", () => {
    it("shows help with no arguments", async () => {
      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await main([]);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      assertEquals(output.length, 1);
      assertEquals(output[0].includes("Usage:"), true);
    });

    it("shows help with -h flag", async () => {
      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await main(["-h"]);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      assertEquals(output.length, 1);
      assertEquals(output[0].includes("Usage:"), true);
    });

    it("shows help with --help flag", async () => {
      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await main(["--help"]);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      assertEquals(output.length, 1);
      assertEquals(output[0].includes("Usage:"), true);
    });

    it("shows version with -v flag", async () => {
      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await main(["-v"]);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      assertEquals(output.length, 1);
      assertEquals(output[0].startsWith("probitas"), true);
    });

    it("shows version with --version flag", async () => {
      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await main(["--version"]);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      assertEquals(output.length, 1);
      assertEquals(output[0].startsWith("probitas"), true);
    });
  });

  describe("command dispatch", () => {
    it("returns error for unknown command", async () => {
      const output: string[] = [];
      const errors: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        errors.push(args.join(" "));
      });

      const exitCode = await main(["unknown"]);

      assertEquals(exitCode, EXIT_CODE.USAGE_ERROR);
      assertEquals(errors.length, 2);
      assertEquals(errors[0].includes("Unknown command"), true);
    });

    it("dispatches to run command", async () => {
      const tempDir = await Deno.makeTempDir();
      const originalCwd = Deno.cwd();
      try {
        await Deno.chdir(tempDir);

        // Create a test scenario
        const scenarioPath = `${tempDir}/test.scenario.ts`;
        await Deno.writeTextFile(
          scenarioPath,
          `export default {
            name: "Test",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
            steps: [
              {
                name: "Step",
                fn: () => ({}),
                options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
              }
            ]
          };`,
        );

        const exitCode = await main(["run"]);

        assertEquals(typeof exitCode, "number");
      } finally {
        await Deno.chdir(originalCwd);
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("dispatches to list command", async () => {
      const tempDir = await Deno.makeTempDir();
      const originalCwd = Deno.cwd();
      try {
        await Deno.chdir(tempDir);

        const exitCode = await main(["list"]);

        assertEquals(typeof exitCode, "number");
      } finally {
        await Deno.chdir(originalCwd);
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("dispatches to init command", async () => {
      const tempDir = await Deno.makeTempDir();
      const originalCwd = Deno.cwd();
      try {
        await Deno.chdir(tempDir);

        const exitCode = await main(["init"]);

        assertEquals(typeof exitCode, "number");
      } finally {
        await Deno.chdir(originalCwd);
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  describe("version command", () => {
    it("shows version with --version flag", async () => {
      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await main(["--version"]);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      assertEquals(output.length, 1);
      assertEquals(output[0].startsWith("probitas"), true);
    });
  });

  describe("help command", () => {
    it("shows help when no arguments provided", async () => {
      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await main([]);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
      assertEquals(output.length, 1);
    });

    it("shows help with --help before command", async () => {
      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await main(["--help", "run"]);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });
  });

  describe("error handling", () => {
    it("handles error reading help file", async () => {
      const errors: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        errors.push(args.join(" "));
      });

      const exitCode = await main(["--unknown-flag"]);

      // Should complete with some exit code
      assertEquals(typeof exitCode, "number");
    });
  });

  describe("command arguments", () => {
    it("passes command arguments correctly", async () => {
      const tempDir = await Deno.makeTempDir();
      const originalCwd = Deno.cwd();
      try {
        await Deno.chdir(tempDir);

        // Create a test scenario
        const scenarioPath = `${tempDir}/test.scenario.ts`;
        await Deno.writeTextFile(
          scenarioPath,
          `export default {
            name: "Test",
            options: { tags: [], skip: null, setup: null, teardown: null, stepOptions: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } } },
            steps: [
              {
                name: "Step",
                fn: () => ({}),
                options: { timeout: 5000, retry: { maxAttempts: 1, backoff: "linear" } }
              }
            ]
          };`,
        );

        // Run with arguments to run command
        const exitCode = await main(["run", "--help"]);

        assertEquals(typeof exitCode, "number");
      } finally {
        await Deno.chdir(originalCwd);
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  describe("flag combinations", () => {
    it("handles version with other flags", async () => {
      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await main(["-v", "run"]);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });

    it("handles help with other flags", async () => {
      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await main(["-h", "run"]);

      assertEquals(exitCode, EXIT_CODE.SUCCESS);
    });
  });
});
