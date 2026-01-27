/**
 * Tests for state persistence module
 *
 * @requires --allow-read Permission to read state files
 * @requires --allow-write Permission to write state files
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { sandbox } from "@lambdalisue/sandbox";
import { join } from "@std/path";
import type { RunResult, ScenarioResult } from "@probitas/runner";
import type { ScenarioMetadata } from "@probitas/core";
import {
  getStateDir,
  type LastRunState,
  loadLastRunState,
  saveLastRunState,
} from "./state.ts";

/**
 * Helper to create ScenarioMetadata for tests
 */
function createMetadata(
  name: string,
  options?: {
    tags?: string[];
    origin?: { path: string };
  },
): ScenarioMetadata {
  return {
    name,
    tags: options?.tags ?? [],
    steps: [],
    origin: options?.origin,
  };
}

/**
 * Helper to create a passed ScenarioResult
 */
function createPassedScenario(
  name: string,
  options?: {
    tags?: string[];
    origin?: { path: string };
    duration?: number;
  },
): ScenarioResult {
  return {
    status: "passed",
    metadata: createMetadata(name, options),
    steps: [],
    duration: options?.duration ?? 100,
  };
}

/**
 * Helper to create a failed ScenarioResult
 */
function createFailedScenario(
  name: string,
  error: unknown,
  options?: {
    tags?: string[];
    origin?: { path: string };
    duration?: number;
  },
): ScenarioResult {
  return {
    status: "failed",
    metadata: createMetadata(name, options),
    steps: [],
    duration: options?.duration ?? 100,
    error,
  };
}

