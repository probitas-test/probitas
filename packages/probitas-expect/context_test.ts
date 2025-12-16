/**
 * Tests for context.ts module
 *
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  captureOrigin,
  formatSourceContext,
  getSourceContext,
  type SourceContext,
} from "./context.ts";
import type { Origin } from "@probitas/core/origin";

Deno.test("captureOrigin - captures current location", () => {
  const origin = captureOrigin();
  assertExists(origin);
  assertEquals(origin.path.endsWith("context_test.ts"), true);
  assertExists(origin.line);
  assertExists(origin.column);
});

Deno.test("captureOrigin - captures correct line", () => {
  const origin = captureOrigin(); // Line 25
  assertExists(origin);
  assertEquals(origin.line, 25);
});

Deno.test("captureOrigin - captures column", () => {
  const origin = captureOrigin();
  assertExists(origin);
  assertExists(origin.column);
  assertEquals(typeof origin.column, "number");
});

Deno.test("getSourceContext - returns null for different files", () => {
  const start: Origin = { path: "/foo/bar.ts", line: 10, column: 1 };
  const end: Origin = { path: "/foo/baz.ts", line: 15, column: 1 };
  const ctx = getSourceContext(start, end);
  assertEquals(ctx, null);
});

Deno.test("getSourceContext - returns null for missing line numbers", async (t) => {
  await t.step("start has no line", () => {
    const start: Origin = { path: "/foo/bar.ts", column: 1 };
    const end: Origin = { path: "/foo/bar.ts", line: 15, column: 1 };
    const ctx = getSourceContext(start, end);
    assertEquals(ctx, null);
  });

  await t.step("end has no line", () => {
    const start: Origin = { path: "/foo/bar.ts", line: 10, column: 1 };
    const end: Origin = { path: "/foo/bar.ts", column: 1 };
    const ctx = getSourceContext(start, end);
    assertEquals(ctx, null);
  });
});

Deno.test("getSourceContext - returns null for non-existent file", () => {
  const start: Origin = {
    path: "/non/existent/file.ts",
    line: 10,
    column: 1,
  };
  const end: Origin = { path: "/non/existent/file.ts", line: 15, column: 1 };
  const ctx = getSourceContext(start, end);
  assertEquals(ctx, null);
});

Deno.test("getSourceContext - returns context for same file", () => {
  // Use this test file itself
  const testFilePath = new URL(import.meta.url).pathname;
  const start: Origin = { path: testFilePath, line: 5, column: 3 };
  const end: Origin = { path: testFilePath, line: 7, column: 5 };

  const ctx = getSourceContext(start, end);
  assertExists(ctx);
  assertEquals(ctx.start, start);
  assertEquals(ctx.end, end);
  assertEquals(ctx.hasEllipsis, false);
  assertEquals(ctx.content.length > 0, true);
});

Deno.test("getSourceContext - shows ellipsis for large distance", () => {
  const testFilePath = new URL(import.meta.url).pathname;
  // Distance > 5 lines should show ellipsis
  const start: Origin = { path: testFilePath, line: 5, column: 3 };
  const end: Origin = { path: testFilePath, line: 20, column: 5 };

  const ctx = getSourceContext(start, end);
  assertExists(ctx);
  assertEquals(ctx.hasEllipsis, true);
  // Should contain dotted separator "┆" in content
  const hasEllipsisLine = ctx.content.some((line) => line.includes("┆"));
  assertEquals(hasEllipsisLine, true);
});

Deno.test("getSourceContext - no ellipsis for small distance", () => {
  const testFilePath = new URL(import.meta.url).pathname;
  // Distance <= 5 lines should not show ellipsis
  const start: Origin = { path: testFilePath, line: 5, column: 3 };
  const end: Origin = { path: testFilePath, line: 8, column: 5 };

  const ctx = getSourceContext(start, end);
  assertExists(ctx);
  assertEquals(ctx.hasEllipsis, false);
});

Deno.test("getSourceContext - custom ellipsis threshold", () => {
  const testFilePath = new URL(import.meta.url).pathname;
  const start: Origin = { path: testFilePath, line: 5, column: 3 };
  const end: Origin = { path: testFilePath, line: 8, column: 5 };

  // With threshold of 2, distance of 3 should show ellipsis
  const ctx = getSourceContext(start, end, { ellipsisThreshold: 2 });
  assertExists(ctx);
  assertEquals(ctx.hasEllipsis, true);
});

Deno.test("getSourceContext - content includes caret marker for end only", () => {
  const testFilePath = new URL(import.meta.url).pathname;
  const start: Origin = { path: testFilePath, line: 5, column: 3 };
  const end: Origin = { path: testFilePath, line: 7, column: 5 };

  const ctx = getSourceContext(start, end);
  assertExists(ctx);
  // Should contain exactly one caret marker (for end position only)
  const caretLines = ctx.content.filter((line) => line.includes("^"));
  assertEquals(caretLines.length, 1);
});

Deno.test("formatSourceContext - formats header and body", () => {
  const ctx: SourceContext = {
    start: { path: "/foo/bar/test.ts", line: 10, column: 3 },
    end: { path: "/foo/bar/test.ts", line: 12, column: 5 },
    content: [
      "10| const x = 1;",
      "11| const y = 2;",
      "12| const z = 3;",
      "  |     ^",
    ],
    hasEllipsis: false,
  };

  const formatted = formatSourceContext(ctx);
  assertEquals(formatted.includes("Context (/foo/bar/test.ts:10:3)"), true);
  assertEquals(formatted.includes("10| const x = 1;"), true);
});

Deno.test("formatSourceContext - uses cwd for relative path", () => {
  const ctx: SourceContext = {
    start: { path: "/Users/test/project/src/test.ts", line: 10, column: 3 },
    end: { path: "/Users/test/project/src/test.ts", line: 12, column: 5 },
    content: ["10| code"],
    hasEllipsis: false,
  };

  const formatted = formatSourceContext(ctx, { cwd: "/Users/test/project" });
  assertEquals(formatted.includes("Context (src/test.ts:10:3)"), true);
});
