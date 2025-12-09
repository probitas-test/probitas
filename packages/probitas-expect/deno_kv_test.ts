import { assertThrows } from "@std/assert";
import { expectDenoKvResult } from "./deno_kv.ts";
import type {
  DenoKvAtomicResult,
  DenoKvDeleteResult,
  DenoKvEntries,
  DenoKvEntry,
  DenoKvGetResult,
  DenoKvListResult,
  DenoKvSetResult,
} from "@probitas/client-deno-kv";

// Helper to create DenoKvEntries (array with helper methods)
function createMockDenoKvEntries<T>(
  entries: DenoKvEntry<T>[],
): DenoKvEntries<T> {
  const arr = [...entries] as DenoKvEntry<T>[] & {
    first(): DenoKvEntry<T> | undefined;
    firstOrThrow(): DenoKvEntry<T>;
    last(): DenoKvEntry<T> | undefined;
    lastOrThrow(): DenoKvEntry<T>;
  };
  arr.first = function () {
    return this[0];
  };
  arr.firstOrThrow = function () {
    if (this.length === 0) throw new Error("No entries available");
    return this[0];
  };
  arr.last = function () {
    return this[this.length - 1];
  };
  arr.lastOrThrow = function () {
    if (this.length === 0) throw new Error("No entries available");
    return this[this.length - 1];
  };
  return arr as unknown as DenoKvEntries<T>;
}

// Mock helpers
const mockDenoKvGetResult = <T>(
  overrides: Partial<DenoKvGetResult<T>> = {},
): DenoKvGetResult<T> => ({
  type: "deno-kv:get" as const,
  ok: true,
  key: ["users", "1"],
  value: { name: "Alice" } as T,
  versionstamp: "v1",
  duration: 100,
  ...overrides,
});

const mockDenoKvListResult = <T>(
  overrides: Partial<Omit<DenoKvListResult<T>, "entries">> & {
    entries?: DenoKvEntry<T>[];
  } = {},
): DenoKvListResult<T> => {
  const { entries: rawEntries, ...rest } = overrides;
  const defaultEntries: DenoKvEntry<T>[] = [
    { key: ["users", "1"], value: { name: "Alice" } as T, versionstamp: "v1" },
  ];
  return {
    type: "deno-kv:list" as const,
    ok: true,
    entries: createMockDenoKvEntries(rawEntries ?? defaultEntries),
    duration: 100,
    ...rest,
  };
};

const mockDenoKvSetResult = (
  overrides: Partial<DenoKvSetResult> = {},
): DenoKvSetResult => ({
  type: "deno-kv:set" as const,
  ok: true,
  versionstamp: "v1",
  duration: 100,
  ...overrides,
});

const mockDenoKvDeleteResult = (
  overrides: Partial<DenoKvDeleteResult> = {},
): DenoKvDeleteResult => ({
  type: "deno-kv:delete" as const,
  ok: true,
  duration: 100,
  ...overrides,
});

const mockDenoKvAtomicResult = (
  overrides: Partial<DenoKvAtomicResult> = {},
): DenoKvAtomicResult => ({
  type: "deno-kv:atomic" as const,
  ok: true,
  versionstamp: "v1",
  duration: 100,
  ...overrides,
});

