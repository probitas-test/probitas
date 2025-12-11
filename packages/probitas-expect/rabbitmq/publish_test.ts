import { assertThrows } from "@std/assert";
import { expectRabbitMqPublishResult } from "./publish.ts";
import { mockRabbitMqPublishResult } from "./_test_utils.ts";

Deno.test("expectRabbitMqPublishResult", async (t) => {
  await t.step("toBeSuccessful", async (t) => {
    await t.step("passes when ok is true", () => {
      const result = mockRabbitMqPublishResult({ ok: true });
      expectRabbitMqPublishResult(result).toBeSuccessful();
    });

    await t.step("fails when ok is false", () => {
      const result = mockRabbitMqPublishResult({ ok: false });
      assertThrows(
        () => expectRabbitMqPublishResult(result).toBeSuccessful(),
        Error,
        "Expected ok result, but ok is false",
      );
    });
  });

  await t.step("duration methods", () => {
    const result = mockRabbitMqPublishResult({ duration: 50 });
    expectRabbitMqPublishResult(result)
      .toHaveDurationLessThan(100)
      .toHaveDurationLessThanOrEqual(50)
      .toHaveDurationGreaterThan(25)
      .toHaveDurationGreaterThanOrEqual(50);
  });
});
