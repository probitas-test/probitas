import { expectMongoFindResult } from "./find.ts";
import { mockMongoFindResult } from "./_test_utils.ts";

Deno.test("expectMongoFindResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectMongoFindResult(mockMongoFindResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveContent", () => {
    expectMongoFindResult(mockMongoFindResult()).toHaveContent();
    expectMongoFindResult(mockMongoFindResult({ docs: [] })).not
      .toHaveContent();
  });

  await t.step("toHaveLength", () => {
    expectMongoFindResult(
      mockMongoFindResult({ docs: [{ id: "1" }, { id: "2" }] }),
    )
      .toHaveLength(2);
  });

  await t.step("toHaveLengthGreaterThanOrEqual", () => {
    expectMongoFindResult(
      mockMongoFindResult({ docs: [{ id: "1" }, { id: "2" }] }),
    )
      .toHaveLengthGreaterThanOrEqual(1);
  });

  await t.step("toHaveLengthLessThanOrEqual", () => {
    expectMongoFindResult(mockMongoFindResult({ docs: [{ id: "1" }] }))
      .toHaveLengthLessThanOrEqual(5);
  });

  await t.step("toMatchObject", () => {
    expectMongoFindResult(mockMongoFindResult()).toMatchObject({
      name: "Alice",
    });
  });

  await t.step("toSatisfy", () => {
    expectMongoFindResult(mockMongoFindResult()).toSatisfy((docs) => {
      if (docs.length !== 1) throw new Error("Expected 1 doc");
    });
  });

  await t.step("duration methods", () => {
    expectMongoFindResult(mockMongoFindResult({ duration: 50 }))
      .toHaveDurationLessThan(100);
  });
});
