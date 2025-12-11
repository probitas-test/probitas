import { expectDenoKvSetResult } from "./set.ts";
import { mockDenoKvSetResult } from "./_test_utils.ts";

Deno.test("expectDenoKvSetResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectDenoKvSetResult(mockDenoKvSetResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveVersionstamp", () => {
    expectDenoKvSetResult(mockDenoKvSetResult({ versionstamp: "v1" }))
      .toHaveVersionstamp();
  });

  await t.step("duration methods", () => {
    expectDenoKvSetResult(mockDenoKvSetResult({ duration: 50 }))
      .toHaveDurationLessThan(100);
  });
});
