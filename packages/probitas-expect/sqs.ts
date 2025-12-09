import {
  buildCountAtLeastError,
  buildCountAtMostError,
  buildCountError,
  containsSubset,
  createDurationMethods,
} from "./common.ts";
import type {
  SqsDeleteBatchResult,
  SqsDeleteQueueResult,
  SqsDeleteResult,
  SqsEnsureQueueResult,
  SqsMessage,
  SqsMessageAttribute,
  SqsMessages,
  SqsReceiveResult,
  SqsResult,
  SqsSendBatchResult,
  SqsSendResult,
} from "@probitas/client-sqs";

/**
 * Fluent API for SQS send result validation.
 */
export interface SqsSendResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectSqsResult(sendResult).not.toBeSuccessful();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the send operation completed successfully.
   *
   * @example
   * ```ts
   * expectSqsResult(sendResult).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the send result contains a messageId.
   *
   * @example
   * ```ts
   * expectSqsResult(sendResult).toHaveMessageId();
   * ```
   */
  toHaveMessageId(): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - Maximum duration in milliseconds
   * @example
   * ```ts
   * expectSqsResult(sendResult).toHaveDurationLessThan(1000);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - Maximum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqsResult(sendResult).toHaveDurationLessThanOrEqual(1000);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - Minimum duration in milliseconds
   * @example
   * ```ts
   * expectSqsResult(sendResult).toHaveDurationGreaterThan(100);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - Minimum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqsResult(sendResult).toHaveDurationGreaterThanOrEqual(100);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for SQS send batch result validation.
 */
export interface SqsSendBatchResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectSqsResult(batchResult).not.toBeSuccessful();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the batch send operation completed successfully.
   *
   * @example
   * ```ts
   * expectSqsResult(batchResult).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that all messages in the batch were sent successfully (no failures).
   *
   * @example
   * ```ts
   * expectSqsResult(batchResult).toBeAllSuccessful();
   * ```
   */
  toBeAllSuccessful(): this;

  /**
   * Asserts that the count of successfully sent messages matches the expected value.
   *
   * @param count - The expected number of successful messages
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveSuccessfulCount(5);
   * ```
   */
  toHaveSuccessfulCount(count: number): this;

  /**
   * Asserts that the count of successfully sent messages is greater than the threshold.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveSuccessfulCountGreaterThan(3);
   * ```
   */
  toHaveSuccessfulCountGreaterThan(count: number): this;

  /**
   * Asserts that the count of successfully sent messages is at least the minimum.
   *
   * @param count - The minimum count (inclusive)
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveSuccessfulCountGreaterThanOrEqual(5);
   * ```
   */
  toHaveSuccessfulCountGreaterThanOrEqual(count: number): this;

  /**
   * Asserts that the count of successfully sent messages is less than the threshold.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveSuccessfulCountLessThan(10);
   * ```
   */
  toHaveSuccessfulCountLessThan(count: number): this;

  /**
   * Asserts that the count of successfully sent messages is at most the maximum.
   *
   * @param count - The maximum count (inclusive)
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveSuccessfulCountLessThanOrEqual(10);
   * ```
   */
  toHaveSuccessfulCountLessThanOrEqual(count: number): this;

  /**
   * Asserts that the count of failed messages matches the expected value.
   *
   * @param count - The expected number of failed messages
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveFailedCount(0);
   * ```
   */
  toHaveFailedCount(count: number): this;

  /**
   * Asserts that the count of failed messages is greater than the threshold.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveFailedCountGreaterThan(0);
   * ```
   */
  toHaveFailedCountGreaterThan(count: number): this;

  /**
   * Asserts that the count of failed messages is at least the minimum.
   *
   * @param count - The minimum count (inclusive)
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveFailedCountGreaterThanOrEqual(1);
   * ```
   */
  toHaveFailedCountGreaterThanOrEqual(count: number): this;

  /**
   * Asserts that the count of failed messages is less than the threshold.
   *
   * @param count - The threshold value
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveFailedCountLessThan(5);
   * ```
   */
  toHaveFailedCountLessThan(count: number): this;

  /**
   * Asserts that the count of failed messages is at most the maximum.
   *
   * @param count - The maximum count (inclusive)
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveFailedCountLessThanOrEqual(2);
   * ```
   */
  toHaveFailedCountLessThanOrEqual(count: number): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - Maximum duration in milliseconds
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveDurationLessThan(2000);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - Maximum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveDurationLessThanOrEqual(2000);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - Minimum duration in milliseconds
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveDurationGreaterThan(100);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - Minimum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqsResult(batchResult).toHaveDurationGreaterThanOrEqual(100);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for SQS receive result validation.
 */
