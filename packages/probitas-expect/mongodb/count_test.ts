import { expectMongoCountResult } from "./count.ts";
import { mockMongoCountResult } from "./_test_utils.ts";

Deno.test("expectMongoCountResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectMongoCountResult(mockMongoCountResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveLength", () => {
    expectMongoCountResult(mockMongoCountResult({ count: 10 })).toHaveLength(
      10,
    );
  });

  await t.step("toHaveLengthGreaterThanOrEqual", () => {
    expectMongoCountResult(mockMongoCountResult({ count: 10 }))
      .toHaveLengthGreaterThanOrEqual(5);
  });

  await t.step("toHaveLengthLessThanOrEqual", () => {
    expectMongoCountResult(mockMongoCountResult({ count: 10 }))
      .toHaveLengthLessThanOrEqual(20);
  });
});
