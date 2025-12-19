import type {
  SqsDeleteBatchResult,
  SqsDeleteQueueResult,
  SqsDeleteResult,
  SqsEnsureQueueResult,
  SqsReceiveResult,
  SqsResult,
  SqsSendBatchResult,
  SqsSendResult,
} from "@probitas/client-sqs";
import {
  expectSqsSendResult,
  type SqsSendResultExpectation,
} from "./sqs/send.ts";
import {
  expectSqsSendBatchResult,
  type SqsSendBatchResultExpectation,
} from "./sqs/send_batch.ts";
import {
  expectSqsReceiveResult,
  type SqsReceiveResultExpectation,
} from "./sqs/receive.ts";
import {
  expectSqsDeleteResult,
  type SqsDeleteResultExpectation,
} from "./sqs/delete.ts";
import {
  expectSqsDeleteBatchResult,
  type SqsDeleteBatchResultExpectation,
} from "./sqs/delete_batch.ts";
import {
  expectSqsEnsureQueueResult,
  type SqsEnsureQueueResultExpectation,
} from "./sqs/ensure_queue.ts";
import {
  expectSqsDeleteQueueResult,
  type SqsDeleteQueueResultExpectation,
} from "./sqs/delete_queue.ts";

// Re-export interfaces
export type {
  SqsDeleteBatchResultExpectation,
  SqsDeleteQueueResultExpectation,
  SqsDeleteResultExpectation,
  SqsEnsureQueueResultExpectation,
  SqsReceiveResultExpectation,
  SqsSendBatchResultExpectation,
  SqsSendResultExpectation,
};

// Note: expectSqsMessage is not yet implemented in this refactoring phase
// export { expectSqsMessage, type SqsMessageExpectation } from "./sqs/message.ts";

/**
 * Expectation type returned by expectSqsResult based on the result type.
 */
export type SqsExpectation<R extends SqsResult> = R extends SqsSendResult
  ? SqsSendResultExpectation
  : R extends SqsSendBatchResult ? SqsSendBatchResultExpectation
  : R extends SqsReceiveResult ? SqsReceiveResultExpectation
  : R extends SqsDeleteResult ? SqsDeleteResultExpectation
  : R extends SqsDeleteBatchResult ? SqsSendBatchResultExpectation
  : R extends SqsEnsureQueueResult ? SqsEnsureQueueResultExpectation
  : R extends SqsDeleteQueueResult ? SqsDeleteQueueResultExpectation
  : never;

/**
 * Create a fluent expectation chain for any SQS result validation.
 *
 * This unified function accepts any SQS result type and returns
 * the appropriate expectation interface based on the result's type discriminator.
 * Supports send, sendBatch, receive, delete, deleteBatch, ensureQueue, and deleteQueue results.
 *
 * @param result - The SQS result to create expectations for
 * @returns A typed expectation object matching the result type
 *
 * @example Send result validation
 * ```ts
 * import type { SqsSendResult } from "@probitas/client-sqs";
 * import { expectSqsResult } from "./sqs.ts";
 * const sendResult = {
 *   kind: "sqs:send",
 *   ok: true,
 *   messageId: "msg-123",
 *   md5OfBody: "abc123",
 *   sequenceNumber: undefined,
 *   duration: 50,
 * } as unknown as SqsSendResult;
 * expectSqsResult(sendResult)
 *   .toBeOk()
 *   .toHaveMessageIdContaining("msg")
 *   .toHaveDurationLessThan(1000);
 * ```
 *
 * @example Receive result validation
 * ```ts
 * import type { SqsReceiveResult } from "@probitas/client-sqs";
 * import { expectSqsResult } from "./sqs.ts";
 * const receiveResult = {
 *   kind: "sqs:receive",
 *   ok: true,
 *   messages: [{ body: "test message" }],
 *   duration: 0,
 * } as unknown as SqsReceiveResult;
 * expectSqsResult(receiveResult)
 *   .toBeOk()
 *   .toHaveMessagesCountGreaterThanOrEqual(1);
 * ```
 *
 * @example Batch operations
 * ```ts
 * import type { SqsSendBatchResult } from "@probitas/client-sqs";
 * import { expectSqsResult } from "./sqs.ts";
 * const batchResult = {
 *   kind: "sqs:send-batch",
 *   ok: true,
 *   successful: [{ id: "1" }, { id: "2" }],
 *   failed: [],
 *   duration: 0,
 * } as unknown as SqsSendBatchResult;
 * expectSqsResult(batchResult)
 *   .toBeOk()
 *   .toHaveSuccessfulCount(2)
 *   .toHaveFailedEmpty();
 * ```
 *
 * @example Queue management
 * ```ts
 * import type { SqsEnsureQueueResult } from "@probitas/client-sqs";
 * import { expectSqsResult } from "./sqs.ts";
 * const ensureResult = {
 *   kind: "sqs:ensure-queue",
 *   ok: true,
 *   queueUrl: "https://sqs.example.com/test-queue",
 *   duration: 0,
 * } as unknown as SqsEnsureQueueResult;
 * expectSqsResult(ensureResult)
 *   .toBeOk()
 *   .toHaveQueueUrlContaining("test-queue");
 * ```
 */
export function expectSqsResult<R extends SqsResult>(
  result: R,
): SqsExpectation<R> {
  switch (result.kind) {
    case "sqs:send":
      return expectSqsSendResult(
        result as SqsSendResult,
      ) as SqsExpectation<R>;
    case "sqs:send-batch":
      return expectSqsSendBatchResult(
        result as SqsSendBatchResult,
      ) as SqsExpectation<R>;
    case "sqs:receive":
      return expectSqsReceiveResult(
        result as SqsReceiveResult,
      ) as SqsExpectation<R>;
    case "sqs:delete":
      return expectSqsDeleteResult(
        result as SqsDeleteResult,
      ) as SqsExpectation<R>;
    case "sqs:delete-batch":
      return expectSqsDeleteBatchResult(
        result as SqsDeleteBatchResult,
      ) as SqsExpectation<R>;
    case "sqs:ensure-queue":
      return expectSqsEnsureQueueResult(
        result as SqsEnsureQueueResult,
      ) as SqsExpectation<R>;
    case "sqs:delete-queue":
      return expectSqsDeleteQueueResult(
        result as SqsDeleteQueueResult,
      ) as SqsExpectation<R>;
    default:
      throw new Error(
        `Unknown SQS result kind: ${(result as { kind: string }).kind}`,
      );
  }
}
