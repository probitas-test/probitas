/**
 * Tests for captureSource
 *
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { captureSource, parseStackLine } from "./capture_source.ts";

describe("parseStackLine", () => {
  it("parses stack line with function name and parentheses", () => {
    const line =
      "    at myFunction (file:///Users/test/project/src/file.ts:42:10)";
    const source = parseStackLine(line);

    assertExists(source);
    assertEquals(source.file, "/Users/test/project/src/file.ts");
    assertEquals(source.line, 42);
  });

  it("parses stack line without function name", () => {
    const line = "    at file:///Users/test/project/src/file.ts:123:5";
    const source = parseStackLine(line);

    assertExists(source);
    assertEquals(source.file, "/Users/test/project/src/file.ts");
    assertEquals(source.line, 123);
  });

  it("returns absolute paths", () => {
    const line = "    at file:///other/path/file.ts:10:1";
    const source = parseStackLine(line);

    assertExists(source);
    assertEquals(source.file, "/other/path/file.ts");
    assertEquals(source.line, 10);
  });

  it("returns undefined for non-matching lines", () => {
    const line = "Error: something went wrong";
    const source = parseStackLine(line);

    assertEquals(source, undefined);
  });

  it("returns undefined for lines without file:// prefix", () => {
    const line = "    at someFunction (native)";
    const source = parseStackLine(line);

    assertEquals(source, undefined);
  });

  it("handles complex function names", () => {
    const line =
      "    at Object.<anonymous> (file:///Users/test/project/test.ts:5:10)";
    const source = parseStackLine(line);

    assertExists(source);
    assertEquals(source.file, "/Users/test/project/test.ts");
    assertEquals(source.line, 5);
  });
});

describe("captureSource", () => {
  it("captures source of immediate caller with depth=1", () => {
    const source = captureSource(1);
    assertExists(source);
    assertEquals(
      source?.file.includes("capture_source_test.ts"),
      true,
    );
    assertEquals(typeof source?.line, "number");
    assertEquals((source?.line ?? 0) > 0, true);
  });

  it("captures source with default depth=2", () => {
    function wrapper() {
      return captureSource(); // depth=2 by default
    }
    const source = wrapper();
    assertExists(source);
    assertEquals(
      source.file.includes("capture_source_test.ts"),
      true,
    );
  });

  it("captures source with custom depth", () => {
    function level1() {
      return level2();
    }
    function level2() {
      return level3();
    }
    function level3() {
      // depth=4 to skip: captureSource -> level3 -> level2 -> level1
      return captureSource(4);
    }
    const source = level1();
    assertExists(source);
    assertEquals(
      source.file.includes("capture_source_test.ts"),
      true,
    );
  });

  it("returns absolute path", () => {
    const source = captureSource(1);
    assertExists(source);
    // Should be absolute path
    assertEquals(source.file.startsWith("/"), true);
    assertEquals(source.file.includes("capture_source_test.ts"), true);
  });

  it("handles file:// URLs in stack traces", () => {
    // This test verifies the implementation handles file:// prefix correctly
    const source = captureSource(1);
    assertExists(source);
    // Should not contain file:// prefix
    assertEquals(source.file.includes("file://"), false);
  });
});
