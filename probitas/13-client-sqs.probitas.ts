/**
 * SQS Client Scenario Example
 *
 * Target: localstack service on port 4566 (compose.yaml)
 * Uses LocalStack for AWS SQS emulation
 */
import { client, expect, scenario, Skip } from "jsr:@probitas/probitas@^0";

const BASE_URL = "http://localhost:4566";

export default scenario("SQS Client Example", {
  tags: ["integration", "sqs", "aws"],
})
  .setup("Check LocalStack availability", async () => {
    try {
      await fetch(`${BASE_URL}/_localstack/health`, {
        signal: AbortSignal.timeout(1000),
      });
    } catch {
      throw new Skip(`LocalStack not available at ${BASE_URL}`);
    }
  })
  .resource("sqs", () =>
    client.sqs.createSqsClient({
      url: BASE_URL,
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    }))
  .setup(async (ctx) => {
    const { sqs } = ctx.resources;
    await sqs.ensureQueue("test-queue");
  })
  .step("Send message", async (ctx) => {
    const { sqs } = ctx.resources;
    const result = await sqs.send(JSON.stringify({
      action: "test",
      value: 42,
    }));

    expect(result)
      .toBeOk()
      .toHaveMessageIdMatching(/.+/);
  })
  .step("Send message with attributes", async (ctx) => {
    const { sqs } = ctx.resources;
    const result = await sqs.send(
      JSON.stringify({ data: "with attributes" }),
      {
        messageAttributes: {
          type: { dataType: "String", stringValue: "test" },
          priority: { dataType: "Number", stringValue: "1" },
        },
      },
    );

    expect(result)
      .toBeOk()
      .toHaveMessageIdMatching(/.+/);
  })
  .step("Send batch messages", async (ctx) => {
    const { sqs } = ctx.resources;
    const messages = [
      { id: "1", body: JSON.stringify({ index: 1 }) },
      { id: "2", body: JSON.stringify({ index: 2 }) },
      { id: "3", body: JSON.stringify({ index: 3 }) },
    ];
    const result = await sqs.sendBatch(messages);
    expect(result).toBeOk().toHaveSuccessfulSatisfying((msgs: unknown[]) => {
      if (msgs.length !== 3) {
        throw new Error(`Expected 3 successful messages, got ${msgs.length}`);
      }
    });
  })
  .step("Receive messages", async (ctx) => {
    const { sqs } = ctx.resources;
    const result = await sqs.receive({
      maxMessages: 10,
      waitTimeSeconds: 1,
    });

    expect(result)
      .toBeOk()
      .toHaveMessagesCountGreaterThanOrEqual(1);
  })
  .step("Receive and delete message", async (ctx) => {
    const { sqs } = ctx.resources;
    const result = await sqs.receive({
      maxMessages: 1,
      waitTimeSeconds: 1,
    });

    if (result.messages.length > 0) {
      const msg = result.messages[0];
      await sqs.delete(msg.receiptHandle);
    }
  })
  .step("Receive with message attributes", async (ctx) => {
    const { sqs } = ctx.resources;
    const result = await sqs.receive({
      maxMessages: 10,
      messageAttributeNames: ["All"],
      waitTimeSeconds: 1,
    });

    for (const msg of result.messages) {
      await sqs.delete(msg.receiptHandle);
    }
  })
  .step("Send with delay", async (ctx) => {
    const { sqs } = ctx.resources;
    const result = await sqs.send(
      JSON.stringify({ delayed: true }),
      { delaySeconds: 1 },
    );

    expect(result)
      .toBeOk()
      .toHaveMessageIdMatching(/.+/);
  })
  .step("Purge queue", async (ctx) => {
    const { sqs } = ctx.resources;
    await sqs.purge();
  })
  .step("Verify queue is empty", async (ctx) => {
    const { sqs } = ctx.resources;
    const result = await sqs.receive({
      maxMessages: 10,
      waitTimeSeconds: 1,
    });

    expect(result)
      .toBeOk()
      .toHaveMessagesEmpty();
  })
  .build();
