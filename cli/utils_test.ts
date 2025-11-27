/**
 * Tests for utility functions
 *
 * @module
 */

import {
  assertEquals,
  assertInstanceOf,
  assertStringIncludes,
  assertThrows,
} from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import type { ScenarioDefinition } from "../src/runner/types.ts";
import {
  applySelectors,
  getVersion,
  parseMaxConcurrency,
  parseMaxFailures,
  readAsset,
  readTemplate,
  resolveReporter,
} from "./utils.ts";
import {
  DotReporter,
  JSONReporter,
  ListReporter,
  TAPReporter,
} from "../src/reporter/mod.ts";

describe("utils", () => {
  describe("resolveReporter", () => {
    const reporters = [
      { name: "list", class: ListReporter },
      { name: "dot", class: DotReporter },
      { name: "json", class: JSONReporter },
      { name: "tap", class: TAPReporter },
    ];

    for (const { name, class: ReporterClass } of reporters) {
      it(`resolves '${name}' to ${ReporterClass.name}`, () => {
        const reporter = resolveReporter(name);
        assertInstanceOf(reporter, ReporterClass);
      });
    }

    it("returns ListReporter as default", () => {
      assertEquals(resolveReporter(undefined) instanceof ListReporter, true);
      assertEquals(resolveReporter("") instanceof ListReporter, true);
    });

    it("throws error for unknown reporter name", () => {
      assertThrows(
        () => resolveReporter("unknown"),
        Error,
        "Unknown reporter: unknown",
      );
    });
  });

  const parseMaxTestCases = [
    {
      name: "parseMaxConcurrency",
      fn: parseMaxConcurrency,
      errorPrefix: "max-concurrency",
      validStringInput: "4",
      validStringOutput: 4,
      validNumericInput: 8,
      largeInput: "1000",
      largeOutput: 1000,
    },
    {
      name: "parseMaxFailures",
      fn: parseMaxFailures,
      errorPrefix: "max-failures",
      validStringInput: "5",
      validStringOutput: 5,
      validNumericInput: 3,
      largeInput: "500",
      largeOutput: 500,
    },
  ];

  for (const testCase of parseMaxTestCases) {
    describe(testCase.name, () => {
      it("parses string number", () => {
        const result = testCase.fn(testCase.validStringInput);
        assertEquals(result, testCase.validStringOutput);
      });

      it("parses numeric value", () => {
        const result = testCase.fn(testCase.validNumericInput);
        assertEquals(result, testCase.validNumericInput);
      });

      it("returns undefined when undefined is passed", () => {
        const result = testCase.fn(undefined);
        assertEquals(result, undefined);
      });

      it("throws error for invalid number string", () => {
        assertThrows(
          () => testCase.fn("abc"),
          Error,
          `${testCase.errorPrefix} must be a positive integer`,
        );
      });
    });
  }

  describe("readTemplate", () => {
    it("reads template files", async () => {
      const config = await readTemplate("probitas.config.ts");
      assertStringIncludes(config, "ProbitasConfig");

      const denoJson = await readTemplate("deno.jsonc");
      assertStringIncludes(denoJson, "imports");

      const example = await readTemplate("example.scenario.ts");
      assertStringIncludes(example, "Example Scenario");
    });
  });

  describe("readAsset", () => {
    it("reads asset files", async () => {
      const usage = await readAsset("usage.txt");
      assertStringIncludes(usage, "Probitas");

      const usageRun = await readAsset("usage-run.txt");
      assertStringIncludes(usageRun, "probitas run");
    });
  });

  describe("getVersion", () => {
    it("reads version from deno.jsonc", () => {
      const version = getVersion();
      assertEquals(typeof version, "string");
      // Should be a version or "unknown"
    });
  });

  // Test helper to create scenario
  const createScenario = (
    name: string,
    tags: string[] = [],
  ): ScenarioDefinition => ({
    name,
    options: {
      tags,
      skip: null,
      setup: null,
      teardown: null,
      stepOptions: {
        timeout: 5000,
        retry: { maxAttempts: 1, backoff: "linear" },
      },
    },
    steps: [],
  });

  describe("applySelectors", () => {
    const scenarios = [
      createScenario("Login Test", ["api", "auth"]),
      createScenario("Logout Test", ["api"]),
      createScenario("User API Test", ["api", "user"]),
      createScenario("Smoke Test", ["smoke"]),
    ];

    it("applies single tag selector (OR)", () => {
      const result = applySelectors(scenarios, ["tag:smoke"], []);
      assertEquals(result.length, 1);
      assertEquals(result[0].name, "Smoke Test");
    });

    it("applies multiple tag selectors (OR)", () => {
      const result = applySelectors(scenarios, ["tag:auth", "tag:smoke"], []);
      assertEquals(result.length, 2);
      assertEquals(result.map((s) => s.name).sort(), [
        "Login Test",
        "Smoke Test",
      ]);
    });

    it("applies combined selectors (AND within selector)", () => {
      const result = applySelectors(scenarios, ["tag:api,tag:auth"], []);
      assertEquals(result.length, 1);
      assertEquals(result[0].name, "Login Test");
    });

    it("applies name selector", () => {
      const result = applySelectors(scenarios, ["User"], []);
      assertEquals(result.length, 1);
      assertEquals(result[0].name, "User API Test");
    });

    it("applies exclude selector", () => {
      const result = applySelectors(scenarios, ["tag:api"], ["tag:auth"]);
      assertEquals(result.length, 2);
      assertEquals(result.map((s) => s.name).sort(), [
        "Logout Test",
        "User API Test",
      ]);
    });

    it("applies both select and exclude", () => {
      const result = applySelectors(scenarios, ["tag:api"], ["Logout"]);
      assertEquals(result.length, 2);
      assertEquals(result.map((s) => s.name).sort(), [
        "Login Test",
        "User API Test",
      ]);
    });

    it("returns all scenarios when no selectors", () => {
      const result = applySelectors(scenarios, [], []);
      assertEquals(result.length, 4);
    });

    it("applies exclude only", () => {
      const result = applySelectors(scenarios, [], ["tag:smoke"]);
      assertEquals(result.length, 3);
    });
  });
});
