import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { assertType, type IsExact } from "@std/testing/types";
import { colorTheme } from "@probitas/core/theme";
import { catchError } from "../utils.ts";
import { assertSnapshotWithoutColors } from "./_testutils.ts";
import { createBooleanValueMixin } from "./boolean_value_mixin.ts";

const testFilePath = new URL(import.meta.url).pathname;

Deno.test("createBooleanValueMixin - type check", () => {
  const mixin = createBooleanValueMixin(() => true, () => false, {
    valueName: "value",
  });
  const applied = mixin({ dummy: true });
  type Expected = {
    dummy: boolean;
    toHaveValueTruthy: (this: Expected) => Expected;
    toHaveValueFalsy: (this: Expected) => Expected;
  };
  type Actual = typeof applied;
  assertType<IsExact<Actual, Expected>>(true);
});

Deno.test("createBooleanValueMixin - attribute check", () => {
  const applier = createBooleanValueMixin(() => true, () => false, {
    valueName: "value",
  });
  const applied = applier({ dummy: true });
  const expected = [
    "dummy",
    "toHaveValueTruthy",
    "toHaveValueFalsy",
  ];
  assertEquals(Object.getOwnPropertyNames(applied).sort(), expected.sort());
});

Deno.test("createBooleanValueMixin - toHaveValueTruthy", async (t) => {
  await t.step("success", () => {
    const mixin = createBooleanValueMixin(() => 1, () => false, {
      valueName: "value",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveValueTruthy(), applied);
  });

  await t.step("fail", async () => {
    const mixin = createBooleanValueMixin(() => 0, () => false, {
      valueName: "value",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveValueTruthy()).message,
    );
  });
});

Deno.test("createBooleanValueMixin - toHaveValueFalsy", async (t) => {
  await t.step("success", () => {
    const mixin = createBooleanValueMixin(() => "", () => false, {
      valueName: "value",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveValueFalsy(), applied);
  });

  await t.step("fail", async () => {
    const mixin = createBooleanValueMixin(() => "hello", () => false, {
      valueName: "value",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveValueFalsy()).message,
    );
  });
});

Deno.test("createBooleanValueMixin - toHaveValueTruthy with source context", async (t) => {
  await t.step("fail (noColor)", async () => {
    const mixin = createBooleanValueMixin(() => 0, () => false, {
      valueName: "value",
      expectOrigin: { path: testFilePath, line: 82, column: 5 },
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveValueTruthy()).message,
    );
  });

  await t.step("fail (withColor)", async () => {
    const mixin = createBooleanValueMixin(() => 0, () => false, {
      valueName: "value",
      expectOrigin: { path: testFilePath, line: 94, column: 5 },
      theme: colorTheme,
    });
    const applied = mixin({ dummy: true });
    await assertSnapshot(
      t,
      catchError(() => applied.toHaveValueTruthy()).message,
    );
  });
});
