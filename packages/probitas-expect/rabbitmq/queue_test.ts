import { assertThrows } from "@std/assert";
import { expectRabbitMqQueueResult } from "./queue.ts";
import { mockRabbitMqQueueResult } from "./_test_utils.ts";

Deno.test("expectRabbitMqQueueResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    const result = mockRabbitMqQueueResult({ ok: true });
    expectRabbitMqQueueResult(result).toBeSuccessful();
  });

  await t.step("toHaveMessageCount", async (t) => {
    await t.step("passes for matching count", () => {
      const result = mockRabbitMqQueueResult({ messageCount: 10 });
      expectRabbitMqQueueResult(result).toHaveMessageCount(10);
    });

    await t.step("fails for non-matching count", () => {
      const result = mockRabbitMqQueueResult({ messageCount: 10 });
      assertThrows(
        () => expectRabbitMqQueueResult(result).toHaveMessageCount(5),
        Error,
        "Expected 5 message count, got 10",
      );
    });
  });

  await t.step("toHaveMessageCountGreaterThan", async (t) => {
    await t.step("passes when count is greater", () => {
      const result = mockRabbitMqQueueResult({ messageCount: 10 });
      expectRabbitMqQueueResult(result).toHaveMessageCountGreaterThan(5);
    });

    await t.step("fails when count is equal", () => {
      const result = mockRabbitMqQueueResult({ messageCount: 10 });
      assertThrows(
        () =>
          expectRabbitMqQueueResult(result).toHaveMessageCountGreaterThan(10),
        Error,
        "Expected message count > 10, but got 10",
      );
    });
  });

  await t.step("toHaveMessageCountGreaterThanOrEqual", () => {
    const result = mockRabbitMqQueueResult({ messageCount: 10 });
    expectRabbitMqQueueResult(result).toHaveMessageCountGreaterThanOrEqual(10);
    expectRabbitMqQueueResult(result).toHaveMessageCountGreaterThanOrEqual(5);
  });

  await t.step("toHaveMessageCountLessThan", () => {
    const result = mockRabbitMqQueueResult({ messageCount: 5 });
    expectRabbitMqQueueResult(result).toHaveMessageCountLessThan(10);
  });

  await t.step("toHaveMessageCountLessThanOrEqual", () => {
    const result = mockRabbitMqQueueResult({ messageCount: 10 });
    expectRabbitMqQueueResult(result).toHaveMessageCountLessThanOrEqual(10);
    expectRabbitMqQueueResult(result).toHaveMessageCountLessThanOrEqual(15);
  });

  await t.step("toHaveConsumerCount", async (t) => {
    await t.step("passes for matching count", () => {
      const result = mockRabbitMqQueueResult({ consumerCount: 2 });
      expectRabbitMqQueueResult(result).toHaveConsumerCount(2);
    });

    await t.step("fails for non-matching count", () => {
      const result = mockRabbitMqQueueResult({ consumerCount: 2 });
      assertThrows(
        () => expectRabbitMqQueueResult(result).toHaveConsumerCount(5),
        Error,
        "Expected 5 consumer count, got 2",
      );
    });
  });

  await t.step("consumer count comparison methods", () => {
    const result = mockRabbitMqQueueResult({ consumerCount: 5 });
    expectRabbitMqQueueResult(result)
      .toHaveConsumerCountGreaterThan(2)
      .toHaveConsumerCountGreaterThanOrEqual(5)
      .toHaveConsumerCountLessThan(10)
      .toHaveConsumerCountLessThanOrEqual(5);
  });

  await t.step("method chaining", () => {
    const result = mockRabbitMqQueueResult({
      ok: true,
      messageCount: 10,
      consumerCount: 2,
      duration: 50,
    });
    expectRabbitMqQueueResult(result)
      .toBeSuccessful()
      .toHaveMessageCount(10)
      .toHaveConsumerCount(2)
      .toHaveDurationLessThan(100);
  });
});
