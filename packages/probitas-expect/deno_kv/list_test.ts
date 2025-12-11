import { expectDenoKvListResult } from "./list.ts";
import { mockDenoKvListResult } from "./_test_utils.ts";

Deno.test("expectDenoKvListResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectDenoKvListResult(mockDenoKvListResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveContent", () => {
    expectDenoKvListResult(mockDenoKvListResult()).toHaveContent();
    expectDenoKvListResult(mockDenoKvListResult({ entries: [] })).not
      .toHaveContent();
  });

  await t.step("toHaveLength", () => {
    expectDenoKvListResult(mockDenoKvListResult({
      entries: [
        { key: ["a"], value: {}, versionstamp: "v1" },
        { key: ["b"], value: {}, versionstamp: "v2" },
      ],
    })).toHaveLength(2);
  });

  await t.step("toHaveLengthGreaterThanOrEqual", () => {
    expectDenoKvListResult(mockDenoKvListResult())
      .toHaveLengthGreaterThanOrEqual(1);
  });

  await t.step("toHaveLengthLessThanOrEqual", () => {
    expectDenoKvListResult(mockDenoKvListResult()).toHaveLengthLessThanOrEqual(
      5,
    );
  });

  await t.step("toHaveEntryContaining", () => {
    expectDenoKvListResult(mockDenoKvListResult()).toHaveEntryContaining({
      key: ["users", "1"],
    });
    expectDenoKvListResult(mockDenoKvListResult()).toHaveEntryContaining({
      value: { name: "Alice" },
    });
  });

  await t.step("toSatisfy", () => {
    expectDenoKvListResult(mockDenoKvListResult()).toSatisfy((entries) => {
      if (entries.length !== 1) throw new Error("Expected 1 entry");
    });
  });
});
