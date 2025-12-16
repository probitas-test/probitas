/**
 * SQS Client Failure Examples
 *
 * This file demonstrates failure messages for each SQS expectation method.
 * All scenarios are expected to fail - they use dummy results to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
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
} from "jsr:@probitas/client-sqs@^0";

// Helper to create SqsMessages
function createMockMessages(messages: SqsMessage[]): SqsMessages {
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
const mockSendResult = (
  overrides: Partial<SqsSendResult> = {},
): SqsSendResult => ({
  kind: "sqs:send" as const,
  ok: false,
  messageId: "msg-abc123",
  md5OfBody: "d41d8cd98f00b204e9800998ecf8427e",
  duration: 50,
  ...overrides,
});

const mockSendBatchResult = (
  overrides: Partial<SqsSendBatchResult> = {},
): SqsSendBatchResult => ({
  kind: "sqs:send-batch" as const,
  ok: false,
  successful: [
    { id: "1", messageId: "msg-1" },
    { id: "2", messageId: "msg-2" },
  ],
  failed: [
    { id: "3", code: "InvalidMessageContents", message: "Invalid" },
  ],
  duration: 100,
  ...overrides,
});

const mockReceiveResult = (
  overrides: Partial<Omit<SqsReceiveResult, "messages">> & {
    messages?: SqsMessage[];
  } = {},
): SqsReceiveResult => {
  const { messages: rawMessages, ...rest } = overrides;
  const defaultMessages: SqsMessage[] = [
    {
      messageId: "msg-recv-1",
      receiptHandle: "handle-1",
      body: '{"action": "test"}',
      md5OfBody: "hash1",
      attributes: {},
    },
    {
      messageId: "msg-recv-2",
      receiptHandle: "handle-2",
      body: '{"action": "test2"}',
      md5OfBody: "hash2",
      attributes: {},
    },
  ];
  return {
    kind: "sqs:receive" as const,
    ok: false,
    messages: createMockMessages(rawMessages ?? defaultMessages),
    duration: 200,
    ...rest,
  };
};

const mockDeleteResult = (
  overrides: Partial<SqsDeleteResult> = {},
): SqsDeleteResult => ({
  kind: "sqs:delete" as const,
  ok: false,
  duration: 30,
  ...overrides,
});

const mockDeleteBatchResult = (
  overrides: Partial<SqsDeleteBatchResult> = {},
): SqsDeleteBatchResult => ({
  kind: "sqs:delete-batch" as const,
  ok: false,
  successful: ["1"],
  failed: [{ id: "2", code: "ReceiptHandleIsInvalid", message: "Invalid" }],
  duration: 80,
  ...overrides,
});

const mockEnsureQueueResult = (
  overrides: Partial<SqsEnsureQueueResult> = {},
): SqsEnsureQueueResult => ({
  kind: "sqs:ensure-queue" as const,
  ok: false,
  queueUrl: "https://sqs.us-east-1.amazonaws.com/123456789/test-queue",
  duration: 150,
  ...overrides,
});

const mockDeleteQueueResult = (
  overrides: Partial<SqsDeleteQueueResult> = {},
): SqsDeleteQueueResult => ({
  kind: "sqs:delete-queue" as const,
  ok: false,
  duration: 120,
  ...overrides,
});

const dummySendResult = mockSendResult();
const dummySendBatchResult = mockSendBatchResult();
const dummyReceiveResult = mockReceiveResult();
const dummyDeleteResult = mockDeleteResult();
const dummyDeleteBatchResult = mockDeleteBatchResult();
const dummyEnsureQueueResult = mockEnsureQueueResult();
const dummyDeleteQueueResult = mockDeleteQueueResult();

// Send result failures
export const sendToBeOk = scenario("SQS Send - toBeOk failure", {
  tags: ["failure", "sqs"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummySendResult).toBeOk();
  })
  .build();

export const sendToHaveMessageId = scenario(
  "SQS Send - toHaveMessageId failure",
  { tags: ["failure", "sqs"] },
)
  .step("toHaveMessageId fails with wrong id", () => {
    expect(dummySendResult).toHaveMessageId("different-id");
  })
  .build();

export const sendToHaveMessageIdMatching = scenario(
  "SQS Send - toHaveMessageIdMatching failure",
  { tags: ["failure", "sqs"] },
)
  .step("toHaveMessageIdMatching fails", () => {
    expect(dummySendResult).toHaveMessageIdMatching(/^xyz/);
  })
  .build();

export const sendToHaveMd5OfBody = scenario(
  "SQS Send - toHaveMd5OfBody failure",
  { tags: ["failure", "sqs"] },
)
  .step("toHaveMd5OfBody fails with wrong hash", () => {
    expect(dummySendResult).toHaveMd5OfBody("different-hash");
  })
  .build();

// SendBatch result failures
export const sendBatchToBeOk = scenario("SQS SendBatch - toBeOk failure", {
  tags: ["failure", "sqs"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummySendBatchResult).toBeOk();
  })
  .build();

export const sendBatchToHaveSuccessfulCount = scenario(
  "SQS SendBatch - toHaveSuccessfulCount failure",
  { tags: ["failure", "sqs"] },
)
  .step("toHaveSuccessfulCount fails with wrong count", () => {
    expect(dummySendBatchResult).toHaveSuccessfulCount(10);
  })
  .build();

export const sendBatchToHaveFailedCountEqual = scenario(
  "SQS SendBatch - toHaveFailedCountEqual failure",
  { tags: ["failure", "sqs"] },
)
  .step("toHaveFailedCountEqual fails with wrong count", () => {
    expect(dummySendBatchResult).toHaveFailedCountEqual(0);
  })
  .build();

// Receive result failures
export const receiveToBeOk = scenario("SQS Receive - toBeOk failure", {
  tags: ["failure", "sqs"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyReceiveResult).toBeOk();
  })
  .build();

export const receiveToHaveMessagesEmpty = scenario(
  "SQS Receive - toHaveMessagesEmpty failure",
  { tags: ["failure", "sqs"] },
)
  .step("toHaveMessagesEmpty fails when messages exist", () => {
    expect(dummyReceiveResult).toHaveMessagesEmpty();
  })
  .build();

export const receiveToHaveMessagesCount = scenario(
  "SQS Receive - toHaveMessagesCount failure",
  { tags: ["failure", "sqs"] },
)
  .step("toHaveMessagesCount fails with wrong count", () => {
    expect(dummyReceiveResult).toHaveMessagesCount(10);
  })
  .build();

export const receiveToHaveMessagesCountGreaterThan = scenario(
  "SQS Receive - toHaveMessagesCountGreaterThan failure",
  { tags: ["failure", "sqs"] },
)
  .step("toHaveMessagesCountGreaterThan fails", () => {
    expect(dummyReceiveResult).toHaveMessagesCountGreaterThan(5);
  })
  .build();

// Delete result failures
export const deleteToBeOk = scenario("SQS Delete - toBeOk failure", {
  tags: ["failure", "sqs"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyDeleteResult).toBeOk();
  })
  .build();

// DeleteBatch result failures
export const deleteBatchToBeOk = scenario("SQS DeleteBatch - toBeOk failure", {
  tags: ["failure", "sqs"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyDeleteBatchResult).toBeOk();
  })
  .build();

export const deleteBatchToHaveSuccessfulCount = scenario(
  "SQS DeleteBatch - toHaveSuccessfulCount failure",
  { tags: ["failure", "sqs"] },
)
  .step("toHaveSuccessfulCount fails with wrong count", () => {
    expect(dummyDeleteBatchResult).toHaveSuccessfulCount(10);
  })
  .build();

export const deleteBatchToHaveFailedCountEqual = scenario(
  "SQS DeleteBatch - toHaveFailedCountEqual failure",
  { tags: ["failure", "sqs"] },
)
  .step("toHaveFailedCountEqual fails with wrong count", () => {
    expect(dummyDeleteBatchResult).toHaveFailedCountEqual(0);
  })
  .build();

// EnsureQueue result failures
export const ensureQueueToBeOk = scenario("SQS EnsureQueue - toBeOk failure", {
  tags: ["failure", "sqs"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyEnsureQueueResult).toBeOk();
  })
  .build();

export const ensureQueueToHaveQueueUrl = scenario(
  "SQS EnsureQueue - toHaveQueueUrl failure",
  { tags: ["failure", "sqs"] },
)
  .step("toHaveQueueUrl fails with wrong URL", () => {
    expect(dummyEnsureQueueResult).toHaveQueueUrl("https://different-url.com");
  })
  .build();

export const ensureQueueToHaveQueueUrlContaining = scenario(
  "SQS EnsureQueue - toHaveQueueUrlContaining failure",
  { tags: ["failure", "sqs"] },
)
  .step("toHaveQueueUrlContaining fails", () => {
    expect(dummyEnsureQueueResult).toHaveQueueUrlContaining("different-queue");
  })
  .build();

// DeleteQueue result failures
export const deleteQueueToBeOk = scenario("SQS DeleteQueue - toBeOk failure", {
  tags: ["failure", "sqs"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyDeleteQueueResult).toBeOk();
  })
  .build();

// Duration failures
export const toHaveDuration = scenario("SQS - toHaveDuration failure", {
  tags: ["failure", "sqs"],
})
  .step("toHaveDuration fails with wrong duration", () => {
    expect(dummySendResult).toHaveDuration(10);
  })
  .build();

export const toHaveDurationLessThan = scenario(
  "SQS - toHaveDurationLessThan failure",
  { tags: ["failure", "sqs"] },
)
  .step("toHaveDurationLessThan fails", () => {
    expect(dummySendResult).toHaveDurationLessThan(30);
  })
  .build();

// Negation failures
export const notToBeOk = scenario("SQS - not.toBeOk failure", {
  tags: ["failure", "sqs"],
})
  .step("not.toBeOk fails when ok is true", () => {
    const okResult = mockSendResult({ ok: true });
    expect(okResult).not.toBeOk();
  })
  .build();

export default [
  sendToBeOk,
  sendToHaveMessageId,
  sendToHaveMessageIdMatching,
  sendToHaveMd5OfBody,
  sendBatchToBeOk,
  sendBatchToHaveSuccessfulCount,
  sendBatchToHaveFailedCountEqual,
  receiveToBeOk,
  receiveToHaveMessagesEmpty,
  receiveToHaveMessagesCount,
  receiveToHaveMessagesCountGreaterThan,
  deleteToBeOk,
  deleteBatchToBeOk,
  deleteBatchToHaveSuccessfulCount,
  deleteBatchToHaveFailedCountEqual,
  ensureQueueToBeOk,
  ensureQueueToHaveQueueUrl,
  ensureQueueToHaveQueueUrlContaining,
  deleteQueueToBeOk,
  toHaveDuration,
  toHaveDurationLessThan,
  notToBeOk,
];
