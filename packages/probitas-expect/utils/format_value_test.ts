/**
 * Tests for format utility functions.
 *
 * @module
 */

import { assertSnapshot } from "@std/testing/snapshot";
import { formatValue } from "./format_value.ts";

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

  await t.step("truncates large array (iterableLimit)", async (t) => {
    await assertSnapshot(
      t,
      formatValue([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    );
  });

  await t.step("truncates deeply nested object (depth)", async (t) => {
    await assertSnapshot(
      t,
      formatValue({
        level1: {
          level2: {
            level3: {
              level4: {
                value: "deep",
              },
            },
          },
        },
      }),
    );
  });

  await t.step("truncates long string (strAbbreviateSize)", async (t) => {
    await assertSnapshot(
      t,
      formatValue({
        message:
          "This is a very long string that exceeds the abbreviation limit and should be truncated",
      }),
    );
  });

  await t.step("handles large complex object", async (t) => {
    await assertSnapshot(
      t,
      formatValue({
        users: [
          {
            id: 1,
            name: "Alice",
            email: "alice@example.com",
            meta: { created: "2024-01-01" },
          },
          {
            id: 2,
            name: "Bob",
            email: "bob@example.com",
            meta: { created: "2024-02-01" },
          },
          {
            id: 3,
            name: "Charlie",
            email: "charlie@example.com",
            meta: { created: "2024-03-01" },
          },
          {
            id: 4,
            name: "David",
            email: "david@example.com",
            meta: { created: "2024-04-01" },
          },
          {
            id: 5,
            name: "Eve",
            email: "eve@example.com",
            meta: { created: "2024-05-01" },
          },
        ],
        pagination: { page: 1, total: 100, perPage: 10 },
      }),
    );
  });
});
