import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { assertType, type IsExact } from "@std/testing/types";
import { colorTheme } from "@probitas/core/theme";
import { catchError } from "../utils.ts";
import { assertSnapshotWithoutColors } from "./_testutils.ts";
import { createValueMixin } from "./value_mixin.ts";

const testFilePath = new URL(import.meta.url).pathname;

Deno.test("createValueMixin - type check", () => {
  const mixin = createValueMixin(() => 200, () => false, {
    valueName: "status",
  });
  const applied = mixin({ dummy: true });
  type Expected = {
    dummy: boolean;
    toHaveStatus: (this: Expected, expected: unknown) => Expected;
    toHaveStatusEqual: (this: Expected, expected: unknown) => Expected;
    toHaveStatusStrictEqual: (this: Expected, expected: unknown) => Expected;
    toHaveStatusSatisfying: (
      this: Expected,
      matcher: (value: number) => void,
    ) => Expected;
  };
  type Actual = typeof applied;
  assertType<IsExact<Actual, Expected>>(true);
});

Deno.test("createValueMixin - attribute check", () => {
  const applier = createValueMixin(() => 200, () => false, {
    valueName: "status",
  });
  const applied = applier({ dummy: true });
  const expected = [
    "dummy",
    "toHaveStatus",
    "toHaveStatusEqual",
    "toHaveStatusStrictEqual",
    "toHaveStatusSatisfying",
  ];
  assertEquals(Object.getOwnPropertyNames(applied).sort(), expected.sort());
});

Deno.test("createValueMixin - toHaveStatus", async (t) => {
  await t.step("success", () => {
    const mixin = createValueMixin(() => 200, () => false, {
      valueName: "status",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveStatus(200), applied);
  });

  await t.step("fail", async () => {
    const mixin = createValueMixin(() => 200, () => false, {
      valueName: "status",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveStatus(404)).message,
    );
  });
});

Deno.test("createValueMixin - toHaveStatusEqual", async (t) => {
  await t.step("success", () => {
    const mixin = createValueMixin(() => ({ x: 1 }), () => false, {
      valueName: "data",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveDataEqual({ x: 1, y: undefined }), applied);
  });

  await t.step("fail", async () => {
    const mixin = createValueMixin(() => ({ x: 1 }), () => false, {
      valueName: "data",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveDataEqual({ x: 2 })).message,
    );
  });
});

Deno.test("createValueMixin - toHaveStatusStrictEqual", async (t) => {
  await t.step("success", () => {
    const mixin = createValueMixin(() => 200, () => false, {
      valueName: "status",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveStatusStrictEqual(200), applied);
  });

  await t.step("fail", async () => {
    const mixin = createValueMixin(() => ({ x: 1 }), () => false, {
      valueName: "data",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveDataStrictEqual({ x: 1, y: undefined }))
        .message,
    );
  });
});

Deno.test("createValueMixin - toHaveStatusSatisfying", async (t) => {
  await t.step("success", () => {
    const mixin = createValueMixin(() => 200, () => false, {
      valueName: "status",
    });
    const applied = mixin({ dummy: true });
    assertEquals(
      applied.toHaveStatusSatisfying((v) => {
        if (v !== 200) throw new Error("Must be 200");
      }),
      applied,
    );
  });

  await t.step("fail", async () => {
    const mixin = createValueMixin(() => 200, () => false, {
      valueName: "status",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() =>
        applied.toHaveStatusSatisfying((v) => {
          if (v !== 404) throw new Error("Must be 404");
        })
      ).message,
    );
  });
});

Deno.test("createValueMixin - toHaveStatus with source context", async (t) => {
  await t.step("fail (noColor)", async () => {
    const mixin = createValueMixin(() => 200, () => false, {
      valueName: "status",
      expectOrigin: { path: testFilePath, line: 140, column: 5 },
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveStatus(404)).message,
    );
  });

  await t.step("fail (withColor)", async () => {
    const mixin = createValueMixin(() => 200, () => false, {
      valueName: "status",
      expectOrigin: { path: testFilePath, line: 152, column: 5 },
      theme: colorTheme,
    });
    const applied = mixin({ dummy: true });
    await assertSnapshot(
      t,
      catchError(() => applied.toHaveStatus(404)).message,
    );
  });
});
