/**
 * SQS Client Failure Examples
 *
 * This file demonstrates failure messages for each SQS expectation method.
 * All scenarios are expected to fail - they use dummy results to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import type {
  SqsBatchFailedEntry,
  SqsBatchSuccessEntry,
  SqsDeleteBatchResult,
  SqsDeleteQueueResult,
  SqsDeleteResult,
  SqsEnsureQueueResult,
  SqsMessage,
  SqsReceiveResult,
  SqsSendBatchResult,
  SqsSendResult,
} from "jsr:@probitas/client-sqs@^0";

// Local mock error class to work around package export issue
// (SqsConnectionError is re-exported as type-only from types.ts)
class MockSqsConnectionError extends Error {
  override readonly name = "SqsConnectionError";
  readonly kind = "connection" as const;
  readonly code?: string;

  constructor(message: string) {
    super(message);
  }
}

// Helper functions - separate functions for ok:true and ok:false states

function createSuccessSendResult(
  messageId: string,
  md5OfBody: string,
): SqsSendResult {
  return {
    kind: "sqs:send" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    messageId,
    md5OfBody,
    sequenceNumber: null,
    duration: 50,
  };
}

function createFailureSendResult(): SqsSendResult {
  return {
    kind: "sqs:send" as const,
    processed: false as const,
    ok: false as const,
    error: new MockSqsConnectionError("Connection failed"),
    messageId: null,
    md5OfBody: null,
    sequenceNumber: null,
    duration: 0,
  };
}

function createSuccessSendBatchResult(
  successful: readonly SqsBatchSuccessEntry[],
  failed: readonly SqsBatchFailedEntry[],
): SqsSendBatchResult {
  return {
    kind: "sqs:send-batch" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    successful,
    failed,
    duration: 100,
  };
}

function createFailureSendBatchResult(): SqsSendBatchResult {
  return {
    kind: "sqs:send-batch" as const,
    processed: false as const,
    ok: false as const,
    error: new MockSqsConnectionError("Connection failed"),
    successful: null,
    failed: null,
    duration: 0,
  };
}

function createSuccessReceiveResult(
  messages: readonly SqsMessage[],
): SqsReceiveResult {
  return {
    kind: "sqs:receive" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    messages,
    duration: 200,
  };
}

function createFailureReceiveResult(): SqsReceiveResult {
  return {
    kind: "sqs:receive" as const,
    processed: false as const,
    ok: false as const,
    error: new MockSqsConnectionError("Connection failed"),
    messages: null,
    duration: 0,
  };
}

function createSuccessDeleteResult(): SqsDeleteResult {
  return {
    kind: "sqs:delete" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    duration: 30,
  };
}

function createFailureDeleteResult(): SqsDeleteResult {
  return {
    kind: "sqs:delete" as const,
    processed: false as const,
    ok: false as const,
    error: new MockSqsConnectionError("Connection failed"),
    duration: 0,
  };
}

function createSuccessDeleteBatchResult(
  successful: readonly string[],
  failed: readonly SqsBatchFailedEntry[],
): SqsDeleteBatchResult {
  return {
    kind: "sqs:delete-batch" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    successful,
    failed,
    duration: 80,
  };
}

function createFailureDeleteBatchResult(): SqsDeleteBatchResult {
  return {
    kind: "sqs:delete-batch" as const,
    processed: false as const,
    ok: false as const,
    error: new MockSqsConnectionError("Connection failed"),
    successful: null,
    failed: null,
    duration: 0,
  };
}

function createSuccessEnsureQueueResult(
  queueUrl: string,
): SqsEnsureQueueResult {
  return {
    kind: "sqs:ensure-queue" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    queueUrl,
    duration: 150,
  };
}

function createFailureEnsureQueueResult(): SqsEnsureQueueResult {
  return {
    kind: "sqs:ensure-queue" as const,
    processed: false as const,
    ok: false as const,
    error: new MockSqsConnectionError("Connection failed"),
    queueUrl: null,
    duration: 0,
  };
}

function createSuccessDeleteQueueResult(): SqsDeleteQueueResult {
  return {
    kind: "sqs:delete-queue" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    duration: 120,
  };
}

function createFailureDeleteQueueResult(): SqsDeleteQueueResult {
  return {
    kind: "sqs:delete-queue" as const,
    processed: false as const,
    ok: false as const,
    error: new MockSqsConnectionError("Connection failed"),
    duration: 0,
  };
}

const testMessages: SqsMessage[] = [
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

const dummySendResult = createSuccessSendResult(
  "msg-abc123",
  "d41d8cd98f00b204e9800998ecf8427e",
);
const dummySendBatchResult = createSuccessSendBatchResult(
  [
    { id: "1", messageId: "msg-1" },
    { id: "2", messageId: "msg-2" },
  ],
  [{ id: "3", code: "InvalidMessageContents", message: "Invalid" }],
);
const dummyReceiveResult = createSuccessReceiveResult(testMessages);
const _dummyDeleteResult = createSuccessDeleteResult();
const dummyDeleteBatchResult = createSuccessDeleteBatchResult(
  ["1"],
  [{ id: "2", code: "ReceiptHandleIsInvalid", message: "Invalid" }],
);
const dummyEnsureQueueResult = createSuccessEnsureQueueResult(
  "https://sqs.us-east-1.amazonaws.com/123456789/test-queue",
);
const _dummyDeleteQueueResult = createSuccessDeleteQueueResult();

// Send result failures
export const sendToBeOk = scenario("SQS Send - toBeOk failure", {
  tags: ["failure", "sqs"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(createFailureSendResult()).toBeOk();
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
    expect(createFailureSendBatchResult()).toBeOk();
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
    expect(createFailureReceiveResult()).toBeOk();
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
    expect(createFailureDeleteResult()).toBeOk();
  })
  .build();

// DeleteBatch result failures
export const deleteBatchToBeOk = scenario("SQS DeleteBatch - toBeOk failure", {
  tags: ["failure", "sqs"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(createFailureDeleteBatchResult()).toBeOk();
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
    expect(createFailureEnsureQueueResult()).toBeOk();
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
    expect(createFailureDeleteQueueResult()).toBeOk();
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
    expect(dummySendResult).not.toBeOk();
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
