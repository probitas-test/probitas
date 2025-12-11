import { expectMongoDeleteResult } from "./delete.ts";
import { mockMongoDeleteResult } from "./_test_utils.ts";

Deno.test("expectMongoDeleteResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectMongoDeleteResult(mockMongoDeleteResult({ ok: true }))
      .toBeSuccessful();
  });

  await t.step("toHaveDeletedCount", () => {
    expectMongoDeleteResult(mockMongoDeleteResult({ deletedCount: 2 }))
      .toHaveDeletedCount(2);
  });

  await t.step("toHaveDeletedCountGreaterThan", () => {
    expectMongoDeleteResult(mockMongoDeleteResult({ deletedCount: 5 }))
      .toHaveDeletedCountGreaterThan(2);
  });

  await t.step("toHaveDeletedCountGreaterThanOrEqual", () => {
    expectMongoDeleteResult(mockMongoDeleteResult({ deletedCount: 5 }))
      .toHaveDeletedCountGreaterThanOrEqual(5);
  });

  await t.step("toHaveDeletedCountLessThan", () => {
    expectMongoDeleteResult(mockMongoDeleteResult({ deletedCount: 2 }))
      .toHaveDeletedCountLessThan(5);
  });

  await t.step("toHaveDeletedCountLessThanOrEqual", () => {
    expectMongoDeleteResult(mockMongoDeleteResult({ deletedCount: 5 }))
      .toHaveDeletedCountLessThanOrEqual(5);
  });
});
