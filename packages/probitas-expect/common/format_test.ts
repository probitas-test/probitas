/**
 * Tests for format utility functions.
 *
 * @module
 */

import { assertSnapshot } from "@std/testing/snapshot";
import {
  buildErrorMessage,
  formatDifferences,
  formatValue,
  stripAnsi,
} from "./format.ts";

Deno.test("formatValue", async (t) => {
  await t.step("formats null", async (t) => {
    await assertSnapshot(t, formatValue(null));
  });

  await t.step("formats undefined", async (t) => {
    await assertSnapshot(t, formatValue(undefined));
  });

  await t.step("formats string", async (t) => {
    await assertSnapshot(t, formatValue("hello world"));
  });

  await t.step("formats number", async (t) => {
    await assertSnapshot(t, formatValue(42));
  });

  await t.step("formats boolean", async (t) => {
    await assertSnapshot(t, formatValue(true));
  });

  await t.step("formats simple object", async (t) => {
    await assertSnapshot(t, formatValue({ name: "Alice", age: 30 }));
  });

  await t.step("formats nested object", async (t) => {
    await assertSnapshot(
      t,
      formatValue({
        user: {
          name: "Alice",
          age: 30,
          address: {
            city: "Tokyo",
            country: "Japan",
          },
        },
        active: true,
      }),
    );
  });

  await t.step("formats array", async (t) => {
    await assertSnapshot(t, formatValue([1, 2, 3, 4, 5]));
  });

  await t.step("formats array of objects", async (t) => {
    await assertSnapshot(
      t,
      formatValue([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
      ]),
    );
  });
});

Deno.test("formatDifferences", async (t) => {
  await t.step("no difference returns empty array", async (t) => {
    const diffs = formatDifferences({ a: 1 }, { a: 1 });
    await assertSnapshot(t, diffs);
  });

  await t.step("simple object difference", async (t) => {
    const actual = { name: "Alice", age: 30 };
    const expected = { name: "Alice", age: 31 };
    const diffs = formatDifferences(actual, expected);
    await assertSnapshot(t, stripAnsi(diffs.join("\n")));
  });

  await t.step("nested object difference", async (t) => {
    const actual = {
      user: {
        name: "Alice",
        age: 30,
        address: {
          city: "Tokyo",
          country: "Japan",
        },
      },
      active: true,
    };
    const expected = {
      user: {
        name: "Alice",
        age: 31,
        address: {
          city: "Osaka",
          country: "Japan",
        },
      },
      active: false,
    };
    const diffs = formatDifferences(actual, expected);
    await assertSnapshot(t, stripAnsi(diffs.join("\n")));
  });

  await t.step("array difference", async (t) => {
    const actual = [1, 2, 3, 4];
    const expected = [1, 2, 5, 6];
    const diffs = formatDifferences(actual, expected);
    await assertSnapshot(t, stripAnsi(diffs.join("\n")));
  });

  await t.step("array of objects difference", async (t) => {
    const actual = [
      { id: 1, name: "Alice", status: "active" },
      { id: 2, name: "Bob", status: "inactive" },
      { id: 3, name: "Charlie", status: "active" },
    ];
    const expected = [
      { id: 1, name: "Alice", status: "active" },
      { id: 2, name: "Bob", status: "active" },
      { id: 3, name: "Carol", status: "active" },
    ];
    const diffs = formatDifferences(actual, expected);
    await assertSnapshot(t, stripAnsi(diffs.join("\n")));
  });

  await t.step("missing property", async (t) => {
    const actual = { name: "Alice" };
    const expected = { name: "Alice", age: 30 };
    const diffs = formatDifferences(actual, expected);
    await assertSnapshot(t, stripAnsi(diffs.join("\n")));
  });

  await t.step("extra property", async (t) => {
    const actual = { name: "Alice", age: 30, city: "Tokyo" };
    const expected = { name: "Alice", age: 30 };
    const diffs = formatDifferences(actual, expected);
    await assertSnapshot(t, stripAnsi(diffs.join("\n")));
  });

  await t.step("deeply nested structure", async (t) => {
    const actual = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: "deep",
              count: 42,
              items: [1, 2, 3],
            },
          },
        },
      },
    };
    const expected = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: "deeper",
              count: 43,
              items: [1, 2, 4],
            },
          },
        },
      },
    };
    const diffs = formatDifferences(actual, expected);
    await assertSnapshot(t, stripAnsi(diffs.join("\n")));
  });
});

Deno.test("buildErrorMessage", async (t) => {
  await t.step("simple object mismatch", async (t) => {
    const actual = { status: 200, body: "OK" };
    const expected = { status: 201, body: "Created" };
    const diffs = formatDifferences(actual, expected);
    const message = buildErrorMessage(
      "Expected response to match",
      diffs,
      expected,
      actual,
    );
    await assertSnapshot(t, stripAnsi(message));
  });

  await t.step("complex nested structure", async (t) => {
    const actual = {
      data: {
        user: {
          id: 123,
          profile: {
            name: "Alice",
            email: "alice@example.com",
            preferences: {
              theme: "dark",
              notifications: true,
            },
          },
        },
        metadata: {
          version: "1.0",
          timestamp: "2024-01-01T00:00:00Z",
        },
      },
    };
    const expected = {
      data: {
        user: {
          id: 123,
          profile: {
            name: "Alice",
            email: "alice@test.com",
            preferences: {
              theme: "light",
              notifications: false,
            },
          },
        },
        metadata: {
          version: "2.0",
          timestamp: "2024-01-01T00:00:00Z",
        },
      },
    };
    const diffs = formatDifferences(actual, expected);
    const message = buildErrorMessage(
      "Response data does not match expected structure",
      diffs,
      expected,
      actual,
    );
    await assertSnapshot(t, stripAnsi(message));
  });

  await t.step("array with objects", async (t) => {
    const actual = {
      users: [
        { id: 1, name: "Alice", roles: ["admin", "user"] },
        { id: 2, name: "Bob", roles: ["user"] },
      ],
    };
    const expected = {
      users: [
        { id: 1, name: "Alice", roles: ["admin"] },
        { id: 2, name: "Bob", roles: ["user", "guest"] },
      ],
    };
    const diffs = formatDifferences(actual, expected);
    const message = buildErrorMessage(
      "User list does not match",
      diffs,
      expected,
      actual,
    );
    await assertSnapshot(t, stripAnsi(message));
  });
});
