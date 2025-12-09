/**
 * Tests for assertion helper functions.
 *
 * @module
 */

import { assertEquals, assertThrows } from "@std/assert";
import {
  assert,
  assertContains,
  assertIncludes,
  assertMatches,
  assertNumericComparison,
  getNonNull,
} from "./assertions.ts";

Deno.test("assert", async (t) => {
  await t.step("passes when condition is true", () => {
    assert(true, "Should not throw");
  });

  await t.step("throws when condition is false", () => {
    assertThrows(
      () => assert(false, "Expected error"),
      Error,
      "Expected error",
    );
  });

  await t.step("throws when condition is false with negate=false", () => {
    assertThrows(
      () => assert(false, "Normal error", false),
      Error,
      "Normal error",
    );
  });

  await t.step("passes when condition is false with negate=true", () => {
    assert(false, "Should not throw", true);
  });

  await t.step("throws when condition is true with negate=true", () => {
    assertThrows(
      () => assert(true, "Normal error", true, "Negated error"),
      Error,
      "Negated error",
    );
  });

  await t.step(
    "uses normal error message when negated message not provided",
    () => {
      assertThrows(
        () => assert(true, "Normal error", true),
        Error,
        "Normal error",
      );
    },
  );

  await t.step("handles complex boolean expressions", () => {
    const value = 10;
    assert(value > 5 && value < 15, "Value should be between 5 and 15");
  });
});

Deno.test("assertNumericComparison", async (t) => {
  await t.step("=== operator: passes when equal", () => {
    assertNumericComparison(10, 10, "===", "count");
  });

  await t.step("=== operator: throws when not equal", () => {
    assertThrows(
      () => assertNumericComparison(10, 5, "===", "count"),
      Error,
      "Expected count 5, got 10",
    );
  });

  await t.step("> operator: passes when greater", () => {
    assertNumericComparison(10, 5, ">", "value");
  });

  await t.step("> operator: throws when not greater", () => {
    assertThrows(
      () => assertNumericComparison(5, 10, ">", "value"),
      Error,
      "Expected value > 10, but got 5",
    );
  });

  await t.step("> operator: throws when equal", () => {
    assertThrows(
      () => assertNumericComparison(10, 10, ">", "value"),
      Error,
      "Expected value > 10, but got 10",
    );
  });

  await t.step("< operator: passes when less", () => {
    assertNumericComparison(5, 10, "<", "duration");
  });

  await t.step("< operator: throws when not less", () => {
    assertThrows(
      () => assertNumericComparison(10, 5, "<", "duration"),
      Error,
      "Expected duration < 5, but got 10",
    );
  });

  await t.step("< operator: throws when equal", () => {
    assertThrows(
      () => assertNumericComparison(10, 10, "<", "duration"),
      Error,
      "Expected duration < 10, but got 10",
    );
  });

  await t.step(">= operator: passes when greater", () => {
    assertNumericComparison(10, 5, ">=", "count");
  });

  await t.step(">= operator: passes when equal", () => {
    assertNumericComparison(10, 10, ">=", "count");
  });

  await t.step(">= operator: throws when less", () => {
    assertThrows(
      () => assertNumericComparison(5, 10, ">=", "count"),
      Error,
      "Expected count >= 10, but got 5",
    );
  });

  await t.step("<= operator: passes when less", () => {
    assertNumericComparison(5, 10, "<=", "timeout");
  });

  await t.step("<= operator: passes when equal", () => {
    assertNumericComparison(10, 10, "<=", "timeout");
  });

  await t.step("<= operator: throws when greater", () => {
    assertThrows(
      () => assertNumericComparison(10, 5, "<=", "timeout"),
      Error,
      "Expected timeout <= 5, but got 10",
    );
  });

  await t.step("handles zero values", () => {
    assertNumericComparison(0, 0, "===", "zero");
    assertNumericComparison(1, 0, ">", "positive");
    assertNumericComparison(0, 1, "<", "zero");
  });

  await t.step("handles negative values", () => {
    assertNumericComparison(-5, -5, "===", "negative");
    assertNumericComparison(-3, -5, ">", "less negative");
    assertNumericComparison(-10, -5, "<", "more negative");
  });
});

