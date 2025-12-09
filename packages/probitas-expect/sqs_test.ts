import { assertThrows } from "@std/assert";
import { expectSqsMessage, expectSqsResult } from "./sqs.ts";
import type {
  SqsDeleteBatchResult,
  SqsDeleteQueueResult,
  SqsDeleteResult,
  SqsEnsureQueueResult,
  SqsMessage,
  SqsMessages,
  SqsReceiveResult,
  SqsSendBatchResult,
  SqsSendResult,
} from "@probitas/client-sqs";

// Helper to create SqsMessages (array with helper methods)
function createMockSqsMessages(messages: SqsMessage[]): SqsMessages {
  const arr = [...messages] as SqsMessage[] & {
    first(): SqsMessage | undefined;
    firstOrThrow(): SqsMessage;
    last(): SqsMessage | undefined;
    lastOrThrow(): SqsMessage;
  };
  arr.first = function () {
    return this[0];
  };
  arr.firstOrThrow = function () {
    if (this.length === 0) throw new Error("No messages available");
    return this[0];
  };
  arr.last = function () {
    return this[this.length - 1];
  };
  arr.lastOrThrow = function () {
    if (this.length === 0) throw new Error("No messages available");
    return this[this.length - 1];
  };
  return arr as unknown as SqsMessages;
}

// Mock helpers
const mockSqsSendResult = (
  overrides: Partial<SqsSendResult> = {},
): SqsSendResult => ({
  type: "sqs:send" as const,
  ok: true,
  messageId: "msg-123",
  md5OfBody: "md5hash",
  duration: 100,
  ...overrides,
});

const mockSqsSendBatchResult = (
  overrides: Partial<SqsSendBatchResult> = {},
): SqsSendBatchResult => ({
  type: "sqs:send-batch" as const,
  ok: true,
  successful: [{ id: "1", messageId: "msg-1" }],
  failed: [],
  duration: 100,
  ...overrides,
});

const mockSqsReceiveResult = (
  overrides: Partial<Omit<SqsReceiveResult, "messages">> & {
    messages?: SqsMessage[];
  } = {},
): SqsReceiveResult => {
  const { messages: rawMessages, ...rest } = overrides;
  const defaultMessages: SqsMessage[] = [
    {
      messageId: "m1",
      body: '{"order":"123"}',
      attributes: {},
      receiptHandle: "r1",
      md5OfBody: "md5hash",
    },
  ];
  return {
    type: "sqs:receive" as const,
    ok: true,
    messages: createMockSqsMessages(rawMessages ?? defaultMessages),
    duration: 100,
    ...rest,
  };
};

const mockSqsDeleteResult = (
  overrides: Partial<SqsDeleteResult> = {},
): SqsDeleteResult => ({
  type: "sqs:delete" as const,
  ok: true,
  duration: 100,
  ...overrides,
});

const mockSqsDeleteBatchResult = (
  overrides: Partial<SqsDeleteBatchResult> = {},
): SqsDeleteBatchResult => ({
  type: "sqs:delete-batch" as const,
  ok: true,
  successful: ["1"],
  failed: [],
  duration: 100,
  ...overrides,
});

const mockSqsEnsureQueueResult = (
  overrides: Partial<SqsEnsureQueueResult> = {},
): SqsEnsureQueueResult => ({
  type: "sqs:ensure-queue" as const,
  ok: true,
  queueUrl: "https://sqs.us-east-1.amazonaws.com/123456/test-queue",
  duration: 100,
  ...overrides,
});

const mockSqsDeleteQueueResult = (
  overrides: Partial<SqsDeleteQueueResult> = {},
): SqsDeleteQueueResult => ({
  type: "sqs:delete-queue" as const,
  ok: true,
  duration: 100,
  ...overrides,
});

const mockSqsMessage = (overrides: Partial<SqsMessage> = {}): SqsMessage => ({
  messageId: "msg-123",
  body: '{"test":"value"}',
  attributes: {},
  receiptHandle: "handle-123",
  md5OfBody: "md5hash",
  ...overrides,
});

Deno.test("expectSqsResult - SqsSendResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectSqsResult(mockSqsSendResult({ ok: true })).toBeSuccessful();
    assertThrows(
      () => expectSqsResult(mockSqsSendResult({ ok: false })).toBeSuccessful(),
      Error,
    );
  });

  await t.step("toHaveMessageId", () => {
    expectSqsResult(mockSqsSendResult({ messageId: "msg-123" }))
      .toHaveMessageId();
    assertThrows(
      () =>
        expectSqsResult(mockSqsSendResult({ messageId: undefined }))
          .toHaveMessageId(),
      Error,
    );
  });

  await t.step("duration methods", () => {
    expectSqsResult(mockSqsSendResult({ duration: 50 })).toHaveDurationLessThan(
      100,
    );
  });
});

