import { assertThrows } from "@std/assert";
import { expectRabbitMqConsumeResult } from "./consume.ts";
import { mockRabbitMqConsumeResult } from "./_test_utils.ts";

Deno.test("expectRabbitMqConsumeResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    const result = mockRabbitMqConsumeResult({ ok: true });
    expectRabbitMqConsumeResult(result).toBeSuccessful();
  });

  await t.step("toHaveContent", async (t) => {
    await t.step("passes when message exists", () => {
      const result = mockRabbitMqConsumeResult();
      expectRabbitMqConsumeResult(result).toHaveContent();
    });

    await t.step("fails when message is null", () => {
      const result = mockRabbitMqConsumeResult({ message: null });
      assertThrows(
        () => expectRabbitMqConsumeResult(result).toHaveContent(),
        Error,
        "Expected message, but message is null",
      );
    });

    await t.step("negated - passes when message is null", () => {
      const result = mockRabbitMqConsumeResult({ message: null });
      expectRabbitMqConsumeResult(result).not.toHaveContent();
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
      expectRabbitMqConsumeResult(result).toHaveBodyContaining(
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
          expectRabbitMqConsumeResult(result).toHaveBodyContaining(
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
      expectRabbitMqConsumeResult(result).toSatisfy((content) => {
        if (content.length === 0) throw new Error("Expected content");
      });
    });

    await t.step("fails when matcher throws", () => {
      const result = mockRabbitMqConsumeResult();
      assertThrows(
        () =>
          expectRabbitMqConsumeResult(result).toSatisfy((content) => {
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
      expectRabbitMqConsumeResult(result).toHavePropertyContaining({
        contentType: "application/json",
      });
    });

    await t.step("fails when properties do not contain subset", () => {
      const result = mockRabbitMqConsumeResult();
      assertThrows(
        () =>
          expectRabbitMqConsumeResult(result).toHavePropertyContaining({
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
      expectRabbitMqConsumeResult(result).toHaveRoutingKey("test.key");
    });

    await t.step("fails for non-matching key", () => {
      const result = mockRabbitMqConsumeResult();
      assertThrows(
        () => expectRabbitMqConsumeResult(result).toHaveRoutingKey("wrong.key"),
        Error,
        "Expected routing key wrong.key, got test.key",
      );
    });
  });

  await t.step("toHaveExchange", async (t) => {
    await t.step("passes for matching exchange", () => {
      const result = mockRabbitMqConsumeResult();
      expectRabbitMqConsumeResult(result).toHaveExchange("test.exchange");
    });

    await t.step("fails for non-matching exchange", () => {
      const result = mockRabbitMqConsumeResult();
      assertThrows(
        () =>
          expectRabbitMqConsumeResult(result).toHaveExchange("wrong.exchange"),
        Error,
        "Expected exchange wrong.exchange, got test.exchange",
      );
    });
  });

  await t.step("method chaining", () => {
    const result = mockRabbitMqConsumeResult({ ok: true, duration: 50 });
    expectRabbitMqConsumeResult(result)
      .toBeSuccessful()
      .toHaveContent()
      .toHaveRoutingKey("test.key")
      .toHaveExchange("test.exchange")
      .toHaveDurationLessThan(100);
  });
});
