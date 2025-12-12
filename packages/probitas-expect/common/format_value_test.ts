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
});
