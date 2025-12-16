import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { assertType, type IsExact } from "@std/testing/types";
import { colorTheme } from "@probitas/core/theme";
import { catchError } from "../utils.ts";
import { assertSnapshotWithoutColors } from "./_testutils.ts";
import { createOneOfValueMixin } from "./one_of_value_mixin.ts";

const testFilePath = new URL(import.meta.url).pathname;

Deno.test("createOneOfValueMixin - type check", () => {
  const mixin = createOneOfValueMixin(() => 200, () => false, {
    valueName: "status",
  });
  const applied = mixin({ dummy: true });
  type Expected = {
    dummy: boolean;
    toHaveStatusOneOf: (this: Expected, values: unknown[]) => Expected;
  };
  type Actual = typeof applied;
  assertType<IsExact<Actual, Expected>>(true);
});

Deno.test("createOkMixin - attribute check", () => {
  const applier = createOneOfValueMixin(() => 200, () => false, {
    valueName: "status",
  });
  const applied = applier({ dummy: true });
  const expected = [
    "dummy",
    "toHaveStatusOneOf",
  ];
  assertEquals(Object.getOwnPropertyNames(applied).sort(), expected.sort());
});

Deno.test("applyOneOfValueMixin - toHaveStatusOneOf", async (t) => {
  await t.step("success", () => {
    const mixin = createOneOfValueMixin(() => 200, () => false, {
      valueName: "status",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveStatusOneOf([200, 201]), applied);
  });

  await t.step("fail", async () => {
    const mixin = createOneOfValueMixin(() => 500, () => false, {
      valueName: "status",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveStatusOneOf([200, 201])).message,
    );
  });
});

Deno.test("createOneOfValueMixin - toHaveStatusOneOf with source context", async (t) => {
  await t.step("fail (noColor)", async () => {
    const mixin = createOneOfValueMixin(() => 500, () => false, {
      valueName: "status",
      expectOrigin: { path: testFilePath, line: 59, column: 5 },
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveStatusOneOf([200, 201])).message,
    );
  });

  await t.step("fail (withColor)", async () => {
    const mixin = createOneOfValueMixin(() => 500, () => false, {
      valueName: "status",
      expectOrigin: { path: testFilePath, line: 71, column: 5 },
      theme: colorTheme,
    });
    const applied = mixin({ dummy: true });
    await assertSnapshot(
      t,
      catchError(() => applied.toHaveStatusOneOf([200, 201])).message,
    );
  });
});
