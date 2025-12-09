/**
 * RabbitMQ Client Scenario Example
 *
 * Target: rabbitmq service on port 5672 (compose.yaml)
 * Credentials: guest/guest
 */
import { client, expect, scenario } from "probitas";

const encoder = new TextEncoder();

export default scenario("RabbitMQ Client Example", {
  tags: ["integration", "rabbitmq"],
})
  .resource("mq", () =>
    client.rabbitmq.createRabbitMqClient({
      url: "amqp://guest:guest@localhost:5672",
    }))
  .setup((ctx) => {
    const { mq } = ctx.resources;
    // Return cleanup function to delete queues and exchanges
    return async () => {
      const channel = await mq.channel();
      // Use ifExists to avoid errors if resources don't exist
      await channel.deleteQueue("test_queue").catch(() => {});
      await channel.deleteQueue("test_bound_queue").catch(() => {});
      await channel.deleteExchange("test_exchange").catch(() => {});
      await channel.close();
    };
  })
  .step("Declare queue", async (ctx) => {
    const { mq } = ctx.resources;
    const channel = await mq.channel();
    const result = await channel.assertQueue("test_queue", {
      durable: false,
      autoDelete: true,
    });

    expect(result).toBeSuccessful();
    await channel.close();
  })
  .step("Send message to queue", async (ctx) => {
    const { mq } = ctx.resources;
    const channel = await mq.channel();
    const content = encoder.encode(JSON.stringify({
      message: "Hello RabbitMQ",
      timestamp: Date.now(),
    }));
    const result = await channel.sendToQueue("test_queue", content);

    expect(result).toBeSuccessful();
    await channel.close();
  })
  .step("Send multiple messages to queue", async (ctx) => {
    const { mq } = ctx.resources;
    const channel = await mq.channel();

    for (let i = 0; i < 5; i++) {
      const content = encoder.encode(JSON.stringify({
        index: i,
        message: `Message ${i}`,
      }));
      await channel.sendToQueue("test_queue", content);
    }
    await channel.close();
  })
  .step("Get single message", async (ctx) => {
    const { mq } = ctx.resources;
    const channel = await mq.channel();
    const result = await channel.get("test_queue");

    expect(result).toBeSuccessful().toHaveContent();

    if (result.message) {
      await channel.ack(result.message);
    }
    await channel.close();
  })
  .step("Get remaining messages", async (ctx) => {
    const { mq } = ctx.resources;
    const channel = await mq.channel();

    let consumed = 0;
    while (consumed < 5) {
      const result = await channel.get("test_queue");
      if (!result.message) break;
      await channel.ack(result.message);
      consumed++;
    }
    await channel.close();
  })
  .step("Declare exchange", async (ctx) => {
    const { mq } = ctx.resources;
    const channel = await mq.channel();
    const result = await channel.assertExchange("test_exchange", "direct", {
      durable: false,
      autoDelete: true,
    });
    expect(result).toBeSuccessful();
    await channel.close();
  })
  .step("Bind queue to exchange", async (ctx) => {
    const { mq } = ctx.resources;
    const channel = await mq.channel();
    await channel.assertQueue("test_bound_queue", {
      durable: false,
      autoDelete: true,
    });
    await channel.bindQueue("test_bound_queue", "test_exchange", "test_key");
    await channel.close();
  })
  .step("Publish to exchange", async (ctx) => {
    const { mq } = ctx.resources;
    const channel = await mq.channel();
    const content = encoder.encode(JSON.stringify({
      data: "via exchange",
    }));
    await channel.publish("test_exchange", "test_key", content);
    await channel.close();
  })
  .step("Get from bound queue", async (ctx) => {
    const { mq } = ctx.resources;
    const channel = await mq.channel();
    const result = await channel.get("test_bound_queue");

    expect(result).toBeSuccessful().toHaveContent();

    if (result.message) {
      await channel.ack(result.message);
    }
    await channel.close();
  })
  .step("Message with properties", async (ctx) => {
    const { mq } = ctx.resources;
    const channel = await mq.channel();

    const content = encoder.encode(JSON.stringify({ data: "with headers" }));
    await channel.sendToQueue("test_queue", content, {
      contentType: "application/json",
      messageId: "msg-123",
      persistent: true,
    });

    const result = await channel.get("test_queue");
    expect(result).toBeSuccessful().toHaveContent();

    if (result.message) {
      await channel.ack(result.message);
    }
    await channel.close();
  })
  .build();