export interface SqsReceiveResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectSqsResult(receiveResult).not.toHaveContent();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the receive operation completed successfully.
   *
   * @example
   * ```ts
   * expectSqsResult(receiveResult).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that at least one message was received.
   *
   * @example
   * ```ts
   * expectSqsResult(receiveResult).toHaveContent();
   * ```
   */
  toHaveContent(): this;

  /**
   * Asserts that the message count matches the expected value.
   *
   * @param expected - The expected number of messages
   * @example
   * ```ts
   * expectSqsResult(receiveResult).toHaveLength(5);
   * ```
   */
  toHaveLength(expected: number): this;

  /**
   * Asserts that the message count is at least the minimum.
   *
   * @param min - The minimum count (inclusive)
   * @example
   * ```ts
   * expectSqsResult(receiveResult).toHaveLengthGreaterThanOrEqual(1);
   * ```
   */
  toHaveLengthGreaterThanOrEqual(min: number): this;

  /**
   * Asserts that the message count is at most the maximum.
   *
   * @param max - The maximum count (inclusive)
   * @example
   * ```ts
   * expectSqsResult(receiveResult).toHaveLengthLessThanOrEqual(10);
   * ```
   */
  toHaveLengthLessThanOrEqual(max: number): this;

  /**
   * Asserts that at least one message contains the given subset of properties.
   *
   * @param subset - Object containing optional body and attributes to match
   * @example
   * ```ts
   * expectSqsResult(receiveResult).toMatchObject({
   *   body: "orderId",
   *   attributes: { type: "ORDER" },
   * });
   * ```
   */
  toMatchObject(
    subset: { body?: string; attributes?: Record<string, string> },
  ): this;

  /**
   * Asserts messages using a custom matcher function.
   *
   * @param matcher - Custom function to validate the messages array
   * @example
   * ```ts
   * expectSqsResult(receiveResult).toSatisfy((messages) => {
   *   if (messages.length === 0) throw new Error("No messages");
   *   if (!messages[0].body.includes("order")) throw new Error("Missing order");
   * });
   * ```
   */
  toSatisfy(matcher: (messages: SqsMessages) => void): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - Maximum duration in milliseconds
   * @example
   * ```ts
   * expectSqsResult(receiveResult).toHaveDurationLessThan(5000);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - Maximum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqsResult(receiveResult).toHaveDurationLessThanOrEqual(5000);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - Minimum duration in milliseconds
   * @example
   * ```ts
   * expectSqsResult(receiveResult).toHaveDurationGreaterThan(100);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - Minimum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqsResult(receiveResult).toHaveDurationGreaterThanOrEqual(100);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for SQS delete result validation.
 */
export interface SqsDeleteResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectSqsResult(deleteResult).not.toBeSuccessful();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the delete operation completed successfully.
   *
   * @example
   * ```ts
   * expectSqsResult(deleteResult).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - Maximum duration in milliseconds
   * @example
   * ```ts
   * expectSqsResult(deleteResult).toHaveDurationLessThan(1000);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - Maximum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqsResult(deleteResult).toHaveDurationLessThanOrEqual(1000);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - Minimum duration in milliseconds
   * @example
   * ```ts
   * expectSqsResult(deleteResult).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - Minimum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqsResult(deleteResult).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for SQS message validation.
 */
export interface SqsMessageExpectation {
  /**
   * Asserts that the message body contains the given substring.
   *
   * @param substring - The substring to search for in the body
   * @example
   * ```ts
   * expectSqsMessage(message).toHaveBodyContaining("orderId");
   * ```
   */
  toHaveBodyContaining(substring: string): this;

  /**
   * Asserts the message body using a custom matcher function.
   *
   * @param matcher - Custom function to validate the body
   * @example
   * ```ts
   * expectSqsMessage(message).toHaveBodyMatching((body) => {
   *   if (!body.startsWith("{")) throw new Error("Body must be JSON");
   * });
   * ```
   */
  toHaveBodyMatching(matcher: (body: string) => void): this;

