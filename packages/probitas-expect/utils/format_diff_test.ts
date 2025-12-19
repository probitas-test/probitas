/**
 * Tests for format_diff module
 *
 * @module
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { noColorTheme, type Theme } from "@probitas/core/theme";
import { formatDiff } from "./format_diff.ts";
import { Any } from "./diff_any.ts";

Deno.test("formatDiff with objects shows diff for different object values", () => {
  const actual = { name: "Alice", age: 30 };
  const expected = { name: "Bob", age: 30 };

  const result = formatDiff(actual, expected, { theme: noColorTheme });

  assertEquals(typeof result, "string");
  assertStringIncludes(result!, "- ");
  assertStringIncludes(result!, "+ ");
  assertStringIncludes(result!, "Alice");
  assertStringIncludes(result!, "Bob");
});

Deno.test("formatDiff with objects shows diff with proper indentation", () => {
  const actual = { name: "Alice" };
  const expected = { name: "Bob" };

  const result = formatDiff(actual, expected, { theme: noColorTheme });
  const lines = result!.split("\n");

  // Common lines should have 4-space indent
  // Changed lines should have 2-space indent + marker
  for (const line of lines) {
    if (line.includes("-") || line.includes("+")) {
      // Changed line: "  - ..." or "  + ..."
      assertEquals(
        line.startsWith("  "),
        true,
        `Line should start with 2 spaces: "${line}"`,
      );
    } else if (line.trim() !== "") {
      // Common line: "    ..."
      assertEquals(
        line.startsWith("    "),
        true,
        `Line should start with 4 spaces: "${line}"`,
      );
    }
  }
});

Deno.test("formatDiff with objects handles nested objects", () => {
  const actual = { user: { name: "Alice" } };
  const expected = { user: { name: "Bob" } };

  const result = formatDiff(actual, expected, { theme: noColorTheme });

  assertStringIncludes(result!, "Alice");
  assertStringIncludes(result!, "Bob");
});

Deno.test("formatDiff with objects returns undefined when objects are equal", () => {
  const actual = { name: "Alice" };
  const expected = { name: "Alice" };

  const result = formatDiff(actual, expected, { theme: noColorTheme });

  assertEquals(result, undefined);
});

Deno.test("formatDiff with arrays shows diff for different array elements", () => {
  const actual = [1, 2, 3];
  const expected = [1, 4, 3];

  const result = formatDiff(actual, expected, { theme: noColorTheme });

  assertStringIncludes(result!, "2");
  assertStringIncludes(result!, "4");
});

Deno.test("formatDiff with arrays handles array of objects", () => {
  const actual = [{ id: 1 }, { id: 2 }];
  const expected = [{ id: 1 }, { id: 3 }];

  const result = formatDiff(actual, expected, { theme: noColorTheme });

  assertStringIncludes(result!, "id: 2");
  assertStringIncludes(result!, "id: 3");
});

Deno.test("formatDiff with primitives returns undefined for both primitives", () => {
  assertEquals(formatDiff(1, 2, { theme: noColorTheme }), undefined);
  assertEquals(formatDiff("a", "b", { theme: noColorTheme }), undefined);
  assertEquals(formatDiff(true, false, { theme: noColorTheme }), undefined);
  assertEquals(formatDiff(null, null, { theme: noColorTheme }), undefined);
});

Deno.test("formatDiff with primitives returns diff when one is object and one is primitive", () => {
  const result = formatDiff({ a: 1 }, null, { theme: noColorTheme });
  assertEquals(typeof result, "string");
});

Deno.test("formatDiff with Any marker displays [Any] in expected side", () => {
  const actual = { bar: "hogehoge" };
  const expected = { bar: "hogehoge", foo: Any };

  const result = formatDiff(actual, expected, { theme: noColorTheme });

  assertStringIncludes(result!, "[Any]");
  assertStringIncludes(result!, "foo");
});

Deno.test("formatDiff with color theme applies failure color to removed lines and success color to added lines", () => {
  const actual = { name: "Alice" };
  const expected = { name: "Bob" };

  const mockTheme: Theme = {
    success: (t: string) => `[GREEN]${t}[/GREEN]`,
    failure: (t: string) => `[RED]${t}[/RED]`,
    dim: (t: string) => `[DIM]${t}[/DIM]`,
    skip: (t: string) => t,
    title: (t: string) => t,
    info: (t: string) => t,
    warning: (t: string) => t,
    lightGray: (t: string) => t,
  };
  const result = formatDiff(actual, expected, { theme: mockTheme });

  assertStringIncludes(result!, "[RED]");
  assertStringIncludes(result!, "[GREEN]");
});

Deno.test("formatDiff with color theme applies dim color to common lines", () => {
  // Use multi-line object to have common lines
  const actual = { name: "Alice", age: 30 };
  const expected = { name: "Bob", age: 30 };

  const mockTheme: Theme = {
    success: (t: string) => `[GREEN]${t}[/GREEN]`,
    failure: (t: string) => `[RED]${t}[/RED]`,
    dim: (t: string) => `[DIM]${t}[/DIM]`,
    skip: (t: string) => t,
    title: (t: string) => t,
    info: (t: string) => t,
    warning: (t: string) => t,
    lightGray: (t: string) => t,
  };
  const result = formatDiff(actual, expected, { theme: mockTheme });

  assertStringIncludes(result!, "[DIM]");
});
