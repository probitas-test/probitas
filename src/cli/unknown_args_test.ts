/**
 * Tests for unknown CLI arguments detection
 *
 * @module
 */

import { assertEquals, assertMatch } from "@std/assert";
import { parseArgs } from "@std/cli";
import {
  createUnknownArgHandler,
  extractKnownOptions,
  findSimilarOption,
  formatUnknownArgError,
  generateHint,
} from "./unknown_args.ts";

const baseOptions = {
  knownOptions: [
    "help",
    "verbose",
    "quiet",
    "debug",
    "selector",
    "config",
    "reload",
    "sequential",
    "fail-fast",
  ],
  commandName: "run",
};

Deno.test("createUnknownArgHandler", async (t) => {
  await t.step("detects unknown options", () => {
    const { handler, result } = createUnknownArgHandler(baseOptions);

    parseArgs(["--unknown", "--another-unknown"], {
      string: ["config"],
      boolean: ["help"],
      unknown: handler,
    });

    assertEquals(result.hasErrors, true);
    assertEquals(result.unknownArgs.length, 2);
    assertEquals(result.unknownArgs[0].key, "unknown");
    assertEquals(result.unknownArgs[1].key, "another-unknown");
  });

  await t.step("allows known options", () => {
    const { handler, result } = createUnknownArgHandler(baseOptions);

    parseArgs(["--help", "--config", "foo.json"], {
      string: ["config"],
      boolean: ["help"],
      unknown: handler,
    });

    assertEquals(result.hasErrors, false);
    assertEquals(result.unknownArgs.length, 0);
  });

  await t.step("allows positional arguments", () => {
    const { handler, result } = createUnknownArgHandler(baseOptions);

    parseArgs(["file1.ts", "file2.ts", "--help"], {
      boolean: ["help"],
      unknown: handler,
    });

    assertEquals(result.hasErrors, false);
    assertEquals(result.unknownArgs.length, 0);
  });

  await t.step("captures value from --option=value syntax", () => {
    const { handler, result } = createUnknownArgHandler(baseOptions);

    parseArgs(["--tag=foo"], {
      boolean: ["help"],
      unknown: handler,
    });

    assertEquals(result.hasErrors, true);
    assertEquals(result.unknownArgs.length, 1);
    assertEquals(result.unknownArgs[0].key, "tag");
    assertEquals(result.unknownArgs[0].value, "foo");
  });
});

Deno.test("generateHint", async (t) => {
  await t.step("suggests selector for --tag", () => {
    const hint = generateHint(
      { arg: "--tag", key: "tag", value: "smoke" },
      baseOptions,
    );
    assertEquals(
      hint,
      `Did you mean '-s "tag:smoke"'? Use the selector option to filter by tag.`,
    );
  });

  await t.step("suggests selector for --tags (plural)", () => {
    const hint = generateHint(
      { arg: "--tags", key: "tags", value: "integration" },
      baseOptions,
    );
    assertEquals(
      hint,
      `Did you mean '-s "tag:integration"'? Use the selector option to filter by tag.`,
    );
  });

  await t.step("uses placeholder when --tag has no value", () => {
    const hint = generateHint(
      { arg: "--tag", key: "tag", value: undefined },
      baseOptions,
    );
    assertEquals(
      hint,
      `Did you mean '-s "tag:<value>"'? Use the selector option to filter by tag.`,
    );
  });

  await t.step("suggests selector for --name", () => {
    const hint = generateHint(
      { arg: "--name", key: "name", value: "login" },
      baseOptions,
    );
    assertEquals(
      hint,
      `Did you mean '-s "name:login"'? Use the selector option to filter by name.`,
    );
  });

  await t.step("suggests selector for --names (plural)", () => {
    const hint = generateHint(
      { arg: "--names", key: "names", value: "auth*" },
      baseOptions,
    );
    assertEquals(
      hint,
      `Did you mean '-s "name:auth*"'? Use the selector option to filter by name.`,
    );
  });

  await t.step("suggests selector for --filter", () => {
    const hint = generateHint(
      { arg: "--filter", key: "filter", value: "login" },
      baseOptions,
    );
    assertEquals(
      hint,
      `Did you mean '-s "login"'? Use the selector option to filter scenarios.`,
    );
  });

  await t.step("suggests selector for --select", () => {
    const hint = generateHint(
      { arg: "--select", key: "select", value: undefined },
      baseOptions,
    );
    assertEquals(
      hint,
      `Did you mean '-s "<value>"'? Use the selector option to filter scenarios.`,
    );
  });

  await t.step("suggests selector for --match", () => {
    const hint = generateHint(
      { arg: "--match", key: "match", value: "api/*" },
      baseOptions,
    );
    assertEquals(
      hint,
      `Did you mean '-s "api/*"'? Use the selector option to filter scenarios.`,
    );
  });

  await t.step("suggests similar option for typos", () => {
    const hint = generateHint(
      { arg: "--selctor", key: "selctor", value: undefined },
      baseOptions,
    );
    assertEquals(hint, "Did you mean '--selector'?");
  });

  await t.step("suggests similar option for close misspelling", () => {
    const hint = generateHint(
      { arg: "--verbos", key: "verbos", value: undefined },
      baseOptions,
    );
    assertEquals(hint, "Did you mean '--verbose'?");
  });

  await t.step("falls back to help message for unrelated options", () => {
    const hint = generateHint(
      {
        arg: "--completely-unknown",
        key: "completely-unknown",
        value: undefined,
      },
      baseOptions,
    );
    assertEquals(hint, "Run 'probitas run --help' for available options.");
  });
});

