/**
 * SQS Client Scenario Example
 *
 * Target: elasticmq service on port 9324 (compose.yaml)
 * Uses ElasticMQ for AWS SQS emulation
 */
import { client, expect, scenario, Skip } from "jsr:@probitas/probitas@^0";
import type { SqsMessage } from "jsr:@probitas/client-sqs@^0";

const BASE_URL = "http://localhost:9324";

export default scenario("SQS Client Example", {
  tags: ["integration", "sqs", "aws"],
})
  .setup("Check ElasticMQ availability", async () => {
    let response: Response;
    try {
      // ListQueues rather than a bare GET: SQS answers 400 without an Action,
      // so a plain request would look like a failure. It needs no credentials.
      response = await fetch(`${BASE_URL}/?Action=ListQueues`, {
        signal: AbortSignal.timeout(1000),
      });
    } catch {
      throw new Skip(`ElasticMQ not available at ${BASE_URL}`);
    }
    await response.body?.cancel();
    if (!response.ok) {
      throw new Skip(
        `ElasticMQ at ${BASE_URL} answered ${response.status}`,
      );
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
    expect(result).toBeOk().toHaveSuccessfulCount(3);
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
  .step("Receive and delete message", async (ctx) => {
    const { sqs } = ctx.resources;
    const result = await sqs.receive({
      maxMessages: 1,
      waitTimeSeconds: 1,
    });

    expect(result)
      .toBeOk()
      .toHaveMessagesCountGreaterThanOrEqual(1)
      .toHaveMessagesSatisfying(async (messages) => {
        await sqs.delete(messages![0].receiptHandle);
      });
  }, {
    retry: {
      maxAttempts: 3,
    },
  })
  .step("Receive with message attributes", async (ctx) => {
    const { sqs } = ctx.resources;
    const result = await sqs.receive({
      maxMessages: 10,
      messageAttributeNames: ["All"],
      waitTimeSeconds: 1,
    });

    expect(result)
      .toBeOk()
      .toHaveMessagesSatisfying(async (messages) => {
        const msgs = messages as SqsMessage[];
        for (const msg of msgs) {
          await sqs.delete(msg.receiptHandle);
        }
      });
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
