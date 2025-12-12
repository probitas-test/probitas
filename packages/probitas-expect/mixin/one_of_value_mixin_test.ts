import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { assertSnapshot } from "@std/testing/snapshot";
import { catchError } from "../utils.ts";
import { createOneOfValueMixin } from "./one_of_value_mixin.ts";

Deno.test("createOneOfValueMixin - type check", () => {
  const mixin = createOneOfValueMixin(() => 200, () => false, {
    valueName: "status",
  });
  const applied = mixin({ dummy: true });
  type Expected = {
    dummy: boolean;
    toHaveStatusOneOf: (this: Expected, values: unknown[]) => Expected;
  };
  type Actual = typeof applied;
  assertType<IsExact<Actual, Expected>>(true);
});

Deno.test("createOkMixin - attribute check", () => {
  const applier = createOneOfValueMixin(() => 200, () => false, {
    valueName: "status",
  });
  const applied = applier({ dummy: true });
  const expected = [
    "dummy",
    "toHaveStatusOneOf",
  ];
  assertEquals(Object.getOwnPropertyNames(applied).sort(), expected.sort());
});

Deno.test("applyOneOfValueMixin - toHaveStatusOneOf", async (t) => {
  await t.step("success", () => {
    const mixin = createOneOfValueMixin(() => 200, () => false, {
      valueName: "status",
    });
    const applied = mixin({ dummy: true });
    assertEquals(applied.toHaveStatusOneOf([200, 201]), applied);
  });

  await t.step("fail", async () => {
    const mixin = createOneOfValueMixin(() => 500, () => false, {
      valueName: "status",
    });
    const applied = mixin({ dummy: true });
    await assertSnapshot(
      t,
      catchError(() => applied.toHaveStatusOneOf([200, 201])).message,
    );
  });
});