Deno.test("findSimilarOption", async (t) => {
  const knownOptions = ["help", "verbose", "quiet", "selector", "config"];

  await t.step("finds exact matches", () => {
    const result = findSimilarOption("help", knownOptions);
    assertEquals(result, "help");
  });

  await t.step("finds close matches (distance 1)", () => {
    const result = findSimilarOption("hep", knownOptions);
    assertEquals(result, "help");
  });

  await t.step("finds close matches (distance 2)", () => {
    const result = findSimilarOption("selctor", knownOptions);
    assertEquals(result, "selector");
  });

  await t.step("finds close matches (distance 3)", () => {
    const result = findSimilarOption("confgi", knownOptions);
    assertEquals(result, "config");
  });

  await t.step("returns undefined for distant strings (distance > 3)", () => {
    const result = findSimilarOption("xyz", knownOptions);
    assertEquals(result, undefined);
  });

  await t.step("returns undefined for empty known options", () => {
    const result = findSimilarOption("help", []);
    assertEquals(result, undefined);
  });
});

Deno.test("formatUnknownArgError", async (t) => {
  await t.step("formats error with hint", () => {
    const error = formatUnknownArgError(
      { arg: "--tag", key: "tag", value: "smoke" },
      baseOptions,
    );
    assertMatch(error, /Unknown option: --tag/);
    assertMatch(error, /Did you mean '-s "tag:smoke"'/);
  });

  await t.step("formats error for typos", () => {
    const error = formatUnknownArgError(
      { arg: "--selctor", key: "selctor", value: undefined },
      baseOptions,
    );
    assertMatch(error, /Unknown option: --selctor/);
    assertMatch(error, /Did you mean '--selector'/);
  });
});

Deno.test("extractKnownOptions", async (t) => {
  await t.step("extracts string and boolean options", () => {
    const options = extractKnownOptions({
      string: ["config", "reporter"],
      boolean: ["help", "verbose"],
    });

    assertEquals(options.includes("config"), true);
    assertEquals(options.includes("reporter"), true);
    assertEquals(options.includes("help"), true);
    assertEquals(options.includes("verbose"), true);
  });

  await t.step("includes --no-* variants for boolean options", () => {
    const options = extractKnownOptions({
      boolean: ["color", "env"],
    });

    assertEquals(options.includes("color"), true);
    assertEquals(options.includes("no-color"), true);
    assertEquals(options.includes("env"), true);
    assertEquals(options.includes("no-env"), true);
  });

  await t.step(
    "does not duplicate no- prefix for options already starting with no-",
    () => {
      const options = extractKnownOptions({
        boolean: ["no-timeout"],
      });

      assertEquals(options.includes("no-timeout"), true);
      // Should not add no-no-timeout
      assertEquals(options.includes("no-no-timeout"), false);
    },
  );

  await t.step("extracts aliases", () => {
    const options = extractKnownOptions({
      string: ["selector"],
      alias: { s: "selector", h: "help" },
    });

    assertEquals(options.includes("s"), true);
    assertEquals(options.includes("selector"), true);
    assertEquals(options.includes("h"), true);
    assertEquals(options.includes("help"), true);
  });

  await t.step("handles array aliases", () => {
    const options = extractKnownOptions({
      alias: { v: ["verbose", "version"] },
    });

    assertEquals(options.includes("v"), true);
    assertEquals(options.includes("verbose"), true);
    assertEquals(options.includes("version"), true);
  });
});
