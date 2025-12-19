import type {
  SqsDeleteBatchResult,
  SqsDeleteQueueResult,
  SqsDeleteResult,
  SqsEnsureQueueResult,
  SqsMessage,
  SqsReceiveResult,
  SqsSendBatchResult,
  SqsSendResult,
} from "@probitas/client-sqs";

// Note: These use type assertions because the result types are discriminated
// unions with literal types (ok: true, processed: true). The spread operator
// would widen these to boolean, breaking the type narrowing.
export const mockSqsSendResult = (
  overrides: Partial<SqsSendResult> = {},
): SqsSendResult => {
  const base = {
    kind: "sqs:send",
    processed: true,
    ok: true,
    error: null,
    messageId: "msg-123",
    md5OfBody: "md5hash",
    sequenceNumber: undefined,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as SqsSendResult;
};

export const mockSqsSendBatchResult = (
  overrides: Partial<SqsSendBatchResult> = {},
): SqsSendBatchResult => {
  const base = {
    kind: "sqs:send-batch",
    processed: true,
    ok: true,
    error: null,
    successful: [{ id: "1", messageId: "msg-1" }],
    failed: [],
    duration: 100,
  } as const;
  return { ...base, ...overrides } as SqsSendBatchResult;
};

export const mockSqsReceiveResult = (
  overrides: Partial<Omit<SqsReceiveResult, "messages">> & {
    messages?: readonly SqsMessage[];
  } = {},
): SqsReceiveResult => {
  const { messages: rawMessages, ...rest } = overrides;
  const defaultMessages: readonly SqsMessage[] = [
    {
      messageId: "m1",
      body: '{"order":"123"}',
      attributes: {},
      receiptHandle: "r1",
      md5OfBody: "md5hash",
    },
  ];
  const base = {
    kind: "sqs:receive",
    processed: true,
    ok: true,
    error: null,
    messages: rawMessages ?? defaultMessages,
    duration: 100,
  } as const;
  return { ...base, ...rest } as SqsReceiveResult;
};

export const mockSqsDeleteResult = (
  overrides: Partial<SqsDeleteResult> = {},
): SqsDeleteResult => {
  const base = {
    kind: "sqs:delete",
    processed: true,
    ok: true,
    error: null,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as SqsDeleteResult;
};

export const mockSqsDeleteBatchResult = (
  overrides: Partial<SqsDeleteBatchResult> = {},
): SqsDeleteBatchResult => {
  const base = {
    kind: "sqs:delete-batch",
    processed: true,
    ok: true,
    error: null,
    successful: ["1"],
    failed: [],
    duration: 100,
  } as const;
  return { ...base, ...overrides } as SqsDeleteBatchResult;
};

export const mockSqsEnsureQueueResult = (
  overrides: Partial<SqsEnsureQueueResult> = {},
): SqsEnsureQueueResult => {
  const base = {
    kind: "sqs:ensure-queue",
    processed: true,
    ok: true,
    error: null,
    queueUrl: "https://sqs.us-east-1.amazonaws.com/123456/test-queue",
    duration: 100,
  } as const;
  return { ...base, ...overrides } as SqsEnsureQueueResult;
};

export const mockSqsDeleteQueueResult = (
  overrides: Partial<SqsDeleteQueueResult> = {},
): SqsDeleteQueueResult => {
  const base = {
    kind: "sqs:delete-queue",
    processed: true,
    ok: true,
    error: null,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as SqsDeleteQueueResult;
};

export const mockSqsMessage = (
  overrides: Partial<SqsMessage> = {},
): SqsMessage => ({
  messageId: "msg-123",
  body: '{"test":"value"}',
  attributes: {},
  receiptHandle: "handle-123",
  md5OfBody: "md5hash",
  ...overrides,
});
