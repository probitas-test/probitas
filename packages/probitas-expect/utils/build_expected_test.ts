/**
 * Tests for build_expected module
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Any } from "./diff_any.ts";
import {
  buildMatchingExpected,
  buildPropertyExpected,
} from "./build_expected.ts";

describe("buildMatchingExpected", () => {
  describe("with matching properties", () => {
    it("uses pattern values for matching keys", () => {
      const actual = { name: "Alice", age: 30 };
      const pattern = { name: "Bob" };

      const result = buildMatchingExpected(actual, pattern);

      assertEquals(result, { name: "Bob", age: 30 });
    });

    it("preserves actual values for non-pattern keys", () => {
      const actual = { name: "Alice", age: 30, city: "Tokyo" };
      const pattern = { name: "Alice" };

      const result = buildMatchingExpected(actual, pattern);

      assertEquals(result, { name: "Alice", age: 30, city: "Tokyo" });
    });

    it("includes pattern keys missing from actual", () => {
      const actual = { name: "Alice" };
      const pattern = { name: "Alice", age: 25 };

      const result = buildMatchingExpected(actual, pattern);

      assertEquals(result, { name: "Alice", age: 25 });
    });

    it("handles empty pattern", () => {
      const actual = { name: "Alice", age: 30 };
      const pattern = {};

      const result = buildMatchingExpected(actual, pattern);

      assertEquals(result, { name: "Alice", age: 30 });
    });

    it("handles empty actual", () => {
      const actual = {};
      const pattern = { name: "Bob" };

      const result = buildMatchingExpected(actual, pattern);

      assertEquals(result, { name: "Bob" });
    });
  });

  describe("with nested objects", () => {
    it("replaces nested objects from pattern", () => {
      const actual = { user: { name: "Alice", age: 30 } };
      const pattern = { user: { name: "Bob" } };

      const result = buildMatchingExpected(actual, pattern);

      // Pattern value is used directly (not merged)
      assertEquals(result, { user: { name: "Bob" } });
    });

    it("preserves nested objects from actual when not in pattern", () => {
      const actual = { user: { name: "Alice" }, meta: { id: 1 } };
      const pattern = { user: { name: "Bob" } };

      const result = buildMatchingExpected(actual, pattern);

      assertEquals(result, { user: { name: "Bob" }, meta: { id: 1 } });
    });
  });

  describe("with arrays", () => {
    it("replaces arrays from pattern", () => {
      const actual = { items: [1, 2, 3] };
      const pattern = { items: [4, 5] };

      const result = buildMatchingExpected(actual, pattern);

      assertEquals(result, { items: [4, 5] });
    });

    it("preserves arrays from actual when not in pattern", () => {
      const actual = { items: [1, 2, 3], tags: ["a", "b"] };
      const pattern = { items: [4, 5] };

      const result = buildMatchingExpected(actual, pattern);

      assertEquals(result, { items: [4, 5], tags: ["a", "b"] });
    });
  });
});

describe("buildPropertyExpected", () => {
  describe("with simple property path", () => {
    it("builds expected with Any marker when no expected value", () => {
      const actual = { name: "Alice", age: 30 };

      const result = buildPropertyExpected(actual, "foo");

      assertEquals(result.name, "Alice");
      assertEquals(result.age, 30);
      assertEquals(result.foo, Any);
    });

    it("builds expected with specified value", () => {
      const actual = { name: "Alice", age: 30 };

      const result = buildPropertyExpected(actual, "foo", "bar");

      assertEquals(result, { name: "Alice", age: 30, foo: "bar" });
    });

    it("overwrites existing property with Any when no expected value", () => {
      const actual = { name: "Alice", age: 30 };

      const result = buildPropertyExpected(actual, "name");

      assertEquals(result.name, Any);
      assertEquals(result.age, 30);
    });

    it("overwrites existing property with specified value", () => {
      const actual = { name: "Alice", age: 30 };

      const result = buildPropertyExpected(actual, "name", "Bob");

      assertEquals(result, { name: "Bob", age: 30 });
    });
  });

  describe("with nested property path", () => {
    it("builds nested expected with Any marker", () => {
      const actual = { user: { name: "Alice" } };

      const result = buildPropertyExpected(actual, "user.age");
      const user = result.user as Record<string, unknown>;

      assertEquals(user.name, "Alice");
      assertEquals(user.age, Any);
    });

    it("builds nested expected with specified value", () => {
      const actual = { user: { name: "Alice" } };

      const result = buildPropertyExpected(actual, "user.age", 30);

      assertEquals(result, { user: { name: "Alice", age: 30 } });
    });

    it("creates intermediate objects when path does not exist", () => {
      const actual = { name: "Alice" };

      const result = buildPropertyExpected(actual, "user.profile.bio");
      const user = result.user as Record<string, unknown>;
      const profile = user.profile as Record<string, unknown>;

      assertEquals(result.name, "Alice");
      assertEquals(profile.bio, Any);
    });

    it("handles deeply nested paths", () => {
      const actual = {};

      const result = buildPropertyExpected(actual, "a.b.c.d", "value");

      assertEquals(result, { a: { b: { c: { d: "value" } } } });
    });
  });

  describe("with array index in path", () => {
    it("handles array index notation", () => {
      const actual = { items: [{ id: 1 }, { id: 2 }] };

      const result = buildPropertyExpected(actual, "items[0].name");
      const items = result.items as Record<string, unknown>[];

      assertEquals(items[0].id, 1);
      assertEquals(items[0].name, Any);
      assertEquals(items[1], { id: 2 });
    });

    it("handles array index with specified value", () => {
      const actual = { items: [{ id: 1 }] };

      const result = buildPropertyExpected(actual, "items[0].name", "foo");

      assertEquals(result, { items: [{ id: 1, name: "foo" }] });
    });
  });

  describe("edge cases", () => {
    it("handles empty actual object", () => {
      const actual = {};

      const result = buildPropertyExpected(actual, "foo");

      assertEquals(result.foo, Any);
    });

    it("preserves non-object values in actual", () => {
      const actual = { count: 42, active: true, label: "test" };

      const result = buildPropertyExpected(actual, "newProp", "value");

      assertEquals(result, {
        count: 42,
        active: true,
        label: "test",
        newProp: "value",
      });
    });
  });
});
