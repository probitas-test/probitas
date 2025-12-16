import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { assertType, type IsExact } from "@std/testing/types";
import { colorTheme } from "@probitas/core/theme";
import { catchError } from "../utils.ts";
import { assertSnapshotWithoutColors } from "./_testutils.ts";
import { createNumberValueMixin } from "./number_value_mixin.ts";

const testFilePath = new URL(import.meta.url).pathname;

Deno.test("createNumberValueMixin - type check", () => {
  const mixin = createNumberValueMixin(() => 100, () => false, {
    valueName: "score",
  });
  const applied = mixin({ dummy: true });
  type Expected = {
    dummy: boolean;
    toHaveScoreNaN: (this: Expected) => Expected;
    toHaveScoreGreaterThan: (this: Expected, expected: number) => Expected;
    toHaveScoreGreaterThanOrEqual: (
      this: Expected,
      expected: number,
    ) => Expected;
    toHaveScoreLessThan: (this: Expected, expected: number) => Expected;
    toHaveScoreLessThanOrEqual: (this: Expected, expected: number) => Expected;
    toHaveScoreCloseTo: (
      this: Expected,
      expected: number,
      numDigits?: number,
    ) => Expected;
  };
  type Actual = typeof applied;
  assertType<IsExact<Actual, Expected>>(true);
});

Deno.test("createNumberValueMixin - attribute check", () => {
  const applier = createNumberValueMixin(() => 100, () => false, {
    valueName: "score",
  });
  const applied = applier({ dummy: true });
  const expected = [
    "dummy",
    "toHaveScoreNaN",
    "toHaveScoreGreaterThan",
    "toHaveScoreGreaterThanOrEqual",
    "toHaveScoreLessThan",
    "toHaveScoreLessThanOrEqual",
    "toHaveScoreCloseTo",
  ];
  assertEquals(Object.getOwnPropertyNames(applied).sort(), expected.sort());
});

Deno.test("createNumberValueMixin - toHaveScoreNaN", async (t) => {
  await t.step("success", () => {
    const mixin = createNumberValueMixin(() => NaN, () => false, {
      valueName: "score",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveScoreNaN(), applied);
  });

  await t.step("fail", async () => {
    const mixin = createNumberValueMixin(() => 100, () => false, {
      valueName: "score",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveScoreNaN()).message,
    );
  });
});

Deno.test("createNumberValueMixin - toHaveScoreGreaterThan", async (t) => {
  await t.step("success", () => {
    const mixin = createNumberValueMixin(() => 100, () => false, {
      valueName: "score",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveScoreGreaterThan(50), applied);
  });

  await t.step("fail", async () => {
    const mixin = createNumberValueMixin(() => 100, () => false, {
      valueName: "score",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveScoreGreaterThan(200)).message,
    );
  });
});

Deno.test(
  "createNumberValueMixin - toHaveScoreGreaterThanOrEqual",
  async (t) => {
    await t.step("success", () => {
      const mixin = createNumberValueMixin(() => 100, () => false, {
        valueName: "score",
      });
      const applied = mixin({ dummy: true });
      assertEquals(applied.toHaveScoreGreaterThanOrEqual(100), applied);
    });

    await t.step("fail", async () => {
      const mixin = createNumberValueMixin(() => 100, () => false, {
        valueName: "score",
      });
      const applied = mixin({ dummy: true });
      await assertSnapshotWithoutColors(
        t,
        catchError(() => applied.toHaveScoreGreaterThanOrEqual(200)).message,
      );
    });
  },
);

Deno.test("createNumberValueMixin - toHaveScoreLessThan", async (t) => {
  await t.step("success", () => {
    const mixin = createNumberValueMixin(() => 100, () => false, {
      valueName: "score",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveScoreLessThan(150), applied);
  });

  await t.step("fail", async () => {
    const mixin = createNumberValueMixin(() => 100, () => false, {
      valueName: "score",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveScoreLessThan(50)).message,
    );
  });
});

Deno.test("createNumberValueMixin - toHaveScoreLessThanOrEqual", async (t) => {
  await t.step("success", () => {
    const mixin = createNumberValueMixin(() => 100, () => false, {
      valueName: "score",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveScoreLessThanOrEqual(100), applied);
  });

  await t.step("fail", async () => {
    const mixin = createNumberValueMixin(() => 100, () => false, {
      valueName: "score",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveScoreLessThanOrEqual(50)).message,
    );
  });
});

Deno.test("createNumberValueMixin - toHaveScoreCloseTo", async (t) => {
  await t.step("success", () => {
    const mixin = createNumberValueMixin(() => 0.1 + 0.2, () => false, {
      valueName: "score",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveScoreCloseTo(0.3, 1), applied);
  });

  await t.step("fail", async () => {
    const mixin = createNumberValueMixin(() => 100, () => false, {
      valueName: "score",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveScoreCloseTo(200, 2)).message,
    );
  });
});

Deno.test("createNumberValueMixin - toHaveScoreGreaterThan with source context", async (t) => {
  await t.step("fail (noColor)", async () => {
    const mixin = createNumberValueMixin(() => 100, () => false, {
      valueName: "score",
      expectOrigin: { path: testFilePath, line: 184, column: 5 },
    });
    const applied = mixin({ dummy: true });
    await assertSnapshotWithoutColors(
      t,
      catchError(() => applied.toHaveScoreGreaterThan(200)).message,
    );
  });

  await t.step("fail (withColor)", async () => {
    const mixin = createNumberValueMixin(() => 100, () => false, {
      valueName: "score",
      expectOrigin: { path: testFilePath, line: 196, column: 5 },
      theme: colorTheme,
    });
    const applied = mixin({ dummy: true });
    await assertSnapshot(
      t,
      catchError(() => applied.toHaveScoreGreaterThan(200)).message,
    );
  });
});
