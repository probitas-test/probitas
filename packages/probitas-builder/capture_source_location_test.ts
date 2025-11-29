/**
 * Tests for captureSourceLocation
 *
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  captureSourceLocation,
  parseStackLine,
} from "./capture_source_location.ts";

describe("parseStackLine", () => {
  const cwd = "/Users/test/project";

  it("parses stack line with function name and parentheses", () => {
    const line =
      "    at myFunction (file:///Users/test/project/src/file.ts:42:10)";
    const location = parseStackLine(line, cwd);

    assertExists(location);
    assertEquals(location.file, "src/file.ts");
    assertEquals(location.line, 42);
  });

  it("parses stack line without function name", () => {
    const line = "    at file:///Users/test/project/src/file.ts:123:5";
    const location = parseStackLine(line, cwd);

    assertExists(location);
    assertEquals(location.file, "src/file.ts");
    assertEquals(location.line, 123);
  });

  it("handles absolute paths outside cwd", () => {
    const line = "    at file:///other/path/file.ts:10:1";
    const location = parseStackLine(line, cwd);

    assertExists(location);
    assertEquals(location.file, "/other/path/file.ts");
    assertEquals(location.line, 10);
  });

  it("returns undefined for non-matching lines", () => {
    const line = "Error: something went wrong";
    const location = parseStackLine(line, cwd);

    assertEquals(location, undefined);
  });

  it("returns undefined for lines without file:// prefix", () => {
    const line = "    at someFunction (native)";
    const location = parseStackLine(line, cwd);

    assertEquals(location, undefined);
  });

  it("handles complex function names", () => {
    const line =
      "    at Object.<anonymous> (file:///Users/test/project/test.ts:5:10)";
    const location = parseStackLine(line, cwd);

    assertExists(location);
    assertEquals(location.file, "test.ts");
    assertEquals(location.line, 5);
  });
});

describe("captureSourceLocation", () => {
  it("captures location of immediate caller with depth=1", () => {
    const location = captureSourceLocation(1);
    assertExists(location);
    assertEquals(
      location.file.includes("capture_source_location_test.ts"),
      true,
    );
    assertEquals(typeof location.line, "number");
    assertEquals(location.line > 0, true);
  });

  it("captures location with default depth=2", () => {
    function wrapper() {
      return captureSourceLocation(); // depth=2 by default
    }
    const location = wrapper();
    assertExists(location);
    assertEquals(
      location.file.includes("capture_source_location_test.ts"),
      true,
    );
  });

  it("captures location with custom depth", () => {
    function level1() {
      return level2();
    }
    function level2() {
      return level3();
    }
    function level3() {
      // depth=4 to skip: captureSourceLocation -> level3 -> level2 -> level1
      return captureSourceLocation(4);
    }
    const location = level1();
    assertExists(location);
    assertEquals(
      location.file.includes("capture_source_location_test.ts"),
      true,
    );
  });

  it("returns relative path from cwd", () => {
    const location = captureSourceLocation(1);
    assertExists(location);
    // Should be relative path, not absolute
    assertEquals(location.file.startsWith("/"), false);
    assertEquals(location.file.startsWith("packages/"), true);
  });

  it("handles file:// URLs in stack traces", () => {
    // This test verifies the implementation handles file:// prefix correctly
    const location = captureSourceLocation(1);
    assertExists(location);
    // Should not contain file:// prefix
    assertEquals(location.file.includes("file://"), false);
  });
});
