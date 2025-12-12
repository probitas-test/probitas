import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { assertSnapshot } from "@std/testing/snapshot";
import { catchError } from "../utils.ts";
import { createValueMixin } from "./value_mixin.ts";

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
      matcher: (value: unknown) => void,
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
    await assertSnapshot(
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
    await assertSnapshot(
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
    await assertSnapshot(
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
    await assertSnapshot(
      t,
      catchError(() =>
        applied.toHaveStatusSatisfying((v) => {
          if (v !== 404) throw new Error("Must be 404");
        })
      ).message,
    );
  });
});
