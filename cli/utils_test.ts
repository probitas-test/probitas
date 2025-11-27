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
import {
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
});
