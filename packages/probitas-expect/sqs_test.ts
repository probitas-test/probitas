import { assertExists, assertThrows } from "@std/assert";
import { expectSqsResult } from "./sqs.ts";
import {
  mockSqsDeleteBatchResult,
  mockSqsDeleteQueueResult,
  mockSqsDeleteResult,
  mockSqsEnsureQueueResult,
  mockSqsReceiveResult,
  mockSqsSendBatchResult,
  mockSqsSendResult,
} from "./sqs/_testutils.ts";

Deno.test("expectSqsResult - dispatches to send expectation", () => {
  const result = mockSqsSendResult();
  const expectation = expectSqsResult(result);

  // Verify it has send-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveMessageId);
  assertExists(expectation.toHaveMessageIdContaining);
  assertExists(expectation.toHaveDuration);

  // Verify methods work
  expectation.toBeOk();
  expectation.toHaveMessageId("msg-123");
});

Deno.test("expectSqsResult - dispatches to send batch expectation", () => {
  const result = mockSqsSendBatchResult();
  const expectation = expectSqsResult(result);

  // Verify it has send batch-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveSuccessful);
  assertExists(expectation.toHaveFailed);
  assertExists(expectation.toHaveFailedEmpty);
  assertExists(expectation.toHaveDuration);

  // Verify methods work
  expectation.toBeOk();
  expectation.toHaveFailedEmpty();
});

Deno.test("expectSqsResult - dispatches to receive expectation", () => {
  const result = mockSqsReceiveResult();
  const expectation = expectSqsResult(result);

  // Verify it has receive-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveMessages);
  assertExists(expectation.toHaveMessagesCount);
  assertExists(expectation.toHaveMessagesCountGreaterThan);
  assertExists(expectation.toHaveDuration);

  // Verify methods work
  expectation.toBeOk();
  expectation.toHaveMessagesCount(1);
});

Deno.test("expectSqsResult - dispatches to delete expectation", () => {
  const result = mockSqsDeleteResult();
  const expectation = expectSqsResult(result);

  // Verify it has delete-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveDuration);
  assertExists(expectation.toHaveDurationLessThan);

  // Verify methods work
  expectation.toBeOk();
  expectation.toHaveDuration(100);
});

Deno.test("expectSqsResult - dispatches to delete batch expectation", () => {
  const result = mockSqsDeleteBatchResult();
  const expectation = expectSqsResult(result);

  // Verify it has common methods (delete batch specific methods tested in delete_batch_test.ts)
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveDuration);

  // Verify methods work
  expectation.toBeOk();
  expectation.toHaveDuration(100);
});

Deno.test("expectSqsResult - dispatches to ensure queue expectation", () => {
  const result = mockSqsEnsureQueueResult();
  const expectation = expectSqsResult(result);

  // Verify it has ensure queue-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveQueueUrl);
  assertExists(expectation.toHaveQueueUrlContaining);
  assertExists(expectation.toHaveDuration);

  // Verify methods work
  expectation.toBeOk();
  expectation.toHaveQueueUrlContaining("test-queue");
});

Deno.test("expectSqsResult - dispatches to delete queue expectation", () => {
  const result = mockSqsDeleteQueueResult();
  const expectation = expectSqsResult(result);

  // Verify it has delete queue-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveDuration);
  assertExists(expectation.toHaveDurationLessThan);

  // Verify methods work
  expectation.toBeOk();
  expectation.toHaveDuration(100);
});

Deno.test("expectSqsResult - throws on unknown result type", () => {
  const unknownResult = { kind: "sqs:unknown", ok: true };

  assertThrows(
    // deno-lint-ignore no-explicit-any
    () => expectSqsResult(unknownResult as any),
    Error,
    "Unknown SQS result kind: sqs:unknown",
  );
});

Deno.test("expectSqsResult - chaining works correctly", () => {
  const sendResult = mockSqsSendResult();
  expectSqsResult(sendResult)
    .toBeOk()
    .toHaveMessageId("msg-123")
    .toHaveDurationLessThan(200);

  const receiveResult = mockSqsReceiveResult();
  expectSqsResult(receiveResult)
    .toBeOk()
    .toHaveMessagesCountGreaterThan(0)
    .toHaveDurationLessThan(200);
});

Deno.test("expectSqsResult - not property works correctly", () => {
  const failedResult = mockSqsSendResult({ ok: false });
  const expectation = expectSqsResult(failedResult);

  expectation.not.toBeOk();
});