  /**
   * Asserts that the message body equals the expected JSON (deep equality).
   *
   * @param expected - The expected JSON object
   * @example
   * ```ts
   * expectSqsMessage(message).toHaveBodyJsonEqualTo({
   *   orderId: "123",
   *   status: "pending",
   * });
   * ```
   */
  // deno-lint-ignore no-explicit-any
  toHaveBodyJsonEqualTo<T = any>(expected: T): this;

  /**
   * Asserts that the message body JSON contains the given subset of properties.
   *
   * @param subset - Partial object to match against the body JSON
   * @example
   * ```ts
   * expectSqsMessage(message).toHaveBodyJsonContaining({ orderId: "123" });
   * ```
   */
  // deno-lint-ignore no-explicit-any
  toHaveBodyJsonContaining<T = any>(subset: Partial<T>): this;

  /**
   * Asserts that the message has the given attribute.
   *
   * @param name - The attribute name to check for
   * @example
   * ```ts
   * expectSqsMessage(message).toHaveAttribute("correlationId");
   * ```
   */
  toHaveAttribute(name: string): this;

  /**
   * Asserts that the message attributes contain the given subset.
   *
   * @param subset - Record of attribute names to partial attribute values
   * @example
   * ```ts
   * expectSqsMessage(message).toHaveAttributesContaining({
   *   correlationId: { stringValue: "abc-123" },
   *   messageType: { stringValue: "ORDER" },
   * });
   * ```
   */
  toHaveAttributesContaining(
    subset: Record<string, Partial<SqsMessageAttribute>>,
  ): this;

  /**
   * Asserts that the messageId matches the expected value.
   *
   * @param expected - The expected messageId
   * @example
   * ```ts
   * expectSqsMessage(message).toHaveMessageId("msg-12345");
   * ```
   */
  toHaveMessageId(expected: string): this;
}

/**
 * Fluent API for SQS ensure queue result validation.
 */
