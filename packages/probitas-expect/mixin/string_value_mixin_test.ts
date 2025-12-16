import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { assertType, type IsExact } from "@std/testing/types";
import { colorTheme } from "@probitas/core/theme";
import { catchError } from "../utils.ts";
import { assertSnapshotWithoutColors } from "./_testutils.ts";
import { createStringValueMixin } from "./string_value_mixin.ts";

const testFilePath = new URL(import.meta.url).pathname;

Deno.test("createStringValueMixin - type check", () => {
  const mixin = createStringValueMixin(() => "hello world", () => false, {
    valueName: "message",
  });
  const applied = mixin({ dummy: true });
  type Expected = {
    dummy: boolean;
    toHaveMessageContaining: (this: Expected, substr: string) => Expected;
    toHaveMessageMatching: (this: Expected, expected: RegExp) => Expected;
  };
  type Actual = typeof applied;
  assertType<IsExact<Actual, Expected>>(true);
});

Deno.test("createStringValueMixin - attribute check", () => {
  const applier = createStringValueMixin(() => "hello world", () => false, {
    valueName: "message",
  });
  const applied = applier({ dummy: true });
  const expected = [
    "dummy",
    "toHaveMessageContaining",
    "toHaveMessageMatching",
  ];
  assertEquals(Object.getOwnPropertyNames(applied).sort(), expected.sort());
});

Deno.test("createStringValueMixin - toHaveMessageContaining", async (t) => {
  await t.step("success", () => {
    const mixin = createStringValueMixin(() => "hello world", () => false, {
      valueName: "message",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveMessageContaining("hello"), applied);
  });

  await t.step("fail", async () => {
    const mixin = createStringValueMixin(() => "goodbye world", () => false, {
      valueName: "message",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveMessageContaining("hello")).message,
    );
  });
});

Deno.test("createStringValueMixin - toHaveMessageMatching", async (t) => {
  await t.step("success", () => {
    const mixin = createStringValueMixin(() => "hello world", () => false, {
      valueName: "message",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveMessageMatching(/hello/), applied);
  });

  await t.step("fail", async () => {
    const mixin = createStringValueMixin(() => "goodbye world", () => false, {
      valueName: "message",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveMessageMatching(/hello/)).message,
    );
  });
});

Deno.test("createStringValueMixin - toHaveMessageContaining with source context", async (t) => {
  await t.step("fail (noColor)", async () => {
    const mixin = createStringValueMixin(() => "goodbye world", () => false, {
      valueName: "message",
      expectOrigin: { path: testFilePath, line: 82, column: 5 },
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveMessageContaining("hello")).message,
    );
  });

  await t.step("fail (withColor)", async () => {
    const mixin = createStringValueMixin(() => "goodbye world", () => false, {
      valueName: "message",
      expectOrigin: { path: testFilePath, line: 94, column: 5 },
      theme: colorTheme,
    });
    const applied = mixin({ dummy: true });
    await assertSnapshot(
      t,
      catchError(() => applied.toHaveMessageContaining("hello")).message,
    );
  });
});