Deno.test("assertIncludes", async (t) => {
  await t.step("passes when value is included", () => {
    assertIncludes([1, 2, 3], 2, "number");
  });

  await t.step("throws when value is not included", () => {
    assertThrows(
      () => assertIncludes([1, 2, 3], 4, "number"),
      Error,
      "Expected number to be one of [1, 2, 3], got 4",
    );
  });

  await t.step("works with string arrays", () => {
    assertIncludes(["apple", "banana", "cherry"], "banana", "fruit");
  });

  await t.step("throws with string arrays when not found", () => {
    assertThrows(
      () => assertIncludes(["apple", "banana"], "orange", "fruit"),
      Error,
      "Expected fruit to be one of [apple, banana], got orange",
    );
  });

  await t.step("works with empty arrays", () => {
    assertThrows(
      () => assertIncludes([], 1, "item"),
      Error,
      "Expected item to be one of [], got 1",
    );
  });

  await t.step("works with single element arrays", () => {
    assertIncludes([42], 42, "answer");
  });
});

Deno.test("assertMatches", async (t) => {
  await t.step("string pattern: passes on exact match", () => {
    assertMatches("hello", "hello", "greeting");
  });

  await t.step("string pattern: throws on mismatch", () => {
    assertThrows(
      () => assertMatches("hello", "world", "greeting"),
      Error,
      'Expected greeting "world", got "hello"',
    );
  });

  await t.step("regex pattern: passes on match", () => {
    assertMatches("hello123", /hello\d+/, "message");
  });

  await t.step("regex pattern: throws on mismatch", () => {
    assertThrows(
      () => assertMatches("hello", /\d+/, "message"),
      Error,
      'Expected message to match /\\d+/, got "hello"',
    );
  });

  await t.step("regex pattern: case sensitive by default", () => {
    assertThrows(
      () => assertMatches("Hello", /hello/, "greeting"),
      Error,
      'Expected greeting to match /hello/, got "Hello"',
    );
  });

  await t.step("regex pattern: case insensitive flag works", () => {
    assertMatches("Hello", /hello/i, "greeting");
  });

  await t.step("empty string matching", () => {
    assertMatches("", "", "empty");
    assertMatches("", /^$/, "empty");
  });

  await t.step("partial regex matches", () => {
    assertMatches("prefix-middle-suffix", /middle/, "text");
  });
});

Deno.test("assertContains", async (t) => {
  await t.step("passes when substring is found", () => {
    assertContains("hello world", "world", "message");
  });

  await t.step("throws when substring is not found", () => {
    assertThrows(
      () => assertContains("hello world", "foo", "message"),
      Error,
      'Expected message to contain "foo", got "hello world"',
    );
  });

  await t.step("finds substring at start", () => {
    assertContains("hello world", "hello", "text");
  });

  await t.step("finds substring at end", () => {
    assertContains("hello world", "world", "text");
  });

  await t.step("finds substring in middle", () => {
    assertContains("hello world", "o w", "text");
  });

  await t.step("exact match counts as contains", () => {
    assertContains("exact", "exact", "text");
  });

  await t.step("empty substring always matches", () => {
    assertContains("anything", "", "text");
  });

  await t.step("case sensitive by default", () => {
    assertThrows(
      () => assertContains("Hello", "hello", "greeting"),
      Error,
      'Expected greeting to contain "hello", got "Hello"',
    );
  });
});

Deno.test("getNonNull", async (t) => {
  await t.step("returns value when not null or undefined", () => {
    assertEquals(getNonNull(42, "number"), 42);
    assertEquals(getNonNull("hello", "string"), "hello");
    assertEquals(getNonNull(true, "boolean"), true);
    assertEquals(getNonNull(0, "zero"), 0);
    assertEquals(getNonNull("", "empty string"), "");
    assertEquals(getNonNull(false, "false"), false);
  });

  await t.step("throws when value is null", () => {
    assertThrows(
      () => getNonNull(null, "value"),
      Error,
      "Expected value to exist, but got null",
    );
  });

  await t.step("throws when value is undefined", () => {
    assertThrows(
      () => getNonNull(undefined, "value"),
      Error,
      "Expected value to exist, but got undefined",
    );
  });

  await t.step("works with objects", () => {
    const obj = { key: "value" };
    assertEquals(getNonNull(obj, "object"), obj);
  });

  await t.step("works with arrays", () => {
    const arr = [1, 2, 3];
    assertEquals(getNonNull(arr, "array"), arr);
  });

  await t.step("preserves type information", () => {
    const value: string | null = "test";
    const result: string = getNonNull(value, "value");
    assertEquals(result, "test");
  });
});
