/**
 * Tests for stack trace parsing utilities
 *
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import { captureStack, parseStack, type StackFrame } from "./stack.ts";

Deno.test("parseStack parses stack trace with function name and parentheses", () => {
  const stack = `Error
    at myFunction (file:///Users/test/project/src/file.ts:42:10)`;

  assertEquals(parseStack(stack), [
    {
      context: "myFunction",
      path: "/Users/test/project/src/file.ts",
      line: 42,
      column: 10,
      user: true,
    },
  ]);
});

Deno.test("parseStack parses stack trace without function name", () => {
  const stack = `Error
    at file:///Users/test/project/src/file.ts:123:5`;

  assertEquals(parseStack(stack), [
    {
      context: "<anonymous>",
      path: "/Users/test/project/src/file.ts",
      line: 123,
      column: 5,
      user: true,
    },
  ]);
});

Deno.test("parseStack parses stack trace without column number", () => {
  const stack = `Error
    at myFunc (file:///Users/test/file.ts:10)`;

  assertEquals(parseStack(stack), [
    {
      context: "myFunc",
      path: "/Users/test/file.ts",
      line: 10,
      column: undefined,
      user: true,
    },
  ]);
});

Deno.test("parseStack parses multiple stack frames", () => {
  const stack = `Error: something went wrong
    at inner (file:///Users/test/inner.ts:10:5)
    at outer (file:///Users/test/outer.ts:20:10)
    at main (file:///Users/test/main.ts:30:15)`;

  assertEquals(parseStack(stack), [
    {
      context: "inner",
      path: "/Users/test/inner.ts",
      line: 10,
      column: 5,
      user: true,
    },
    {
      context: "outer",
      path: "/Users/test/outer.ts",
      line: 20,
      column: 10,
      user: true,
    },
    {
      context: "main",
      path: "/Users/test/main.ts",
      line: 30,
      column: 15,
      user: true,
    },
  ]);
});

Deno.test("parseStack handles complex function names", () => {
  const stack = `Error
    at Object.<anonymous> (file:///Users/test/project/test.ts:5:10)`;

  assertEquals(parseStack(stack), [
    {
      context: "Object.<anonymous>",
      path: "/Users/test/project/test.ts",
      line: 5,
      column: 10,
      user: true,
    },
  ]);
});

Deno.test("parseStack ignores non-matching lines", () => {
  const stack = `Error: something went wrong
This is not a stack frame
    at myFunction (file:///Users/test/file.ts:10:5)
Random text`;

  assertEquals(parseStack(stack), [
    {
      context: "myFunction",
      path: "/Users/test/file.ts",
      line: 10,
      column: 5,
      user: true,
    },
  ]);
});

Deno.test("parseStack returns empty array for empty stack", () => {
  assertEquals(parseStack(""), []);
});

Deno.test("parseStack marks ext: frames as non-user", () => {
  const stack = `Error
    at fn (ext:runtime/core.js:10:5)`;

  assertEquals(parseStack(stack), [
    {
      context: "fn",
      path: "ext:runtime/core.js",
      line: 10,
      column: 5,
      user: false,
    },
  ]);
});

Deno.test("parseStack marks deno: frames as non-user", () => {
  const stack = `Error
    at fn (deno:core/ops.js:20:10)`;

  assertEquals(parseStack(stack), [
    {
      context: "fn",
      path: "deno:core/ops.js",
      line: 20,
      column: 10,
      user: false,
    },
  ]);
});

Deno.test("parseStack marks node: frames as non-user", () => {
  const stack = `Error
    at fn (node:internal/process:15:8)`;

  assertEquals(parseStack(stack), [
    {
      context: "fn",
      path: "node:internal/process",
      line: 15,
      column: 8,
      user: false,
    },
  ]);
});

Deno.test("parseStack marks npm: frames as non-user", () => {
  const stack = `Error
    at fn (npm:lodash@4.17.21/lodash.js:100:20)`;

  assertEquals(parseStack(stack), [
    {
      context: "fn",
      path: "npm:lodash@4.17.21/lodash.js",
      line: 100,
      column: 20,
      user: false,
    },
  ]);
});

Deno.test("parseStack marks bun: frames as non-user", () => {
  const stack = `Error
    at fn (bun:internal:25:12)`;

  assertEquals(parseStack(stack), [
    {
      context: "fn",
      path: "bun:internal",
      line: 25,
      column: 12,
      user: false,
    },
  ]);
});

Deno.test("parseStack marks cloudflare: frames as non-user", () => {
  const stack = `Error
    at fn (cloudflare:workers:30:5)`;

  assertEquals(parseStack(stack), [
    {
      context: "fn",
      path: "cloudflare:workers",
      line: 30,
      column: 5,
      user: false,
    },
  ]);
});

Deno.test("parseStack marks http:// frames as non-user", () => {
  const stack = `Error
    at fn (http://example.com/lib.js:10:5)`;

  assertEquals(parseStack(stack), [
    {
      context: "fn",
      path: "http://example.com/lib.js",
      line: 10,
      column: 5,
      user: false,
    },
  ]);
});

Deno.test("parseStack marks https:// frames as non-user", () => {
  const stack = `Error
    at fn (https://cdn.example.com/lib.js:10:5)`;

  assertEquals(parseStack(stack), [
    {
      context: "fn",
      path: "https://cdn.example.com/lib.js",
      line: 10,
      column: 5,
      user: false,
    },
  ]);
});

Deno.test("parseStack marks local file paths as user frames", () => {
  const stack = `Error
    at fn (/Users/test/project/src/file.ts:10:5)`;

  assertEquals(parseStack(stack), [
    {
      context: "fn",
      path: "/Users/test/project/src/file.ts",
      line: 10,
      column: 5,
      user: true,
    },
  ]);
});

Deno.test("parseStack converts file:// URLs to local paths for user frames", () => {
  const stack = `Error
    at fn (file:///Users/test/project/src/file.ts:10:5)`;
  const frames = parseStack(stack);

  assertEquals(frames[0].path, "/Users/test/project/src/file.ts");
  assertEquals(frames[0].path.includes("file://"), false);
});

Deno.test("parseStack preserves non-user frame paths without conversion", () => {
  const stack = `Error
    at fn (https://jsr.io/@std/testing/mod.ts:10:5)`;

  assertEquals(parseStack(stack), [
    {
      context: "fn",
      path: "https://jsr.io/@std/testing/mod.ts",
      line: 10,
      column: 5,
      user: false,
    },
  ]);
});

Deno.test("captureStack captures current call stack", () => {
  const frames = captureStack();

  assertExists(frames);
  assertEquals(frames.length > 0, true);
});

Deno.test("captureStack captures this test file as a frame", () => {
  const frames = captureStack();

  const thisFileFrame = frames.find((f) => f.path.includes("stack_test.ts"));
  assertExists(thisFileFrame);
  assertEquals(thisFileFrame.user, true);
});

Deno.test("captureStack includes line and column information", () => {
  const frames = captureStack();

  const thisFileFrame = frames.find((f) => f.path.includes("stack_test.ts"));
  assertExists(thisFileFrame);
  assertEquals(typeof thisFileFrame.line, "number");
  assertEquals(thisFileFrame.line! > 0, true);
});

Deno.test("captureStack returns frames in correct order (innermost first)", () => {
  function inner(): StackFrame[] {
    return captureStack();
  }
  function outer(): StackFrame[] {
    return inner();
  }

  const frames = outer();
  const contexts = frames.map((f) => f.context);

  // The first frame should be captureStack or inner, before outer
  const innerIndex = contexts.findIndex((c) => c === "inner");
  const outerIndex = contexts.findIndex((c) => c === "outer");

  if (innerIndex !== -1 && outerIndex !== -1) {
    assertEquals(innerIndex < outerIndex, true);
  }
});

Deno.test("captureStack converts file:// URLs to local paths", () => {
  const frames = captureStack();

  const userFrames = frames.filter((f) => f.user);
  for (const frame of userFrames) {
    assertEquals(frame.path.includes("file://"), false);
  }
});
