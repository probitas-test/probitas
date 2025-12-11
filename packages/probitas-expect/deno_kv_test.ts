import { assertThrows } from "@std/assert";
import { expectDenoKvResult } from "./deno_kv.ts";
import {
  mockDenoKvAtomicResult,
  mockDenoKvDeleteResult,
  mockDenoKvGetResult,
  mockDenoKvListResult,
  mockDenoKvSetResult,
} from "./deno_kv/_test_utils.ts";

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
