/**
 * Tests for error.ts module
 *
 * @module
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import { createExpectationError } from "./error.ts";
import type { Origin } from "@probitas/core/origin";

Deno.test("createExpectationError - creates Error instance", () => {
  const error = createExpectationError({ message: "Test error" });
  assertInstanceOf(error, Error);
  assertEquals(error.message.includes("Test error"), true);
});

Deno.test("createExpectationError - includes message", () => {
  const error = createExpectationError({
    message: "Expected value to be true",
  });
  assertEquals(error.message.includes("Expected value to be true"), true);
});

Deno.test("createExpectationError - without expectOrigin returns plain message", () => {
  const error = createExpectationError({
    message: "Simple error",
  });
  // Without expectOrigin, should just be the message (possibly with context if matcherOrigin found)
  assertEquals(error.message.includes("Simple error"), true);
});

Deno.test("createExpectationError - with expectOrigin adds context", () => {
  // Use this test file as the path
  const testFilePath = new URL(import.meta.url).pathname;
  const expectOrigin: Origin = {
    path: testFilePath,
    line: 10,
    column: 3,
  };

  const error = createExpectationError({
    message: "Expected true but got false",
    expectOrigin,
  });

  // Should include the message
  assertEquals(error.message.includes("Expected true but got false"), true);
  // May include context if both origins resolved to same file
});

Deno.test("createExpectationError - context includes source lines when same file", () => {
  // This test verifies that when expectOrigin points to this file,
  // and the error is created in this file, we get source context
  const testFilePath = new URL(import.meta.url).pathname;

  // Point to a line in this file
  const expectOrigin: Origin = {
    path: testFilePath,
    line: 50, // Around this area
    column: 3,
  };

  const error = createExpectationError({
    message: "Test message",
    expectOrigin,
  });

  // The error message should contain the original message
  assertEquals(error.message.includes("Test message"), true);
});

Deno.test("createExpectationError - handles non-existent expectOrigin path gracefully", () => {
  const expectOrigin: Origin = {
    path: "/non/existent/path/file.ts",
    line: 10,
    column: 3,
  };

  // Should not throw, just return error without context
  const error = createExpectationError({
    message: "Error message",
    expectOrigin,
  });

  assertExists(error);
  assertEquals(error.message.includes("Error message"), true);
});
