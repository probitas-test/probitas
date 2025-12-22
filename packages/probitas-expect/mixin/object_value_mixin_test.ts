import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { assertType, type IsExact } from "@std/testing/types";
import { colorTheme } from "@probitas/core/theme";
import { catchError } from "../utils.ts";
import { assertSnapshotWithoutColors } from "./_testutils.ts";
import { createObjectValueMixin } from "./object_value_mixin.ts";

const testFilePath = new URL(import.meta.url).pathname;

Deno.test("createObjectValueMixin - type check", () => {
  const mixin = createObjectValueMixin(
    () => ({ name: "Alice", age: 30 }),
    () => false,
    { valueName: "user" },
  );
  const applied = mixin({ dummy: true });
  type Expected = {
    dummy: boolean;
    toHaveUserMatching: (
      this: Expected,
      subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
    ) => Expected;
    toHaveUserProperty: (
      this: Expected,
      keyPath: string | string[],
      value?: unknown,
    ) => Expected;
    toHaveUserPropertyContaining: (
      this: Expected,
      keyPath: string | string[],
      expected: unknown,
    ) => Expected;
    toHaveUserPropertyMatching: (
      this: Expected,
      keyPath: string | string[],
      subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
    ) => Expected;
    toHaveUserPropertySatisfying: (
      this: Expected,
      keyPath: string | string[],
      // deno-lint-ignore no-explicit-any
      matcher: (value: any) => void,
    ) => Expected;
  };
  type Actual = typeof applied;
  assertType<IsExact<Actual, Expected>>(true);
});

Deno.test("createObjectValueMixin - attribute check", () => {
  const applier = createObjectValueMixin(
    () => ({ name: "Alice", age: 30 }),
    () => false,
    { valueName: "user" },
  );
  const applied = applier({ dummy: true });
  const expected = [
    "dummy",
    "toHaveUserMatching",
    "toHaveUserProperty",
    "toHaveUserPropertyContaining",
    "toHaveUserPropertyMatching",
    "toHaveUserPropertySatisfying",
  ];
  assertEquals(Object.getOwnPropertyNames(applied).sort(), expected.sort());
});

Deno.test("createObjectValueMixin - toHaveUserMatching", async (t) => {
  await t.step("success", () => {
    const mixin = createObjectValueMixin(
      () => ({ name: "Alice", age: 30 }),
      () => false,
      { valueName: "user" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveUserMatching({ name: "Alice" }), applied);
  });

  await t.step("fail", async () => {
    const mixin = createObjectValueMixin(
      () => ({ name: "Alice", age: 30 }),
      () => false,
      { valueName: "user" },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveUserMatching({ name: "Bob" })).message,
    );
  });
});

Deno.test("createObjectValueMixin - toHaveUserProperty", async (t) => {
  await t.step("success - property exists", () => {
    const mixin = createObjectValueMixin(
      () => ({ name: "Alice", age: 30 }),
      () => false,
      { valueName: "user" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveUserProperty("name"), applied);
  });

  await t.step("success - property with value", () => {
    const mixin = createObjectValueMixin(
      () => ({ name: "Alice", age: 30 }),
      () => false,
      { valueName: "user" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveUserProperty("name", "Alice"), applied);
  });

  await t.step("fail - property missing", async () => {
    const mixin = createObjectValueMixin(
      () => ({ name: "Alice", age: 30 }),
      () => false,
      { valueName: "user" },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveUserProperty("email")).message,
    );
  });

  await t.step("fail - property value mismatch", async () => {
    const mixin = createObjectValueMixin(
      () => ({ name: "Alice", age: 30 }),
      () => false,
      { valueName: "user" },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveUserProperty("name", "Bob")).message,
    );
  });
});

Deno.test("createObjectValueMixin - toHaveUserPropertyContaining", async (t) => {
  await t.step("success", () => {
    const mixin = createObjectValueMixin(
      () => ({ message: "hello world", items: ["apple", "banana"] }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(
      applied.toHaveDataPropertyContaining("message", "world"),
      applied,
    );
  });

  await t.step("fail", async () => {
    const mixin = createObjectValueMixin(
      () => ({ message: "hello world" }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() =>
        applied.toHaveDataPropertyContaining("message", "goodbye")
      ).message,
    );
  });
});

Deno.test("createObjectValueMixin - toHaveUserPropertyMatching", async (t) => {
  await t.step("success", () => {
    const mixin = createObjectValueMixin(
      () => ({ config: { port: 8080, host: "localhost" } }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(
      applied.toHaveDataPropertyMatching("config", { port: 8080 }),
      applied,
    );
  });

  await t.step("fail", async () => {
    const mixin = createObjectValueMixin(
      () => ({ config: { port: 8080 } }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() =>
        applied.toHaveDataPropertyMatching("config", { port: 3000 })
      ).message,
    );
  });
});

Deno.test("createObjectValueMixin - toHaveUserPropertySatisfying", async (t) => {
  await t.step("success", () => {
    const mixin = createObjectValueMixin(
      () => ({ message: "hello" }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(
      applied.toHaveDataPropertySatisfying("message", (v) => {
        if (typeof v !== "string") throw new Error("Must be string");
      }),
      applied,
    );
  });

  await t.step("fail", async () => {
    const mixin = createObjectValueMixin(
      () => ({ message: "hello" }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() =>
        applied.toHaveDataPropertySatisfying("message", (v) => {
          if (v !== "goodbye") throw new Error("Must be goodbye");
        })
      ).message,
    );
  });
});

Deno.test("createObjectValueMixin - toHaveUserMatching with source context", async (t) => {
  await t.step("fail (noColor)", async () => {
    const mixin = createObjectValueMixin(
      () => ({ name: "Alice", age: 30 }),
      () => false,
      {
        valueName: "user",
        expectOrigin: { path: testFilePath, line: 236, column: 5 },
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveUserMatching({ name: "Bob" })).message,
    );
  });

  await t.step("fail (withColor)", async () => {
    const mixin = createObjectValueMixin(
      () => ({ name: "Alice", age: 30 }),
      () => false,
      {
        valueName: "user",
        expectOrigin: { path: testFilePath, line: 251, column: 5 },
        theme: colorTheme,
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshot(
      t,
      catchError(() => applied.toHaveUserMatching({ name: "Bob" })).message,
    );
  });
});