Deno.test("expectSqsResult - SqsSendBatchResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectSqsResult(mockSqsSendBatchResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toBeAllSuccessful", () => {
    expectSqsResult(mockSqsSendBatchResult({ failed: [] })).toBeAllSuccessful();
    assertThrows(
      () =>
        expectSqsResult(
          mockSqsSendBatchResult({
            failed: [{ id: "1", code: "error", message: "Send failed" }],
          }),
        ).toBeAllSuccessful(),
      Error,
    );
  });

  await t.step("toHaveSuccessfulCount", () => {
    expectSqsResult(
      mockSqsSendBatchResult({
        successful: [{ id: "1", messageId: "m1" }, {
          id: "2",
          messageId: "m2",
        }],
      }),
    ).toHaveSuccessfulCount(2);
  });

  await t.step("toHaveSuccessfulCountGreaterThan", () => {
    expectSqsResult(
      mockSqsSendBatchResult({
        successful: [{ id: "1", messageId: "m1" }, {
          id: "2",
          messageId: "m2",
        }],
      }),
    ).toHaveSuccessfulCountGreaterThan(1);
  });

  await t.step("toHaveSuccessfulCountGreaterThanOrEqual", () => {
    expectSqsResult(
      mockSqsSendBatchResult({ successful: [{ id: "1", messageId: "m1" }] }),
    ).toHaveSuccessfulCountGreaterThanOrEqual(1);
  });

  await t.step("toHaveSuccessfulCountLessThan", () => {
    expectSqsResult(
      mockSqsSendBatchResult({ successful: [{ id: "1", messageId: "m1" }] }),
    ).toHaveSuccessfulCountLessThan(5);
  });

  await t.step("toHaveSuccessfulCountLessThanOrEqual", () => {
    expectSqsResult(
      mockSqsSendBatchResult({ successful: [{ id: "1", messageId: "m1" }] }),
    ).toHaveSuccessfulCountLessThanOrEqual(1);
  });

  await t.step("toHaveFailedCount", () => {
    expectSqsResult(
      mockSqsSendBatchResult({
        failed: [{ id: "1", code: "error", message: "Send failed" }],
      }),
    ).toHaveFailedCount(1);
  });

  await t.step("toHaveFailedCountGreaterThan", () => {
    expectSqsResult(
      mockSqsSendBatchResult({
        failed: [
          { id: "1", code: "e1", message: "Error 1" },
          { id: "2", code: "e2", message: "Error 2" },
        ],
      }),
    ).toHaveFailedCountGreaterThan(1);
  });

  await t.step("toHaveFailedCountGreaterThanOrEqual", () => {
    expectSqsResult(
      mockSqsSendBatchResult({
        failed: [{ id: "1", code: "error", message: "Send failed" }],
      }),
    ).toHaveFailedCountGreaterThanOrEqual(1);
  });

  await t.step("toHaveFailedCountLessThan", () => {
    expectSqsResult(
      mockSqsSendBatchResult({
        failed: [{ id: "1", code: "error", message: "Send failed" }],
      }),
    ).toHaveFailedCountLessThan(5);
  });

  await t.step("toHaveFailedCountLessThanOrEqual", () => {
    expectSqsResult(
      mockSqsSendBatchResult({
        failed: [{ id: "1", code: "error", message: "Send failed" }],
      }),
    ).toHaveFailedCountLessThanOrEqual(1);
  });
});

Deno.test("expectSqsResult - SqsReceiveResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectSqsResult(mockSqsReceiveResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveContent", () => {
    expectSqsResult(mockSqsReceiveResult()).toHaveContent();
    expectSqsResult(mockSqsReceiveResult({ messages: [] })).not.toHaveContent();
  });

  await t.step("toHaveLength", () => {
    expectSqsResult(
      mockSqsReceiveResult({ messages: [mockSqsMessage(), mockSqsMessage()] }),
    ).toHaveLength(2);
  });

  await t.step("toHaveLengthGreaterThanOrEqual", () => {
    expectSqsResult(mockSqsReceiveResult()).toHaveLengthGreaterThanOrEqual(1);
  });

  await t.step("toHaveLengthLessThanOrEqual", () => {
    expectSqsResult(mockSqsReceiveResult()).toHaveLengthLessThanOrEqual(5);
  });

  await t.step("toMatchObject", () => {
    expectSqsResult(mockSqsReceiveResult()).toMatchObject({ body: "123" });
  });

  await t.step("toSatisfy", () => {
    expectSqsResult(mockSqsReceiveResult()).toSatisfy((messages) => {
      if (messages.length !== 1) throw new Error("Expected 1 message");
    });
  });
});

