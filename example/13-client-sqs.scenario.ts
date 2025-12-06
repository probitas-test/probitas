/**
 * SQS Client Scenario Example
 *
 * Target: localstack service on port 4566 (compose.yaml)
 * Uses LocalStack for AWS SQS emulation
 */
import { scenario } from "probitas";
import { createSqsClient, expectSqsResult } from "@probitas/client-sqs";
import { CreateQueueCommand, SQSClient } from "@aws-sdk/client-sqs";

const QUEUE_NAME = "test-queue";
const ENDPOINT = "http://localhost:4566";
const QUEUE_URL = `${ENDPOINT}/000000000000/${QUEUE_NAME}`;

export default scenario("SQS Client Example", {
  tags: ["integration", "sqs", "aws"],
})
  .setup(async () => {
    const client = new SQSClient({
      region: "us-east-1",
      endpoint: ENDPOINT,
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    });
    try {
      await client.send(new CreateQueueCommand({ QueueName: QUEUE_NAME }));
    } finally {
      client.destroy();
    }
  })
  .resource("sqs", () =>
    createSqsClient({
      region: "us-east-1",
      endpoint: ENDPOINT,
      queueUrl: QUEUE_URL,
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    }))
  .step("Send message", async (ctx) => {
    const { sqs } = ctx.resources;
    const result = await sqs.send(JSON.stringify({
      action: "test",
      value: 42,
    }));

    expectSqsResult(result)
      .ok()
      .hasMessageId();
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

    expectSqsResult(result)
      .ok()
      .hasMessageId();
  })
  .step("Send batch messages", async (ctx) => {
    const { sqs } = ctx.resources;
    const messages = [
      { id: "1", body: JSON.stringify({ index: 1 }) },
      { id: "2", body: JSON.stringify({ index: 2 }) },
      { id: "3", body: JSON.stringify({ index: 3 }) },
    ];
    const result = await sqs.sendBatch(messages);
    expectSqsResult(result).ok().successfulCount(3);
  })
  .step("Receive messages", async (ctx) => {
    const { sqs } = ctx.resources;
    const result = await sqs.receive({
      maxMessages: 10,
      waitTimeSeconds: 1,
    });

    expectSqsResult(result)
      .ok()
      .countAtLeast(1);
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

    expectSqsResult(result)
      .ok()
      .hasMessageId();
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

    expectSqsResult(result)
      .ok()
      .noContent();
  })
  .build();
