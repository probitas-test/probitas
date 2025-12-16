import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { assertType, type IsExact } from "@std/testing/types";
import { colorTheme } from "@probitas/core/theme";
import { catchError } from "../utils.ts";
import { assertSnapshotWithoutColors } from "./_testutils.ts";
import { createNullishValueMixin } from "./nullish_value_mixin.ts";

const testFilePath = new URL(import.meta.url).pathname;

type Nullish<T> = T | null | undefined;

Deno.test("createNullishValueMixin - type check", () => {
  const mixin = createNullishValueMixin(
    () => null as number | null,
    () => false,
    {
      valueName: "value",
    },
  );
  const applied = mixin({ dummy: true });
  type Expected = {
    dummy: boolean;
    toHaveValueNull: (this: Expected) => Expected;
    toHaveValueUndefined: (this: Expected) => Expected;
    toHaveValueNullish: (this: Expected) => Expected;
    toHaveValuePresent: (this: Expected) => Expected;
  };
  type Actual = typeof applied;
  assertType<IsExact<Actual, Expected>>(true);
});

Deno.test("createNullishValueMixin - attribute check", () => {
  const applier = createNullishValueMixin(
    () => null as number | null,
    () => false,
    {
      valueName: "value",
    },
  );
  const applied = applier({ dummy: true });
  const expected = [
    "dummy",
    "toHaveValueNull",
    "toHaveValueUndefined",
    "toHaveValueNullish",
    "toHaveValuePresent",
  ];
  assertEquals(Object.getOwnPropertyNames(applied).sort(), expected.sort());
});

Deno.test("createNullishValueMixin - toHaveValueNull", async (t) => {
  await t.step("success", () => {
    const mixin = createNullishValueMixin(
      () => null as Nullish<number>,
      () => false,
      {
        valueName: "value",
      },
    );
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveValueNull(), applied);
  });

  await t.step("fail (undefined)", async () => {
    const mixin = createNullishValueMixin(
      () => undefined as Nullish<number>,
      () => false,
      {
        valueName: "value",
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveValueNull()).message,
    );
  });

  await t.step("fail (present)", async () => {
    const mixin = createNullishValueMixin(
      () => 200 as Nullish<number>,
      () => false,
      {
        valueName: "value",
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveValueNull()).message,
    );
  });
});

Deno.test("createNullishValueMixin - toHaveValueUndefined", async (t) => {
  await t.step("success", () => {
    const mixin = createNullishValueMixin(
      () => undefined as Nullish<number>,
      () => false,
      {
        valueName: "value",
      },
    );
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveValueUndefined(), applied);
  });

  await t.step("fail (null)", async () => {
    const mixin = createNullishValueMixin(
      () => null as Nullish<number>,
      () => false,
      {
        valueName: "value",
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveValueUndefined()).message,
    );
  });

  await t.step("fail (present)", async () => {
    const mixin = createNullishValueMixin(
      () => 200 as Nullish<number>,
      () => false,
      {
        valueName: "value",
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveValueUndefined()).message,
    );
  });
});

Deno.test("createNullishValueMixin - toHaveValueNullish", async (t) => {
  await t.step("success (null)", () => {
    const mixin = createNullishValueMixin(
      () => null as Nullish<number>,
      () => false,
      {
        valueName: "value",
      },
    );
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveValueNullish(), applied);
  });

  await t.step("success (undefined)", () => {
    const mixin = createNullishValueMixin(
      () => undefined as Nullish<number>,
      () => false,
      {
        valueName: "value",
      },
    );
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveValueNullish(), applied);
  });

  await t.step("fail (present)", async () => {
    const mixin = createNullishValueMixin(
      () => 200 as Nullish<number>,
      () => false,
      {
        valueName: "value",
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveValueNull()).message,
    );
  });
});

Deno.test("createNullishValueMixin - toHaveValuePresent", async (t) => {
  await t.step("success", () => {
    const mixin = createNullishValueMixin(
      () => 200 as Nullish<number>,
      () => false,
      {
        valueName: "value",
      },
    );
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveValuePresent(), applied);
  });

  await t.step("fail (null)", async () => {
    const mixin = createNullishValueMixin(
      () => null as Nullish<number>,
      () => false,
      {
        valueName: "value",
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveValuePresent()).message,
    );
  });

  await t.step("fail (undefined)", async () => {
    const mixin = createNullishValueMixin(
      () => undefined as Nullish<number>,
      () => false,
      {
        valueName: "value",
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveValuePresent()).message,
    );
  });
});

Deno.test("createNullishValueMixin - toHaveValueNull with source context", async (t) => {
  await t.step("fail (noColor)", async () => {
    const mixin = createNullishValueMixin(
      () => 200 as Nullish<number>,
      () => false,
      {
        valueName: "value",
        expectOrigin: { path: testFilePath, line: 228, column: 5 },
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveValueNull()).message,
    );
  });

  await t.step("fail (withColor)", async () => {
    const mixin = createNullishValueMixin(
      () => 200 as Nullish<number>,
      () => false,
      {
        valueName: "value",
        expectOrigin: { path: testFilePath, line: 243, column: 5 },
        theme: colorTheme,
      },
    );
    const applied = mixin({ dummy: true });
    await assertSnapshot(
      t,
      catchError(() => applied.toHaveValueNull()).message,
    );
  });
});