export interface SqsEnsureQueueResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectSqsResult(ensureQueueResult).not.toBeSuccessful();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the ensure queue operation completed successfully.
   *
   * @example
   * ```ts
   * expectSqsResult(ensureQueueResult).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the queue URL is present in the result.
   *
   * @example
   * ```ts
   * expectSqsResult(ensureQueueResult).toHaveQueueUrl();
   * ```
   */
  toHaveQueueUrl(): this;

  /**
   * Asserts that the queue URL matches the expected value.
   *
   * @param expected - The expected queue URL
   * @example
   * ```ts
   * expectSqsResult(ensureQueueResult).toHaveQueueUrl(
   *   "http://localhost:4566/000000000000/my-queue"
   * );
   * ```
   */
  toHaveQueueUrl(expected: string): this;

  /**
   * Asserts that the queue URL contains the given substring.
   *
   * @param substring - The substring to search for in the queue URL
   * @example
   * ```ts
   * expectSqsResult(ensureQueueResult).toHaveQueueUrlContaining("my-queue");
   * ```
   */
  toHaveQueueUrlContaining(substring: string): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - Maximum duration in milliseconds
   * @example
   * ```ts
   * expectSqsResult(ensureQueueResult).toHaveDurationLessThan(2000);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - Maximum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqsResult(ensureQueueResult).toHaveDurationLessThanOrEqual(2000);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - Minimum duration in milliseconds
   * @example
   * ```ts
   * expectSqsResult(ensureQueueResult).toHaveDurationGreaterThan(100);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - Minimum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqsResult(ensureQueueResult).toHaveDurationGreaterThanOrEqual(100);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for SQS delete queue result validation.
 */
export interface SqsDeleteQueueResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectSqsResult(deleteQueueResult).not.toBeSuccessful();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the delete queue operation completed successfully.
   *
   * @example
   * ```ts
   * expectSqsResult(deleteQueueResult).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - Maximum duration in milliseconds
   * @example
   * ```ts
   * expectSqsResult(deleteQueueResult).toHaveDurationLessThan(1000);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - Maximum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqsResult(deleteQueueResult).toHaveDurationLessThanOrEqual(1000);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - Minimum duration in milliseconds
   * @example
   * ```ts
   * expectSqsResult(deleteQueueResult).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - Minimum duration in milliseconds (inclusive)
   * @example
   * ```ts
   * expectSqsResult(deleteQueueResult).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Create expectation for SQS send result.
 */
function expectSqsSendResult(
  result: SqsSendResult,
  negate = false,
): SqsSendResultExpectation {
  const self: SqsSendResultExpectation = {
    get not(): SqsSendResultExpectation {
      return expectSqsSendResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? "Expected not ok result, but ok is true"
            : "Expected ok result, but ok is false",
        );
      }
      return this;
    },

    toHaveMessageId() {
      const hasId = !!result.messageId;
      if (negate ? hasId : !hasId) {
        throw new Error(
          negate
            ? "Expected no messageId, but messageId exists"
            : "Expected messageId, but messageId is undefined",
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create expectation for SQS send batch result.
 */
function expectSqsSendBatchResult(
  result: SqsSendBatchResult,
  negate = false,
): SqsSendBatchResultExpectation {
  const self: SqsSendBatchResultExpectation = {
    get not(): SqsSendBatchResultExpectation {
      return expectSqsSendBatchResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? "Expected not ok result, but ok is true"
            : "Expected ok result, but ok is false",
        );
      }
      return this;
    },

    toBeAllSuccessful() {
      const allSuccess = result.failed.length === 0;
      if (negate ? allSuccess : !allSuccess) {
        throw new Error(
          negate
            ? "Expected some failures, but all messages were successful"
            : `Expected all messages successful, but ${result.failed.length} failed`,
        );
      }
      return this;
    },

    toHaveSuccessfulCount(count: number) {
      const match = result.successful.length === count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected successful count to not be ${count}, got ${result.successful.length}`
            : buildCountError(count, result.successful.length, "successful"),
        );
      }
      return this;
    },

    toHaveSuccessfulCountGreaterThan(count: number) {
      const match = result.successful.length > count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected successful count to not be > ${count}, got ${result.successful.length}`
            : `Expected successful count > ${count}, but got ${result.successful.length}`,
        );
      }
      return this;
    },

    toHaveSuccessfulCountGreaterThanOrEqual(count: number) {
      const match = result.successful.length >= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected successful count to not be >= ${count}, got ${result.successful.length}`
            : `Expected successful count >= ${count}, but got ${result.successful.length}`,
        );
      }
      return this;
    },

    toHaveSuccessfulCountLessThan(count: number) {
      const match = result.successful.length < count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected successful count to not be < ${count}, got ${result.successful.length}`
            : `Expected successful count < ${count}, but got ${result.successful.length}`,
        );
      }
      return this;
    },

    toHaveSuccessfulCountLessThanOrEqual(count: number) {
      const match = result.successful.length <= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected successful count to not be <= ${count}, got ${result.successful.length}`
            : `Expected successful count <= ${count}, but got ${result.successful.length}`,
        );
      }
      return this;
    },

    toHaveFailedCount(count: number) {
      const match = result.failed.length === count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected failed count to not be ${count}, got ${result.failed.length}`
            : buildCountError(count, result.failed.length, "failed"),
        );
      }
      return this;
    },

    toHaveFailedCountGreaterThan(count: number) {
      const match = result.failed.length > count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected failed count to not be > ${count}, got ${result.failed.length}`
            : `Expected failed count > ${count}, but got ${result.failed.length}`,
        );
      }
      return this;
    },

    toHaveFailedCountGreaterThanOrEqual(count: number) {
      const match = result.failed.length >= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected failed count to not be >= ${count}, got ${result.failed.length}`
            : `Expected failed count >= ${count}, but got ${result.failed.length}`,
        );
      }
      return this;
    },

    toHaveFailedCountLessThan(count: number) {
      const match = result.failed.length < count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected failed count to not be < ${count}, got ${result.failed.length}`
            : `Expected failed count < ${count}, but got ${result.failed.length}`,
        );
      }
      return this;
    },

    toHaveFailedCountLessThanOrEqual(count: number) {
      const match = result.failed.length <= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected failed count to not be <= ${count}, got ${result.failed.length}`
            : `Expected failed count <= ${count}, but got ${result.failed.length}`,
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create expectation for SQS receive result.
 */
function expectSqsReceiveResult(
  result: SqsReceiveResult,
  negate = false,
): SqsReceiveResultExpectation {
  const self: SqsReceiveResultExpectation = {
    get not(): SqsReceiveResultExpectation {
      return expectSqsReceiveResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? "Expected not ok result, but ok is true"
            : "Expected ok result, but ok is false",
        );
      }
      return this;
    },

    toHaveContent() {
      const hasContent = result.messages.length > 0;
      if (negate ? hasContent : !hasContent) {
        throw new Error(
          negate
            ? `Expected no messages, but got ${result.messages.length} messages`
            : "Expected messages, but messages array is empty",
        );
      }
      return this;
    },

    toHaveLength(expected: number) {
      const match = result.messages.length === expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected message count to not be ${expected}, got ${result.messages.length}`
            : buildCountError(expected, result.messages.length, "messages"),
        );
      }
      return this;
    },

    toHaveLengthGreaterThanOrEqual(min: number) {
      const match = result.messages.length >= min;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected message count to not be >= ${min}, got ${result.messages.length}`
            : buildCountAtLeastError(min, result.messages.length, "messages"),
        );
      }
      return this;
    },

    toHaveLengthLessThanOrEqual(max: number) {
      const match = result.messages.length <= max;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected message count to not be <= ${max}, got ${result.messages.length}`
            : buildCountAtMostError(max, result.messages.length, "messages"),
        );
      }
      return this;
    },

    toMatchObject(
      subset: { body?: string; attributes?: Record<string, string> },
    ) {
      const found = result.messages.some((msg) => {
        if (subset.body !== undefined && !msg.body.includes(subset.body)) {
          return false;
        }
        if (subset.attributes !== undefined) {
          for (const [key, value] of Object.entries(subset.attributes)) {
            if (msg.attributes[key] !== value) {
              return false;
            }
          }
        }
        return true;
      });

      if (negate ? found : !found) {
        throw new Error(
          negate
            ? `Expected no message to contain ${
              JSON.stringify(subset)
            }, but found one`
            : `Expected at least one message to contain ${
              JSON.stringify(subset)
            }`,
        );
      }
      return this;
    },

    toSatisfy(matcher: (messages: SqsMessages) => void) {
      matcher(result.messages);
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create expectation for SQS delete result.
 */
function expectSqsDeleteResult(
  result: SqsDeleteResult,
  negate = false,
): SqsDeleteResultExpectation {
  const self: SqsDeleteResultExpectation = {
    get not(): SqsDeleteResultExpectation {
      return expectSqsDeleteResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? "Expected not ok result, but ok is true"
            : "Expected ok result, but ok is false",
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create expectation for SQS delete batch result.
 */
function expectSqsDeleteBatchResult(
  result: SqsDeleteBatchResult,
  negate = false,
): SqsSendBatchResultExpectation {
  const self: SqsSendBatchResultExpectation = {
    get not(): SqsSendBatchResultExpectation {
      return expectSqsDeleteBatchResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? "Expected not ok result, but ok is true"
            : "Expected ok result, but ok is false",
        );
      }
      return this;
    },

    toBeAllSuccessful() {
      const allSuccess = result.failed.length === 0;
      if (negate ? allSuccess : !allSuccess) {
        throw new Error(
          negate
            ? "Expected some failures, but all deletions were successful"
            : `Expected all deletions successful, but ${result.failed.length} failed`,
        );
      }
      return this;
    },

    toHaveSuccessfulCount(count: number) {
      const match = result.successful.length === count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected successful count to not be ${count}, got ${result.successful.length}`
            : buildCountError(count, result.successful.length, "successful"),
        );
      }
      return this;
    },

    toHaveSuccessfulCountGreaterThan(count: number) {
      const match = result.successful.length > count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected successful count to not be > ${count}, got ${result.successful.length}`
            : `Expected successful count > ${count}, but got ${result.successful.length}`,
        );
      }
      return this;
    },

    toHaveSuccessfulCountGreaterThanOrEqual(count: number) {
      const match = result.successful.length >= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected successful count to not be >= ${count}, got ${result.successful.length}`
            : `Expected successful count >= ${count}, but got ${result.successful.length}`,
        );
      }
      return this;
    },

    toHaveSuccessfulCountLessThan(count: number) {
      const match = result.successful.length < count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected successful count to not be < ${count}, got ${result.successful.length}`
            : `Expected successful count < ${count}, but got ${result.successful.length}`,
        );
      }
      return this;
    },

    toHaveSuccessfulCountLessThanOrEqual(count: number) {
      const match = result.successful.length <= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected successful count to not be <= ${count}, got ${result.successful.length}`
            : `Expected successful count <= ${count}, but got ${result.successful.length}`,
        );
      }
      return this;
    },

    toHaveFailedCount(count: number) {
      const match = result.failed.length === count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected failed count to not be ${count}, got ${result.failed.length}`
            : buildCountError(count, result.failed.length, "failed"),
        );
      }
      return this;
    },

    toHaveFailedCountGreaterThan(count: number) {
      const match = result.failed.length > count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected failed count to not be > ${count}, got ${result.failed.length}`
            : `Expected failed count > ${count}, but got ${result.failed.length}`,
        );
      }
      return this;
    },

    toHaveFailedCountGreaterThanOrEqual(count: number) {
      const match = result.failed.length >= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected failed count to not be >= ${count}, got ${result.failed.length}`
            : `Expected failed count >= ${count}, but got ${result.failed.length}`,
        );
      }
      return this;
    },

    toHaveFailedCountLessThan(count: number) {
      const match = result.failed.length < count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected failed count to not be < ${count}, got ${result.failed.length}`
            : `Expected failed count < ${count}, but got ${result.failed.length}`,
        );
      }
      return this;
    },

    toHaveFailedCountLessThanOrEqual(count: number) {
      const match = result.failed.length <= count;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected failed count to not be <= ${count}, got ${result.failed.length}`
            : `Expected failed count <= ${count}, but got ${result.failed.length}`,
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create a fluent expectation chain for SQS message validation.
 */
export function expectSqsMessage(
  message: SqsMessage,
): SqsMessageExpectation {
  const self: SqsMessageExpectation = {
    toHaveBodyContaining(substring: string) {
      if (!message.body.includes(substring)) {
        throw new Error(
          `Expected body to contain "${substring}", but got "${message.body}"`,
        );
      }
      return this;
    },

    toHaveBodyMatching(matcher: (body: string) => void) {
      matcher(message.body);
      return this;
    },

    // deno-lint-ignore no-explicit-any
    toHaveBodyJsonEqualTo<T = any>(expected: T) {
      const actual = JSON.parse(message.body);
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
          `Expected body JSON to equal ${JSON.stringify(expected)}, got ${
            JSON.stringify(actual)
          }`,
        );
      }
      return this;
    },

    // deno-lint-ignore no-explicit-any
    toHaveBodyJsonContaining<T = any>(subset: Partial<T>) {
      const actual = JSON.parse(message.body);
      if (!containsSubset(actual, subset)) {
        throw new Error(
          `Expected body JSON to contain ${JSON.stringify(subset)}, got ${
            JSON.stringify(actual)
          }`,
        );
      }
      return this;
    },

    toHaveAttribute(name: string) {
      if (!message.messageAttributes?.[name]) {
        throw new Error(`Expected message to have attribute "${name}"`);
      }
      return this;
    },

    toHaveAttributesContaining(
      subset: Record<string, Partial<SqsMessageAttribute>>,
    ) {
      const attrs = message.messageAttributes ?? {};
      for (const [key, expected] of Object.entries(subset)) {
        const actual = attrs[key];
        if (!actual) {
          throw new Error(`Expected attribute "${key}" to exist`);
        }
        if (!containsSubset(actual, expected)) {
          throw new Error(
            `Expected attribute "${key}" to contain ${
              JSON.stringify(expected)
            }, got ${JSON.stringify(actual)}`,
          );
        }
      }
      return this;
    },

    toHaveMessageId(expected: string) {
      if (message.messageId !== expected) {
        throw new Error(
          `Expected messageId "${expected}", got "${message.messageId}"`,
        );
      }
      return this;
    },
  };

  return self;
}