Deno.test("expectDenoKvResult - DenoKvGetResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectDenoKvResult(mockDenoKvGetResult({ ok: true })).toBeSuccessful();
    assertThrows(
      () =>
        expectDenoKvResult(mockDenoKvGetResult({ ok: false })).toBeSuccessful(),
      Error,
    );
  });

  await t.step("toHaveContent", () => {
    expectDenoKvResult(mockDenoKvGetResult()).toHaveContent();
    assertThrows(
      () =>
        expectDenoKvResult(mockDenoKvGetResult({ value: null }))
          .toHaveContent(),
      Error,
    );
    expectDenoKvResult(mockDenoKvGetResult({ value: null })).not
      .toHaveContent();
  });

  await t.step("toHaveValue", () => {
    expectDenoKvResult(mockDenoKvGetResult({ value: { name: "Alice" } }))
      .toHaveValue({ name: "Alice" });
    assertThrows(
      () =>
        expectDenoKvResult(mockDenoKvGetResult()).toHaveValue({ name: "Bob" }),
      Error,
    );
  });

  await t.step("toMatchObject", () => {
    expectDenoKvResult(
      mockDenoKvGetResult({ value: { name: "Alice", age: 30 } }),
    ).toMatchObject({ name: "Alice" });
    assertThrows(
      () =>
        expectDenoKvResult(mockDenoKvGetResult()).toMatchObject({
          name: "Bob",
        }),
      Error,
    );
  });

  await t.step("toSatisfy", () => {
    expectDenoKvResult(mockDenoKvGetResult<{ name: string }>()).toSatisfy(
      (value: unknown) => {
        const v = value as { name: string };
        if (v.name !== "Alice") throw new Error("Expected Alice");
      },
    );
    assertThrows(
      () =>
        expectDenoKvResult(mockDenoKvGetResult<{ name: string }>()).toSatisfy(
          (value: unknown) => {
            const v = value as { name: string };
            if (v.name !== "Bob") throw new Error("Expected Bob");
          },
        ),
      Error,
      "Expected Bob",
    );
  });

  await t.step("toHaveVersionstamp", () => {
    expectDenoKvResult(mockDenoKvGetResult({ versionstamp: "v1" }))
      .toHaveVersionstamp();
    assertThrows(
      () =>
        expectDenoKvResult(mockDenoKvGetResult({ versionstamp: null }))
          .toHaveVersionstamp(),
      Error,
    );
  });

  await t.step("duration methods", () => {
    expectDenoKvResult(mockDenoKvGetResult({ duration: 50 }))
      .toHaveDurationLessThan(100)
      .toHaveDurationLessThanOrEqual(50)
      .toHaveDurationGreaterThan(25)
      .toHaveDurationGreaterThanOrEqual(50);
  });
});

Deno.test("expectDenoKvResult - DenoKvListResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectDenoKvResult(mockDenoKvListResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveContent", () => {
    expectDenoKvResult(mockDenoKvListResult()).toHaveContent();
    expectDenoKvResult(mockDenoKvListResult({ entries: [] })).not
      .toHaveContent();
  });

  await t.step("toHaveLength", () => {
    expectDenoKvResult(mockDenoKvListResult({
      entries: [
        { key: ["a"], value: {}, versionstamp: "v1" },
        { key: ["b"], value: {}, versionstamp: "v2" },
      ],
    })).toHaveLength(2);
  });

  await t.step("toHaveLengthGreaterThanOrEqual", () => {
    expectDenoKvResult(mockDenoKvListResult()).toHaveLengthGreaterThanOrEqual(
      1,
    );
  });

  await t.step("toHaveLengthLessThanOrEqual", () => {
    expectDenoKvResult(mockDenoKvListResult()).toHaveLengthLessThanOrEqual(5);
  });

  await t.step("toHaveEntryContaining", () => {
    expectDenoKvResult(mockDenoKvListResult()).toHaveEntryContaining({
      key: ["users", "1"],
    });
    expectDenoKvResult(mockDenoKvListResult()).toHaveEntryContaining({
      value: { name: "Alice" },
    });
  });

  await t.step("toSatisfy", () => {
    expectDenoKvResult(mockDenoKvListResult()).toSatisfy((entries) => {
      if (entries.length !== 1) throw new Error("Expected 1 entry");
    });
  });
});

Deno.test("expectDenoKvResult - DenoKvSetResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectDenoKvResult(mockDenoKvSetResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveVersionstamp", () => {
    expectDenoKvResult(mockDenoKvSetResult({ versionstamp: "v1" }))
      .toHaveVersionstamp();
  });

  await t.step("duration methods", () => {
    expectDenoKvResult(mockDenoKvSetResult({ duration: 50 }))
      .toHaveDurationLessThan(100);
  });
});

Deno.test("expectDenoKvResult - DenoKvDeleteResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectDenoKvResult(mockDenoKvDeleteResult({ ok: true })).toBeSuccessful();
  });

  await t.step("duration methods", () => {
    expectDenoKvResult(mockDenoKvDeleteResult({ duration: 50 }))
      .toHaveDurationLessThan(100);
  });
});

Deno.test("expectDenoKvResult - DenoKvAtomicResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectDenoKvResult(mockDenoKvAtomicResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveVersionstamp", () => {
    expectDenoKvResult(mockDenoKvAtomicResult({ versionstamp: "v1" }))
      .toHaveVersionstamp();
  });

  await t.step("duration methods", () => {
    expectDenoKvResult(mockDenoKvAtomicResult({ duration: 50 }))
      .toHaveDurationLessThan(100);
  });
});
