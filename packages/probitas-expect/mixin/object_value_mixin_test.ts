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

  await t.step("success - nested property with dot notation", () => {
    const mixin = createObjectValueMixin(
      () => ({ user: { address: { city: "Tokyo" } } }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveDataProperty("user.address.city"), applied);
  });

  await t.step("success - nested property with array notation", () => {
    const mixin = createObjectValueMixin(
      () => ({ user: { address: { city: "Tokyo" } } }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(
      applied.toHaveDataProperty(["user", "address", "city"]),
      applied,
    );
  });

  await t.step("success - nested property with value", () => {
    const mixin = createObjectValueMixin(
      () => ({ user: { address: { city: "Tokyo" } } }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(
      applied.toHaveDataProperty("user.address.city", "Tokyo"),
      applied,
    );
  });

  await t.step("success - property name with dot using array notation", () => {
    const mixin = createObjectValueMixin(
      () => ({ "user.name": "Alice", age: 30 }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveDataProperty(["user.name"]), applied);
  });

  await t.step(
    "success - property name with dot and value using array notation",
    () => {
      const mixin = createObjectValueMixin(
        () => ({ "user.name": "Alice", age: 30 }),
        () => false,
        { valueName: "data" },
      );
      const applied = mixin({ dummy: true });
      assertEquals(
        applied.toHaveDataProperty(["user.name"], "Alice"),
        applied,
      );
    },
  );

  await t.step("success - numeric key using array notation", () => {
    const mixin = createObjectValueMixin(
      () => ({ items: { 0: "first", 1: "second" } }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(
      applied.toHaveDataProperty(["items", "0"], "first"),
      applied,
    );
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

  await t.step("fail - nested property missing", async () => {
    const mixin = createObjectValueMixin(
      () => ({ user: { address: { city: "Tokyo" } } }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveDataProperty("user.address.country"))
        .message,
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

  await t.step("fail - nested property value mismatch", async () => {
    const mixin = createObjectValueMixin(
      () => ({ user: { address: { city: "Tokyo" } } }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveDataProperty("user.address.city", "Osaka"))
        .message,
    );
  });

  await t.step(
    "fail - property name with dot using string notation",
    async () => {
      const mixin = createObjectValueMixin(
        () => ({ "user.name": "Alice", age: 30 }),
        () => false,
        { valueName: "data" },
      );
      const applied = mixin({ dummy: true });
      await assertSnapshotWithoutColors(
        t,
        catchError(() => applied.toHaveDataProperty("user.name")).message,
      );
    },
  );
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

  await t.step("success - nested property", () => {
    const mixin = createObjectValueMixin(
      () => ({ user: { tags: ["admin", "developer"] } }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(
      applied.toHaveDataPropertyContaining("user.tags", "admin"),
      applied,
    );
  });

  await t.step("success - property with dot using array notation", () => {
    const mixin = createObjectValueMixin(
      () => ({ "config.env": "production" }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(
      applied.toHaveDataPropertyContaining(["config.env"], "prod"),
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

  await t.step("fail - nested property", async () => {
    const mixin = createObjectValueMixin(
      () => ({ user: { tags: ["admin", "developer"] } }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() =>
        applied.toHaveDataPropertyContaining("user.tags", "guest")
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

  await t.step("success - nested property", () => {
    const mixin = createObjectValueMixin(
      () => ({
        server: {
          database: { host: "localhost", port: 5432, name: "testdb" },
        },
      }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(
      applied.toHaveDataPropertyMatching("server.database", {
        host: "localhost",
      }),
      applied,
    );
  });

  await t.step("success - property with dot using array notation", () => {
    const mixin = createObjectValueMixin(
      () => ({ "server.config": { timeout: 5000, retries: 3 } }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(
      applied.toHaveDataPropertyMatching(["server.config"], { timeout: 5000 }),
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

  await t.step("fail - nested property", async () => {
    const mixin = createObjectValueMixin(
      () => ({
        server: {
          database: { host: "localhost", port: 5432 },
        },
      }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() =>
        applied.toHaveDataPropertyMatching("server.database", {
          port: 3306,
        })
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

  await t.step("success - nested property", () => {
    const mixin = createObjectValueMixin(
      () => ({ user: { profile: { age: 25 } } }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(
      applied.toHaveDataPropertySatisfying("user.profile.age", (v) => {
        if (typeof v !== "number") throw new Error("Must be number");
        if (v < 18) throw new Error("Must be 18 or older");
      }),
      applied,
    );
  });

  await t.step("success - property with dot using array notation", () => {
    const mixin = createObjectValueMixin(
      () => ({ "user.id": "12345" }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    assertEquals(
      applied.toHaveDataPropertySatisfying(["user.id"], (v) => {
        if (typeof v !== "string") throw new Error("Must be string");
        if (!/^\d+$/.test(v)) throw new Error("Must be numeric string");
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

  await t.step("fail - nested property", async () => {
    const mixin = createObjectValueMixin(
      () => ({ user: { profile: { age: 15 } } }),
      () => false,
      { valueName: "data" },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() =>
        applied.toHaveDataPropertySatisfying("user.profile.age", (v) => {
          if (v < 18) throw new Error("Must be 18 or older");
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