Deno.test("expectSqsResult - SqsDeleteResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectSqsResult(mockSqsDeleteResult({ ok: true })).toBeSuccessful();
  });

  await t.step("duration methods", () => {
    expectSqsResult(mockSqsDeleteResult({ duration: 50 }))
      .toHaveDurationLessThan(100);
  });
});

Deno.test("expectSqsResult - SqsDeleteBatchResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectSqsResult(mockSqsDeleteBatchResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toBeAllSuccessful", () => {
    expectSqsResult(mockSqsDeleteBatchResult({ failed: [] }))
      .toBeAllSuccessful();
  });

  await t.step("toHaveSuccessfulCount", () => {
    expectSqsResult(
      mockSqsDeleteBatchResult({ successful: ["1", "2"] }),
    ).toHaveSuccessfulCount(2);
  });

  await t.step("toHaveFailedCount", () => {
    expectSqsResult(
      mockSqsDeleteBatchResult({
        failed: [{ id: "1", code: "error", message: "Delete failed" }],
      }),
    ).toHaveFailedCount(1);
  });
});

Deno.test("expectSqsResult - SqsEnsureQueueResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectSqsResult(mockSqsEnsureQueueResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveQueueUrl - no arg", () => {
    expectSqsResult(mockSqsEnsureQueueResult()).toHaveQueueUrl();
  });

  await t.step("toHaveQueueUrl - with expected", () => {
    const url = "https://sqs.us-east-1.amazonaws.com/123456/test-queue";
    expectSqsResult(mockSqsEnsureQueueResult({ queueUrl: url })).toHaveQueueUrl(
      url,
    );
  });

  await t.step("toHaveQueueUrlContaining", () => {
    expectSqsResult(mockSqsEnsureQueueResult()).toHaveQueueUrlContaining(
      "test-queue",
    );
  });
});

Deno.test("expectSqsResult - SqsDeleteQueueResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectSqsResult(mockSqsDeleteQueueResult({ ok: true })).toBeSuccessful();
  });

  await t.step("duration methods", () => {
    expectSqsResult(mockSqsDeleteQueueResult({ duration: 50 }))
      .toHaveDurationLessThan(100);
  });
});

Deno.test("expectSqsMessage", async (t) => {
  await t.step("toHaveBodyContaining", () => {
    expectSqsMessage(mockSqsMessage({ body: "hello world" }))
      .toHaveBodyContaining("world");
  });

  await t.step("toHaveBodyMatching", () => {
    expectSqsMessage(mockSqsMessage()).toHaveBodyMatching((body) => {
      if (!body.includes("test")) throw new Error("Expected test");
    });
  });

  await t.step("toHaveBodyJsonEqualTo", () => {
    expectSqsMessage(mockSqsMessage({ body: '{"a":1}' })).toHaveBodyJsonEqualTo(
      { a: 1 },
    );
  });

  await t.step("toHaveBodyJsonContaining", () => {
    expectSqsMessage(mockSqsMessage({ body: '{"a":1,"b":2}' }))
      .toHaveBodyJsonContaining({ a: 1 });
  });

  await t.step("toHaveAttribute", () => {
    expectSqsMessage(mockSqsMessage({
      messageAttributes: {
        "correlationId": { stringValue: "123", dataType: "String" },
      },
    })).toHaveAttribute("correlationId");
  });

  await t.step("toHaveAttributesContaining", () => {
    expectSqsMessage(mockSqsMessage({
      messageAttributes: {
        "correlationId": { stringValue: "123", dataType: "String" },
      },
    })).toHaveAttributesContaining({ "correlationId": { stringValue: "123" } });
  });

  await t.step("toHaveMessageId", () => {
    expectSqsMessage(mockSqsMessage({ messageId: "msg-456" })).toHaveMessageId(
      "msg-456",
    );
  });
});
