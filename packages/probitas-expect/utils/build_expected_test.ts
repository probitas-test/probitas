/**
 * Tests for build_expected module
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { Any } from "./diff_any.ts";
import {
  buildMatchingExpected,
  buildPropertyExpected,
} from "./build_expected.ts";

Deno.test("buildMatchingExpected with matching properties uses pattern values for matching keys", () => {
  const actual = { name: "Alice", age: 30 };
  const pattern = { name: "Bob" };

  const result = buildMatchingExpected(actual, pattern);

  assertEquals(result, { name: "Bob", age: 30 });
});

Deno.test("buildMatchingExpected with matching properties preserves actual values for non-pattern keys", () => {
  const actual = { name: "Alice", age: 30, city: "Tokyo" };
  const pattern = { name: "Alice" };

  const result = buildMatchingExpected(actual, pattern);

  assertEquals(result, { name: "Alice", age: 30, city: "Tokyo" });
});

Deno.test("buildMatchingExpected with matching properties includes pattern keys missing from actual", () => {
  const actual = { name: "Alice" };
  const pattern = { name: "Alice", age: 25 };

  const result = buildMatchingExpected(actual, pattern);

  assertEquals(result, { name: "Alice", age: 25 });
});

Deno.test("buildMatchingExpected with matching properties handles empty pattern", () => {
  const actual = { name: "Alice", age: 30 };
  const pattern = {};

  const result = buildMatchingExpected(actual, pattern);

  assertEquals(result, { name: "Alice", age: 30 });
});

Deno.test("buildMatchingExpected with matching properties handles empty actual", () => {
  const actual = {};
  const pattern = { name: "Bob" };

  const result = buildMatchingExpected(actual, pattern);

  assertEquals(result, { name: "Bob" });
});

Deno.test("buildMatchingExpected with nested objects replaces nested objects from pattern", () => {
  const actual = { user: { name: "Alice", age: 30 } };
  const pattern = { user: { name: "Bob" } };

  const result = buildMatchingExpected(actual, pattern);

  // Pattern value is used directly (not merged)
  assertEquals(result, { user: { name: "Bob" } });
});

Deno.test("buildMatchingExpected with nested objects preserves nested objects from actual when not in pattern", () => {
  const actual = { user: { name: "Alice" }, meta: { id: 1 } };
  const pattern = { user: { name: "Bob" } };

  const result = buildMatchingExpected(actual, pattern);

  assertEquals(result, { user: { name: "Bob" }, meta: { id: 1 } });
});

Deno.test("buildMatchingExpected with arrays replaces arrays from pattern", () => {
  const actual = { items: [1, 2, 3] };
  const pattern = { items: [4, 5] };

  const result = buildMatchingExpected(actual, pattern);

  assertEquals(result, { items: [4, 5] });
});

Deno.test("buildMatchingExpected with arrays preserves arrays from actual when not in pattern", () => {
  const actual = { items: [1, 2, 3], tags: ["a", "b"] };
  const pattern = { items: [4, 5] };

  const result = buildMatchingExpected(actual, pattern);

  assertEquals(result, { items: [4, 5], tags: ["a", "b"] });
});

Deno.test("buildPropertyExpected with simple property path builds expected with Any marker when no expected value", () => {
  const actual = { name: "Alice", age: 30 };

  const result = buildPropertyExpected(actual, "foo");

  assertEquals(result.name, "Alice");
  assertEquals(result.age, 30);
  assertEquals(result.foo, Any);
});

Deno.test("buildPropertyExpected with simple property path builds expected with specified value", () => {
  const actual = { name: "Alice", age: 30 };

  const result = buildPropertyExpected(actual, "foo", "bar");

  assertEquals(result, { name: "Alice", age: 30, foo: "bar" });
});

Deno.test("buildPropertyExpected with simple property path overwrites existing property with Any when no expected value", () => {
  const actual = { name: "Alice", age: 30 };

  const result = buildPropertyExpected(actual, "name");

  assertEquals(result.name, Any);
  assertEquals(result.age, 30);
});

Deno.test("buildPropertyExpected with simple property path overwrites existing property with specified value", () => {
  const actual = { name: "Alice", age: 30 };

  const result = buildPropertyExpected(actual, "name", "Bob");

  assertEquals(result, { name: "Bob", age: 30 });
});

Deno.test("buildPropertyExpected with nested property path builds nested expected with Any marker", () => {
  const actual = { user: { name: "Alice" } };

  const result = buildPropertyExpected(actual, "user.age");
  const user = result.user as Record<string, unknown>;

  assertEquals(user.name, "Alice");
  assertEquals(user.age, Any);
});

Deno.test("buildPropertyExpected with nested property path builds nested expected with specified value", () => {
  const actual = { user: { name: "Alice" } };

  const result = buildPropertyExpected(actual, "user.age", 30);

  assertEquals(result, { user: { name: "Alice", age: 30 } });
});

Deno.test("buildPropertyExpected with nested property path creates intermediate objects when path does not exist", () => {
  const actual = { name: "Alice" };

  const result = buildPropertyExpected(actual, "user.profile.bio");
  const user = result.user as Record<string, unknown>;
  const profile = user.profile as Record<string, unknown>;

  assertEquals(result.name, "Alice");
  assertEquals(profile.bio, Any);
});

Deno.test("buildPropertyExpected with nested property path handles deeply nested paths", () => {
  const actual = {};

  const result = buildPropertyExpected(actual, "a.b.c.d", "value");

  assertEquals(result, { a: { b: { c: { d: "value" } } } });
});

Deno.test("buildPropertyExpected with array index in path handles array index notation", () => {
  const actual = { items: [{ id: 1 }, { id: 2 }] };

  const result = buildPropertyExpected(actual, "items[0].name");
  const items = result.items as Record<string, unknown>[];

  assertEquals(items[0].id, 1);
  assertEquals(items[0].name, Any);
  assertEquals(items[1], { id: 2 });
});

Deno.test("buildPropertyExpected with array index in path handles array index with specified value", () => {
  const actual = { items: [{ id: 1 }] };

  const result = buildPropertyExpected(actual, "items[0].name", "foo");

  assertEquals(result, { items: [{ id: 1, name: "foo" }] });
});

Deno.test("buildPropertyExpected edge cases handles empty actual object", () => {
  const actual = {};

  const result = buildPropertyExpected(actual, "foo");

  assertEquals(result.foo, Any);
});

Deno.test("buildPropertyExpected edge cases preserves non-object values in actual", () => {
  const actual = { count: 42, active: true, label: "test" };

  const result = buildPropertyExpected(actual, "newProp", "value");

  assertEquals(result, {
    count: 42,
    active: true,
    label: "test",
    newProp: "value",
  });
});
