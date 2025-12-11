import { assertThrows } from "@std/assert";
import { expectDenoKvGetResult } from "./get.ts";
import { mockDenoKvGetResult } from "./_test_utils.ts";

Deno.test("expectDenoKvGetResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectDenoKvGetResult(mockDenoKvGetResult({ ok: true })).toBeSuccessful();
    assertThrows(
      () =>
        expectDenoKvGetResult(mockDenoKvGetResult({ ok: false }))
          .toBeSuccessful(),
      Error,
    );
  });

  await t.step("toHaveContent", () => {
    expectDenoKvGetResult(mockDenoKvGetResult()).toHaveContent();
    assertThrows(
      () =>
        expectDenoKvGetResult(mockDenoKvGetResult({ value: null }))
          .toHaveContent(),
      Error,
    );
    expectDenoKvGetResult(mockDenoKvGetResult({ value: null })).not
      .toHaveContent();
  });

  await t.step("toHaveValue", () => {
    expectDenoKvGetResult(mockDenoKvGetResult({ value: { name: "Alice" } }))
      .toHaveValue({ name: "Alice" });
    assertThrows(
      () =>
        expectDenoKvGetResult(mockDenoKvGetResult()).toHaveValue({
          name: "Bob",
        }),
      Error,
    );
  });

  await t.step("toMatchObject", () => {
    expectDenoKvGetResult(
      mockDenoKvGetResult({ value: { name: "Alice", age: 30 } }),
    ).toMatchObject({ name: "Alice" });
    assertThrows(
      () =>
        expectDenoKvGetResult(mockDenoKvGetResult()).toMatchObject({
          name: "Bob",
        }),
      Error,
    );
  });

  await t.step("toSatisfy", () => {
    expectDenoKvGetResult(mockDenoKvGetResult<{ name: string }>()).toSatisfy(
      (value: unknown) => {
        const v = value as { name: string };
        if (v.name !== "Alice") throw new Error("Expected Alice");
      },
    );
    assertThrows(
      () =>
        expectDenoKvGetResult(mockDenoKvGetResult<{ name: string }>())
          .toSatisfy(
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
    expectDenoKvGetResult(mockDenoKvGetResult({ versionstamp: "v1" }))
      .toHaveVersionstamp();
    assertThrows(
      () =>
        expectDenoKvGetResult(mockDenoKvGetResult({ versionstamp: null }))
          .toHaveVersionstamp(),
      Error,
    );
  });

  await t.step("duration methods", () => {
    expectDenoKvGetResult(mockDenoKvGetResult({ duration: 50 }))
      .toHaveDurationLessThan(100)
      .toHaveDurationLessThanOrEqual(50)
      .toHaveDurationGreaterThan(25)
      .toHaveDurationGreaterThanOrEqual(50);
  });
});
