import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { assertSnapshot } from "@std/testing/snapshot";
import { catchError } from "../utils.ts";
import { createOkMixin } from "./ok_mixin.ts";

Deno.test("createOkMixin - type check", () => {
  const applier = createOkMixin(() => true, () => false, {
    valueName: "response",
  });
  const applied = applier({ dummy: true });
  type Expected = {
    dummy: boolean;
    toBeOk: (this: Expected) => Expected;
  };
  type Actual = typeof applied;
  assertType<IsExact<Actual, Expected>>(true);
});

Deno.test("createOkMixin - attribute check", () => {
  const applier = createOkMixin(() => true, () => false, {
    valueName: "response",
  });
  const applied = applier({ dummy: true });
  const expected = [
    "dummy",
    "toBeOk",
  ];
  assertEquals(Object.getOwnPropertyNames(applied).sort(), expected.sort());
});

Deno.test("createOkMixin - toBeOk", async (t) => {
  await t.step("success", () => {
    const applier = createOkMixin(() => true, () => false, {
      valueName: "response",
    });
    const applied = applier({ dummy: true });
    assertEquals(applied.toBeOk(), applied);
  });

  await t.step("fail", async () => {
    const applier = createOkMixin(() => false, () => false, {
      valueName: "response",
    });
    const applied = applier({ dummy: true });
    await assertSnapshot(t, catchError(() => applied.toBeOk()).message);
  });
});