/**
 * Create expectation for SQS ensure queue result.
 */
function expectSqsEnsureQueueResult(
  result: SqsEnsureQueueResult,
  negate = false,
): SqsEnsureQueueResultExpectation {
  const self: SqsEnsureQueueResultExpectation = {
    get not(): SqsEnsureQueueResultExpectation {
      return expectSqsEnsureQueueResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? "Expected not ok result, but ok is true"
            : "Expected ok result, but ok is false",
        );
      }
      return this;
    },

    toHaveQueueUrl(expected?: string) {
      if (expected !== undefined) {
        const match = result.queueUrl === expected;
        if (negate ? match : !match) {
          throw new Error(
            negate
              ? `Expected queueUrl to not be "${expected}", got "${result.queueUrl}"`
              : `Expected queueUrl "${expected}", got "${result.queueUrl}"`,
          );
        }
      } else {
        const hasUrl = !!result.queueUrl;
        if (negate ? hasUrl : !hasUrl) {
          throw new Error(
            negate
              ? "Expected no queueUrl, but queueUrl exists"
              : "Expected queueUrl, but queueUrl is empty",
          );
        }
      }
      return this;
    },

    toHaveQueueUrlContaining(substring: string) {
      const contains = result.queueUrl.includes(substring);
      if (negate ? contains : !contains) {
        throw new Error(
          negate
            ? `Expected queueUrl to not contain "${substring}", got "${result.queueUrl}"`
            : `Expected queueUrl to contain "${substring}", got "${result.queueUrl}"`,
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

/**
 * Create expectation for SQS delete queue result.
 */
function expectSqsDeleteQueueResult(
  result: SqsDeleteQueueResult,
  negate = false,
): SqsDeleteQueueResultExpectation {
  const self: SqsDeleteQueueResultExpectation = {
    get not(): SqsDeleteQueueResultExpectation {
      return expectSqsDeleteQueueResult(result, !negate);
    },

    toBeSuccessful() {
      const isSuccess = result.ok;
      if (negate ? isSuccess : !isSuccess) {
        throw new Error(
          negate
            ? "Expected not ok result, but ok is true"
            : "Expected ok result, but ok is false",
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}

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
 * const sendResult = await sqs.send(JSON.stringify({ orderId: "123" }));
 * expectSqsResult(sendResult)
 *   .toBeSuccessful()
 *   .hasMessageId()
 *   .toHaveDurationLessThan(1000);
 * ```
 *
 * @example Receive result validation
 * ```ts
 * const receiveResult = await sqs.receive({ maxMessages: 10 });
 * expectSqsResult(receiveResult)
 *   .toBeSuccessful()
 *   .toHaveContent()
 *   .countAtLeast(1)
 *   .toMatchObject({ body: "orderId" });
 * ```
 *
 * @example Batch operations
 * ```ts
 * // Send batch
 * const batchResult = await sqs.sendBatch([
 *   { id: "1", body: "msg1" },
 *   { id: "2", body: "msg2" },
 * ]);
 * expectSqsResult(batchResult)
 *   .toBeSuccessful()
 *   .allSuccessful()
 *   .noFailures();
 *
 * // Delete batch
 * const deleteResult = await sqs.deleteBatch(receiptHandles);
 * expectSqsResult(deleteResult)
 *   .toBeSuccessful()
 *   .successfulCount(2);
 * ```
 *
 * @example Queue management
 * ```ts
 * // Ensure queue exists
 * const ensureResult = await sqs.ensureQueue("test-queue");
 * expectSqsResult(ensureResult)
 *   .toBeSuccessful()
 *   .hasQueueUrl()
 *   .queueUrlContains("test-queue");
 *
 * // Delete queue
 * const deleteResult = await sqs.deleteQueue(queueUrl);
 * expectSqsResult(deleteResult).toBeSuccessful();
 * ```
 *
 * @example Individual message validation
 * ```ts
 * const receiveResult = await sqs.receive();
 * for (const msg of receiveResult.messages) {
 *   expectSqsMessage(msg)
 *     .bodyJsonContains({ type: "ORDER" })
 *     .hasAttribute("correlationId");
 * }
 * ```
 */
export function expectSqsResult<R extends SqsResult>(
  result: R,
): SqsExpectation<R> {
  switch (result.type) {
    case "sqs:send":
      return expectSqsSendResult(
        result as SqsSendResult,
      ) as unknown as SqsExpectation<R>;
    case "sqs:send-batch":
      return expectSqsSendBatchResult(
        result as SqsSendBatchResult,
      ) as unknown as SqsExpectation<R>;
    case "sqs:receive":
      return expectSqsReceiveResult(
        result as SqsReceiveResult,
      ) as unknown as SqsExpectation<R>;
    case "sqs:delete":
      return expectSqsDeleteResult(
        result as SqsDeleteResult,
      ) as unknown as SqsExpectation<R>;
    case "sqs:delete-batch":
      return expectSqsDeleteBatchResult(
        result as SqsDeleteBatchResult,
      ) as unknown as SqsExpectation<R>;
    case "sqs:ensure-queue":
      return expectSqsEnsureQueueResult(
        result as SqsEnsureQueueResult,
      ) as unknown as SqsExpectation<R>;
    case "sqs:delete-queue":
      return expectSqsDeleteQueueResult(
        result as SqsDeleteQueueResult,
      ) as unknown as SqsExpectation<R>;
    default:
      throw new Error(
        `Unknown SQS result type: ${(result as { type: string }).type}`,
      );
  }
}
