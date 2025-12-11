import { expectMongoInsertResult } from "./insert.ts";
import { mockMongoInsertOneResult } from "./_test_utils.ts";

Deno.test("expectMongoInsertResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectMongoInsertResult(mockMongoInsertOneResult({ ok: true }))
      .toBeSuccessful();
  });

  await t.step("toHaveInsertedCount", () => {
    expectMongoInsertResult(mockMongoInsertOneResult()).toHaveInsertedCount(1);
  });

  await t.step("toHaveInsertedCountGreaterThan", () => {
    expectMongoInsertResult(mockMongoInsertOneResult())
      .toHaveInsertedCountGreaterThan(0);
  });

  await t.step("toHaveInsertedCountGreaterThanOrEqual", () => {
    expectMongoInsertResult(mockMongoInsertOneResult())
      .toHaveInsertedCountGreaterThanOrEqual(1);
  });

  await t.step("toHaveInsertedCountLessThan", () => {
    expectMongoInsertResult(mockMongoInsertOneResult())
      .toHaveInsertedCountLessThan(
        2,
      );
  });

  await t.step("toHaveInsertedCountLessThanOrEqual", () => {
    expectMongoInsertResult(mockMongoInsertOneResult())
      .toHaveInsertedCountLessThanOrEqual(1);
  });

  await t.step("toHaveInsertedId", () => {
    expectMongoInsertResult(mockMongoInsertOneResult({ insertedId: "123" }))
      .toHaveInsertedId();
  });
});
