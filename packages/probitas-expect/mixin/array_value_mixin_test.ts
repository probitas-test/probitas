import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { assertType, type IsExact } from "@std/testing/types";
import { colorTheme } from "@probitas/core/theme";
import { catchError } from "../utils.ts";
import { assertSnapshotWithoutColors } from "./_testutils.ts";
import { createArrayValueMixin } from "./array_value_mixin.ts";

const testFilePath = new URL(import.meta.url).pathname;

Deno.test("createArrayValueMixin - type check", () => {
  const mixin = createArrayValueMixin(() => ["a", "b"], () => false, {
    valueName: "items",
  });
  const applied = mixin({ dummy: true });
  type Expected = {
    dummy: boolean;
    toHaveItemsContaining: (this: Expected, item: unknown) => Expected;
    toHaveItemsContainingEqual: (this: Expected, item: unknown) => Expected;
    toHaveItemsMatching: (
      this: Expected,
      subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
    ) => Expected;
    toHaveItemsEmpty: (this: Expected) => Expected;
  };
  type Actual = typeof applied;
  assertType<IsExact<Actual, Expected>>(true);
});

Deno.test("createArrayValueMixin - attribute check", () => {
  const applier = createArrayValueMixin(() => ["a", "b"], () => false, {
    valueName: "items",
  });
  const applied = applier({ dummy: true });
  const expected = [
    "dummy",
    "toHaveItemsContaining",
    "toHaveItemsContainingEqual",
    "toHaveItemsMatching",
    "toHaveItemsEmpty",
  ];
  assertEquals(Object.getOwnPropertyNames(applied).sort(), expected.sort());
});

Deno.test("createArrayValueMixin - toHaveItemsContaining", async (t) => {
  await t.step("success", () => {
    const mixin = createArrayValueMixin(
      () => ["apple", "banana"],
      () => false,
      {
        valueName: "items",
      },
    );
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveItemsContaining("apple"), applied);
  });

  await t.step("fail", async () => {
    const mixin = createArrayValueMixin(
      () => ["apple", "banana"],
      () => false,
      {
        valueName: "items",
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveItemsContaining("grape")).message,
    );
  });
});

Deno.test("createArrayValueMixin - toHaveItemsContainingEqual", async (t) => {
  await t.step("success", () => {
    const mixin = createArrayValueMixin(
      () => [{ id: 1 }, { id: 2 }],
      () => false,
      { valueName: "items" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveItemsContainingEqual({ id: 1 }), applied);
  });

  await t.step("fail", async () => {
    const mixin = createArrayValueMixin(
      () => [{ id: 1 }, { id: 2 }],
      () => false,
      { valueName: "items" },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveItemsContainingEqual({ id: 3 })).message,
    );
  });
});

Deno.test("createArrayValueMixin - toHaveItemsMatching", async (t) => {
  await t.step("success", () => {
    const mixin = createArrayValueMixin(
      () => [
        { id: 1, name: "Alice", age: 30 },
        { id: 2, name: "Bob", age: 25 },
      ],
      () => false,
      { valueName: "items" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveItemsMatching({ name: "Alice" }), applied);
  });

  await t.step("fail", async () => {
    const mixin = createArrayValueMixin(
      () => [
        { id: 1, name: "Alice", age: 30 },
        { id: 2, name: "Bob", age: 25 },
      ],
      () => false,
      { valueName: "items" },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveItemsMatching({ name: "Charlie" }))
        .message,
    );
  });
});

Deno.test("createArrayValueMixin - toHaveItemsEmpty", async (t) => {
  await t.step("success", () => {
    const mixin = createArrayValueMixin(() => [], () => false, {
      valueName: "items",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveItemsEmpty(), applied);
  });

  await t.step("fail", async () => {
    const mixin = createArrayValueMixin(() => ["apple"], () => false, {
      valueName: "items",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveItemsEmpty()).message,
    );
  });
});

Deno.test("createArrayValueMixin - toHaveItemsContaining with source context", async (t) => {
  await t.step("fail (noColor)", async () => {
    const mixin = createArrayValueMixin(
      () => ["apple", "banana"],
      () => false,
      {
        valueName: "items",
        expectOrigin: { path: testFilePath, line: 154, column: 5 },
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveItemsContaining("grape")).message,
    );
  });

  await t.step("fail (withColor)", async () => {
    const mixin = createArrayValueMixin(
      () => ["apple", "banana"],
      () => false,
      {
        valueName: "items",
        expectOrigin: { path: testFilePath, line: 169, column: 5 },
        theme: colorTheme,
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshot(
      t,
      catchError(() => applied.toHaveItemsContaining("grape")).message,
    );
  });
});
