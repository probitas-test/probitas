import { expectMongoUpdateResult } from "./update.ts";
import { mockMongoUpdateResult } from "./_test_utils.ts";

Deno.test("expectMongoUpdateResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectMongoUpdateResult(mockMongoUpdateResult({ ok: true }))
      .toBeSuccessful();
  });

  await t.step("toHaveMatchedCount", () => {
    expectMongoUpdateResult(mockMongoUpdateResult({ matchedCount: 2 }))
      .toHaveMatchedCount(2);
  });

  await t.step("toHaveMatchedCountGreaterThan", () => {
    expectMongoUpdateResult(mockMongoUpdateResult({ matchedCount: 5 }))
      .toHaveMatchedCountGreaterThan(2);
  });

  await t.step("toHaveMatchedCountGreaterThanOrEqual", () => {
    expectMongoUpdateResult(mockMongoUpdateResult({ matchedCount: 5 }))
      .toHaveMatchedCountGreaterThanOrEqual(5);
  });

  await t.step("toHaveMatchedCountLessThan", () => {
    expectMongoUpdateResult(mockMongoUpdateResult({ matchedCount: 2 }))
      .toHaveMatchedCountLessThan(5);
  });

  await t.step("toHaveMatchedCountLessThanOrEqual", () => {
    expectMongoUpdateResult(mockMongoUpdateResult({ matchedCount: 5 }))
      .toHaveMatchedCountLessThanOrEqual(5);
  });

  await t.step("toHaveModifiedCount", () => {
    expectMongoUpdateResult(mockMongoUpdateResult({ modifiedCount: 3 }))
      .toHaveModifiedCount(3);
  });

  await t.step("toHaveModifiedCountGreaterThan", () => {
    expectMongoUpdateResult(mockMongoUpdateResult({ modifiedCount: 5 }))
      .toHaveModifiedCountGreaterThan(2);
  });

  await t.step("toHaveModifiedCountGreaterThanOrEqual", () => {
    expectMongoUpdateResult(mockMongoUpdateResult({ modifiedCount: 5 }))
      .toHaveModifiedCountGreaterThanOrEqual(5);
  });

  await t.step("toHaveModifiedCountLessThan", () => {
    expectMongoUpdateResult(mockMongoUpdateResult({ modifiedCount: 2 }))
      .toHaveModifiedCountLessThan(5);
  });

  await t.step("toHaveModifiedCountLessThanOrEqual", () => {
    expectMongoUpdateResult(mockMongoUpdateResult({ modifiedCount: 5 }))
      .toHaveModifiedCountLessThanOrEqual(5);
  });

  await t.step("toHaveUpsertedId", () => {
    expectMongoUpdateResult(mockMongoUpdateResult({ upsertedId: "456" }))
      .toHaveUpsertedId();
  });
});
