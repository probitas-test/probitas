import { expectMongoFindOneResult } from "./find_one.ts";
import { mockMongoFindOneResult } from "./_test_utils.ts";

Deno.test("expectMongoFindOneResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectMongoFindOneResult(mockMongoFindOneResult({ ok: true }))
      .toBeSuccessful();
  });

  await t.step("toHaveContent", () => {
    expectMongoFindOneResult(mockMongoFindOneResult()).toHaveContent();
    expectMongoFindOneResult(mockMongoFindOneResult({ doc: undefined })).not
      .toHaveContent();
  });

  await t.step("toMatchObject", () => {
    expectMongoFindOneResult(mockMongoFindOneResult()).toMatchObject({
      name: "Alice",
    });
  });

  await t.step("toSatisfy", () => {
    expectMongoFindOneResult(
      mockMongoFindOneResult<{ id: string; name: string }>(),
    )
      .toSatisfy(
        (doc) => {
          if (doc.name !== "Alice") throw new Error("Expected Alice");
        },
      );
  });
});