describe("state persistence", () => {
  describe("getStateDir", () => {
    it("creates .probitas directory if it doesn't exist", async () => {
      await using sbox = await sandbox();

      const stateDir = await getStateDir(sbox.path);

      assertEquals(stateDir, join(sbox.path, ".probitas"));
      const stat = await Deno.stat(stateDir);
      assertEquals(stat.isDirectory, true);
    });

    it("returns existing .probitas directory", async () => {
      await using sbox = await sandbox();
      await Deno.mkdir(join(sbox.path, ".probitas"));

      const stateDir = await getStateDir(sbox.path);

      assertEquals(stateDir, join(sbox.path, ".probitas"));
    });
  });

  describe("saveLastRunState", () => {
    it("saves failed scenarios to last-run.json", async () => {
      await using sbox = await sandbox();

      const result: RunResult = {
        total: 3,
        passed: 1,
        failed: 2,
        skipped: 0,
        duration: 1000,
        scenarios: [
          createPassedScenario("Passing Test", {
            origin: { path: join(sbox.path, "tests/pass.probitas.ts") },
          }),
          createFailedScenario("Failing Test 1", new Error("Test failed"), {
            tags: ["api"],
            origin: { path: join(sbox.path, "tests/fail1.probitas.ts") },
            duration: 200,
          }),
          createFailedScenario("Failing Test 2", "String error", {
            origin: { path: join(sbox.path, "tests/fail2.probitas.ts") },
            duration: 300,
          }),
        ],
      };

      await saveLastRunState(sbox.path, result);

      const statePath = join(sbox.path, ".probitas", "last-run.json");
      const content = await Deno.readTextFile(statePath);
      const state = JSON.parse(content) as LastRunState;

      assertEquals(state.version, 1);
      assertExists(state.timestamp);
      assertEquals(state.failed.length, 2);
      assertEquals(state.failed[0].name, "Failing Test 1");
      assertEquals(state.failed[0].file, "tests/fail1.probitas.ts");
      assertEquals(state.failed[0].error, "Test failed");
      assertEquals(state.failed[1].name, "Failing Test 2");
      assertEquals(state.failed[1].file, "tests/fail2.probitas.ts");
      assertEquals(state.failed[1].error, "String error");
    });

    it("saves empty failed array when all tests pass", async () => {
      await using sbox = await sandbox();

      const result: RunResult = {
        total: 1,
        passed: 1,
        failed: 0,
        skipped: 0,
        duration: 100,
        scenarios: [
          createPassedScenario("Passing Test", {
            origin: { path: join(sbox.path, "tests/pass.probitas.ts") },
          }),
        ],
      };

      await saveLastRunState(sbox.path, result);

      const state = await loadLastRunState(sbox.path);
      assertExists(state);
      assertEquals(state.failed.length, 0);
    });

    it("handles scenarios without origin path", async () => {
      await using sbox = await sandbox();

      const result: RunResult = {
        total: 1,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 100,
        scenarios: [
          createFailedScenario("No Origin", new Error("Failed")),
        ],
      };

      await saveLastRunState(sbox.path, result);

      const state = await loadLastRunState(sbox.path);
      assertExists(state);
      assertEquals(state.failed[0].file, "unknown");
    });
  });

  describe("loadLastRunState", () => {
    it("returns undefined when no state file exists", async () => {
      await using sbox = await sandbox();

      const state = await loadLastRunState(sbox.path);

      assertEquals(state, undefined);
    });

    it("loads valid state from disk", async () => {
      await using sbox = await sandbox();
      await Deno.mkdir(join(sbox.path, ".probitas"));

      const savedState: LastRunState = {
        version: 1,
        timestamp: "2024-01-15T10:30:00.000Z",
        failed: [
          { name: "Test 1", file: "tests/test1.probitas.ts" },
          {
            name: "Test 2",
            file: "tests/test2.probitas.ts",
            error: "Some error",
          },
        ],
      };
      await Deno.writeTextFile(
        join(sbox.path, ".probitas", "last-run.json"),
        JSON.stringify(savedState),
      );

      const state = await loadLastRunState(sbox.path);

      assertExists(state);
      assertEquals(state.version, 1);
      assertEquals(state.timestamp, "2024-01-15T10:30:00.000Z");
      assertEquals(state.failed.length, 2);
      assertEquals(state.failed[0].name, "Test 1");
      assertEquals(state.failed[1].error, "Some error");
    });

    it("returns undefined for invalid version", async () => {
      await using sbox = await sandbox();
      await Deno.mkdir(join(sbox.path, ".probitas"));

      const invalidState = {
        version: 999,
        timestamp: "2024-01-15T10:30:00.000Z",
        failed: [],
      };
      await Deno.writeTextFile(
        join(sbox.path, ".probitas", "last-run.json"),
        JSON.stringify(invalidState),
      );

      const state = await loadLastRunState(sbox.path);

      assertEquals(state, undefined);
    });

    it("returns undefined for malformed JSON", async () => {
      await using sbox = await sandbox();
      await Deno.mkdir(join(sbox.path, ".probitas"));

      await Deno.writeTextFile(
        join(sbox.path, ".probitas", "last-run.json"),
        "{ invalid json",
      );

      const state = await loadLastRunState(sbox.path);

      assertEquals(state, undefined);
    });

    it("returns undefined for missing required fields", async () => {
      await using sbox = await sandbox();
      await Deno.mkdir(join(sbox.path, ".probitas"));

      const invalidState = {
        version: 1,
        // missing timestamp and failed
      };
      await Deno.writeTextFile(
        join(sbox.path, ".probitas", "last-run.json"),
        JSON.stringify(invalidState),
      );

      const state = await loadLastRunState(sbox.path);

      assertEquals(state, undefined);
    });
  });

  describe("round-trip", () => {
    it("saves and loads state correctly", async () => {
      await using sbox = await sandbox();

      const result: RunResult = {
        total: 2,
        passed: 1,
        failed: 1,
        skipped: 0,
        duration: 500,
        scenarios: [
          createPassedScenario("Pass", { duration: 100 }),
          createFailedScenario("Fail", new Error("Expected failure"), {
            tags: ["integration"],
            origin: { path: join(sbox.path, "e2e/fail.probitas.ts") },
            duration: 400,
          }),
        ],
      };

      await saveLastRunState(sbox.path, result);
      const loaded = await loadLastRunState(sbox.path);

      assertExists(loaded);
      assertEquals(loaded.version, 1);
      assertEquals(loaded.failed.length, 1);
      assertEquals(loaded.failed[0].name, "Fail");
      assertEquals(loaded.failed[0].file, "e2e/fail.probitas.ts");
      assertEquals(loaded.failed[0].error, "Expected failure");
    });
  });
});
