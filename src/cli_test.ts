/**
 * Tests for main entry point
 *
 * Focuses on command dispatching and global flags.
 * Individual command behavior is tested in their own test files.
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { main } from "./cli.ts";

describe("main", () => {
  describe("help and version", () => {
    it("shows help with no arguments", async () => {
      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await main([]);

      assertEquals(exitCode, 0);
      assertEquals(output.join("\n").includes("Usage:"), true);
    });

    it("shows version with -V flag", async () => {
      const output: string[] = [];
      using _logStub = stub(console, "log", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await main(["-V"]);

      assertEquals(exitCode, 0);
      assertEquals(output.join("\n").length > 0, true);
    });
  });

  describe("command dispatch", () => {
    it("returns error for unknown command", async () => {
      const output: string[] = [];
      using _errorStub = stub(console, "error", (...args: unknown[]) => {
        output.push(args.join(" "));
      });

      const exitCode = await main(["unknown"]);

      assertEquals(exitCode, 2);
    });
  });
});
