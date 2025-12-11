import { expectDenoKvDeleteResult } from "./delete.ts";
import { mockDenoKvDeleteResult } from "./_test_utils.ts";

Deno.test("expectDenoKvDeleteResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectDenoKvDeleteResult(mockDenoKvDeleteResult({ ok: true }))
      .toBeSuccessful();
  });

  await t.step("duration methods", () => {
    expectDenoKvDeleteResult(mockDenoKvDeleteResult({ duration: 50 }))
      .toHaveDurationLessThan(100);
  });
});
