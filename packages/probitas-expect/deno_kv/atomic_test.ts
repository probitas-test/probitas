import { expectDenoKvAtomicResult } from "./atomic.ts";
import { mockDenoKvAtomicResult } from "./_test_utils.ts";

Deno.test("expectDenoKvAtomicResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectDenoKvAtomicResult(mockDenoKvAtomicResult({ ok: true }))
      .toBeSuccessful();
  });

  await t.step("toHaveVersionstamp", () => {
    expectDenoKvAtomicResult(mockDenoKvAtomicResult({ versionstamp: "v1" }))
      .toHaveVersionstamp();
  });

  await t.step("duration methods", () => {
    expectDenoKvAtomicResult(mockDenoKvAtomicResult({ duration: 50 }))
      .toHaveDurationLessThan(100);
  });
});
