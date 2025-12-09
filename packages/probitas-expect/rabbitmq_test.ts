import { assertThrows } from "@std/assert";
import { expectRabbitMqResult } from "./rabbitmq.ts";
import type {
  RabbitMqConsumeResult,
  RabbitMqPublishResult,
  RabbitMqQueueResult,
} from "@probitas/client-rabbitmq";

// Mock helpers
const mockRabbitMqPublishResult = (
  overrides: Partial<RabbitMqPublishResult> = {},
): RabbitMqPublishResult => ({
  type: "rabbitmq:publish" as const,
  ok: true,
  duration: 100,
  ...overrides,
});

const mockRabbitMqConsumeResult = (
  overrides: Partial<RabbitMqConsumeResult> = {},
): RabbitMqConsumeResult => ({
  type: "rabbitmq:consume" as const,
  ok: true,
  message: {
    content: new TextEncoder().encode("test message"),
    properties: { contentType: "text/plain" },
    fields: {
      routingKey: "test.key",
      exchange: "test.exchange",
      deliveryTag: 1n,
      redelivered: false,
    },
  },
  duration: 100,
  ...overrides,
});

const mockRabbitMqQueueResult = (
  overrides: Partial<RabbitMqQueueResult> = {},
): RabbitMqQueueResult => ({
  type: "rabbitmq:queue" as const,
  ok: true,
  queue: "test-queue",
  messageCount: 10,
  consumerCount: 2,
  duration: 100,
  ...overrides,
});

