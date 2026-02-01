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
  extractDenoOptions,
  getVersion,
  parsePositiveInteger,
  parseTimeout,
  readAsset,
  resolveReporter,
} from "./utils.ts";
import { ListReporter } from "./reporter/list_reporter.ts";
import { JSONReporter } from "./reporter/json_reporter.ts";

describe("utils", () => {
  describe("extractDenoOptions", () => {
    it("extracts --deno-* options with values", () => {
      const result = extractDenoOptions([
        "--deno-config=custom/deno.json",
        "--selector",
        "foo",
        "--deno-lock=custom/deno.lock",
      ]);
      assertEquals(result.denoArgs, [
        "--config=custom/deno.json",
        "--lock=custom/deno.lock",
      ]);
      assertEquals(result.remainingArgs, ["--selector", "foo"]);
    });

    it("extracts --deno-no-* boolean flags", () => {
      const result = extractDenoOptions([
        "--deno-no-prompt",
        "--deno-no-lock",
        "scenarios/",
      ]);
      assertEquals(result.denoArgs, ["--no-prompt", "--no-lock"]);
      assertEquals(result.remainingArgs, ["scenarios/"]);
    });

    it("extracts --deno-reload without value as boolean flag", () => {
      const result = extractDenoOptions([
        "--deno-reload",
        "scenarios/",
      ]);
      assertEquals(result.denoArgs, ["--reload"]);
      assertEquals(result.remainingArgs, ["scenarios/"]);
    });

    it("extracts --deno-reload with value", () => {
      const result = extractDenoOptions([
        "--deno-reload=jsr:@std/http",
        "scenarios/",
      ]);
      assertEquals(result.denoArgs, ["--reload=jsr:@std/http"]);
      assertEquals(result.remainingArgs, ["scenarios/"]);
    });

    it("extracts --deno-check without value as boolean flag", () => {
      const result = extractDenoOptions([
        "--deno-check",
        "scenarios/",
      ]);
      assertEquals(result.denoArgs, ["--check"]);
      assertEquals(result.remainingArgs, ["scenarios/"]);
    });

    it("extracts --deno-check with value", () => {
      const result = extractDenoOptions([
        "--deno-check=all",
        "scenarios/",
      ]);
      assertEquals(result.denoArgs, ["--check=all"]);
      assertEquals(result.remainingArgs, ["scenarios/"]);
    });

    it("extracts any --deno-* option without value as boolean flag", () => {
      const result = extractDenoOptions([
        "--deno-config",
        "--deno-lock",
        "scenarios/",
      ]);
      assertEquals(result.denoArgs, ["--config", "--lock"]);
      assertEquals(result.remainingArgs, ["scenarios/"]);
    });

    it("returns empty arrays when no deno options", () => {
      const result = extractDenoOptions(["--selector", "foo"]);
      assertEquals(result.denoArgs, []);
      assertEquals(result.remainingArgs, ["--selector", "foo"]);
    });
  });

  describe("resolveReporter", () => {
    const reporters = [
      { name: "list", class: ListReporter },
      { name: "json", class: JSONReporter },
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

  describe("parsePositiveInteger", () => {
    it("parses string number", () => {
      const result = parsePositiveInteger("10", "test");
      assertEquals(result, 10);
    });

    it("parses numeric value", () => {
      const result = parsePositiveInteger(5, "test");
      assertEquals(result, 5);
    });

    it("returns undefined when undefined is passed", () => {
      const result = parsePositiveInteger(undefined, "test");
      assertEquals(result, undefined);
    });

    it("throws error for invalid number string", () => {
      assertThrows(
        () => parsePositiveInteger("abc", "test"),
        Error,
        "test must be a positive integer",
      );
    });

    it("throws error for decimal number", () => {
      assertThrows(
        () => parsePositiveInteger("1.5", "test"),
        Error,
        "test must be a positive integer",
      );
    });

    it("throws error for zero", () => {
      assertThrows(
        () => parsePositiveInteger("0", "test"),
        Error,
        "test must be a positive integer",
      );
    });

    it("throws error for negative number", () => {
      assertThrows(
        () => parsePositiveInteger("-1", "test"),
        Error,
        "test must be a positive integer",
      );
    });
  });

  describe("parseTimeout", () => {
    it("parses seconds format", () => {
      assertEquals(parseTimeout("30s"), 30);
      assertEquals(parseTimeout("1s"), 1);
      assertEquals(parseTimeout("120s"), 120);
    });

    it("parses minutes format", () => {
      assertEquals(parseTimeout("10m"), 600);
      assertEquals(parseTimeout("1m"), 60);
      assertEquals(parseTimeout("2.5m"), 150);
    });

    it("parses hours format", () => {
      assertEquals(parseTimeout("1h"), 3600);
      assertEquals(parseTimeout("2h"), 7200);
      assertEquals(parseTimeout("0.5h"), 1800);
    });

    it("parses string numbers without unit as seconds", () => {
      assertEquals(parseTimeout("30"), 30);
      assertEquals(parseTimeout("120"), 120);
    });

    it("handles decimal values", () => {
      assertEquals(parseTimeout("1.5s"), 1.5);
      assertEquals(parseTimeout("2.5m"), 150);
    });

    it("is case insensitive", () => {
      assertEquals(parseTimeout("30S"), 30);
      assertEquals(parseTimeout("10M"), 600);
      assertEquals(parseTimeout("1H"), 3600);
    });

    it("returns undefined for zero timeout (no timeout)", () => {
      assertEquals(parseTimeout("0"), undefined);
      assertEquals(parseTimeout("0s"), undefined);
      assertEquals(parseTimeout("0m"), undefined);
      assertEquals(parseTimeout("0h"), undefined);
    });

    it("throws error for invalid format", () => {
      assertThrows(
        () => parseTimeout("abc"),
        Error,
        'Invalid timeout format: "abc"',
      );
    });

    it("throws error for invalid unit", () => {
      assertThrows(
        () => parseTimeout("30x"),
        Error,
        "Invalid timeout format",
      );
    });

    it("throws error for negative timeout", () => {
      assertThrows(
        () => parseTimeout("-10s"),
        Error,
        "Invalid timeout format",
      );
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
    it("returns version string or undefined", async () => {
      const version = await getVersion();
      // Should be a version string or undefined
      if (version !== undefined) {
        assertEquals(typeof version, "string");
      }
    });
  });
});