Deno.test("expectRabbitMqResult", async (t) => {
  await t.step("RabbitMqPublishResult", async (t) => {
    await t.step("toBeSuccessful", async (t) => {
      await t.step("passes when ok is true", () => {
        const result = mockRabbitMqPublishResult({ ok: true });
        expectRabbitMqResult(result).toBeSuccessful();
      });

      await t.step("fails when ok is false", () => {
        const result = mockRabbitMqPublishResult({ ok: false });
        assertThrows(
          () => expectRabbitMqResult(result).toBeSuccessful(),
          Error,
          "Expected ok result, but ok is false",
        );
      });
    });

    await t.step("duration methods", () => {
      const result = mockRabbitMqPublishResult({ duration: 50 });
      expectRabbitMqResult(result)
        .toHaveDurationLessThan(100)
        .toHaveDurationLessThanOrEqual(50)
        .toHaveDurationGreaterThan(25)
        .toHaveDurationGreaterThanOrEqual(50);
    });
  });

  await t.step("RabbitMqConsumeResult", async (t) => {
    await t.step("toBeSuccessful", () => {
      const result = mockRabbitMqConsumeResult({ ok: true });
      expectRabbitMqResult(result).toBeSuccessful();
    });

    await t.step("toHaveContent", async (t) => {
      await t.step("passes when message exists", () => {
        const result = mockRabbitMqConsumeResult();
        expectRabbitMqResult(result).toHaveContent();
      });

      await t.step("fails when message is null", () => {
        const result = mockRabbitMqConsumeResult({ message: null });
        assertThrows(
          () => expectRabbitMqResult(result).toHaveContent(),
          Error,
          "Expected message, but message is null",
        );
      });

      await t.step("negated - passes when message is null", () => {
        const result = mockRabbitMqConsumeResult({ message: null });
        expectRabbitMqResult(result).not.toHaveContent();
      });
    });

    await t.step("toHaveBodyContaining", async (t) => {
      await t.step("passes when body contains subbody", () => {
        const result = mockRabbitMqConsumeResult({
          message: {
            content: new TextEncoder().encode("hello world"),
            properties: {},
            fields: {
              routingKey: "",
              exchange: "",
              deliveryTag: 1n,
              redelivered: false,
            },
          },
        });
        expectRabbitMqResult(result).toHaveBodyContaining(
          new TextEncoder().encode("world"),
        );
      });

      await t.step("fails when body does not contain subbody", () => {
        const result = mockRabbitMqConsumeResult({
          message: {
            content: new TextEncoder().encode("hello"),
            properties: {},
            fields: {
              routingKey: "",
              exchange: "",
              deliveryTag: 1n,
              redelivered: false,
            },
          },
        });
        assertThrows(
          () =>
            expectRabbitMqResult(result).toHaveBodyContaining(
              new TextEncoder().encode("world"),
            ),
          Error,
          "Expected data to contain world, but got hello",
        );
      });
    });

    await t.step("toSatisfy", async (t) => {
      await t.step("passes when matcher succeeds", () => {
        const result = mockRabbitMqConsumeResult();
        expectRabbitMqResult(result).toSatisfy((content) => {
          if (content.length === 0) throw new Error("Expected content");
        });
      });

      await t.step("fails when matcher throws", () => {
        const result = mockRabbitMqConsumeResult();
        assertThrows(
          () =>
            expectRabbitMqResult(result).toSatisfy((content) => {
              if (content.length > 0) throw new Error("Expected no content");
            }),
          Error,
          "Expected no content",
        );
      });
    });

    await t.step("toHavePropertyContaining", async (t) => {
      await t.step("passes when properties contain subset", () => {
        const result = mockRabbitMqConsumeResult({
          message: {
            content: new Uint8Array(),
            properties: { contentType: "application/json", messageId: "123" },
            fields: {
              routingKey: "",
              exchange: "",
              deliveryTag: 1n,
              redelivered: false,
            },
          },
        });
        expectRabbitMqResult(result).toHavePropertyContaining({
          contentType: "application/json",
        });
      });

      await t.step("fails when properties do not contain subset", () => {
        const result = mockRabbitMqConsumeResult();
        assertThrows(
          () =>
            expectRabbitMqResult(result).toHavePropertyContaining({
              messageId: "123",
            }),
          Error,
        );
      });
    });

    await t.step("toHaveRoutingKey", async (t) => {
      await t.step("passes for matching key", () => {
        const result = mockRabbitMqConsumeResult({
          message: {
            content: new Uint8Array(),
            properties: {},
            fields: {
              routingKey: "test.key",
              exchange: "",
              deliveryTag: 1n,
              redelivered: false,
            },
          },
        });
        expectRabbitMqResult(result).toHaveRoutingKey("test.key");
      });

      await t.step("fails for non-matching key", () => {
        const result = mockRabbitMqConsumeResult();
        assertThrows(
          () => expectRabbitMqResult(result).toHaveRoutingKey("wrong.key"),
          Error,
          "Expected routing key wrong.key, got test.key",
        );
      });
    });

    await t.step("toHaveExchange", async (t) => {
      await t.step("passes for matching exchange", () => {
        const result = mockRabbitMqConsumeResult();
        expectRabbitMqResult(result).toHaveExchange("test.exchange");
      });

      await t.step("fails for non-matching exchange", () => {
        const result = mockRabbitMqConsumeResult();
        assertThrows(
          () => expectRabbitMqResult(result).toHaveExchange("wrong.exchange"),
          Error,
          "Expected exchange wrong.exchange, got test.exchange",
        );
      });
    });

    await t.step("method chaining", () => {
      const result = mockRabbitMqConsumeResult({ ok: true, duration: 50 });
      expectRabbitMqResult(result)
        .toBeSuccessful()
        .toHaveContent()
        .toHaveRoutingKey("test.key")
        .toHaveExchange("test.exchange")
        .toHaveDurationLessThan(100);
    });
  });

  await t.step("RabbitMqQueueResult", async (t) => {
    await t.step("toBeSuccessful", () => {
      const result = mockRabbitMqQueueResult({ ok: true });
      expectRabbitMqResult(result).toBeSuccessful();
    });

    await t.step("toHaveMessageCount", async (t) => {
      await t.step("passes for matching count", () => {
        const result = mockRabbitMqQueueResult({ messageCount: 10 });
        expectRabbitMqResult(result).toHaveMessageCount(10);
      });

      await t.step("fails for non-matching count", () => {
        const result = mockRabbitMqQueueResult({ messageCount: 10 });
        assertThrows(
          () => expectRabbitMqResult(result).toHaveMessageCount(5),
          Error,
          "Expected 5 message count, got 10",
        );
      });
    });

    await t.step("toHaveMessageCountGreaterThan", async (t) => {
      await t.step("passes when count is greater", () => {
        const result = mockRabbitMqQueueResult({ messageCount: 10 });
        expectRabbitMqResult(result).toHaveMessageCountGreaterThan(5);
      });

      await t.step("fails when count is equal", () => {
        const result = mockRabbitMqQueueResult({ messageCount: 10 });
        assertThrows(
          () => expectRabbitMqResult(result).toHaveMessageCountGreaterThan(10),
          Error,
          "Expected message count > 10, but got 10",
        );
      });
    });

    await t.step("toHaveMessageCountGreaterThanOrEqual", () => {
      const result = mockRabbitMqQueueResult({ messageCount: 10 });
      expectRabbitMqResult(result).toHaveMessageCountGreaterThanOrEqual(10);
      expectRabbitMqResult(result).toHaveMessageCountGreaterThanOrEqual(5);
    });

    await t.step("toHaveMessageCountLessThan", () => {
      const result = mockRabbitMqQueueResult({ messageCount: 5 });
      expectRabbitMqResult(result).toHaveMessageCountLessThan(10);
    });

    await t.step("toHaveMessageCountLessThanOrEqual", () => {
      const result = mockRabbitMqQueueResult({ messageCount: 10 });
      expectRabbitMqResult(result).toHaveMessageCountLessThanOrEqual(10);
      expectRabbitMqResult(result).toHaveMessageCountLessThanOrEqual(15);
    });

    await t.step("toHaveConsumerCount", async (t) => {
      await t.step("passes for matching count", () => {
        const result = mockRabbitMqQueueResult({ consumerCount: 2 });
        expectRabbitMqResult(result).toHaveConsumerCount(2);
      });

      await t.step("fails for non-matching count", () => {
        const result = mockRabbitMqQueueResult({ consumerCount: 2 });
        assertThrows(
          () => expectRabbitMqResult(result).toHaveConsumerCount(5),
          Error,
          "Expected 5 consumer count, got 2",
        );
      });
    });

    await t.step("consumer count comparison methods", () => {
      const result = mockRabbitMqQueueResult({ consumerCount: 5 });
      expectRabbitMqResult(result)
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
      expectRabbitMqResult(result)
        .toBeSuccessful()
        .toHaveMessageCount(10)
        .toHaveConsumerCount(2)
        .toHaveDurationLessThan(100);
    });
  });
});
