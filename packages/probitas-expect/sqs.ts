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
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation completed successfully */
  toBeSuccessful(): this;

  /** Assert that messageId is present */
  toHaveMessageId(): this;

  /** Assert that operation duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that operation duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that operation duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that operation duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for SQS send batch result validation.
 */
export interface SqsSendBatchResultExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation completed successfully */
  toBeSuccessful(): this;

  /** Assert that all messages were sent successfully (no failures) */
  toBeAllSuccessful(): this;

  /** Assert that successful count matches expected value */
  toHaveSuccessfulCount(count: number): this;

  /** Assert that successful count is greater than threshold */
  toHaveSuccessfulCountGreaterThan(count: number): this;

  /** Assert that successful count is at least the minimum */
  toHaveSuccessfulCountGreaterThanOrEqual(count: number): this;

  /** Assert that successful count is less than threshold */
  toHaveSuccessfulCountLessThan(count: number): this;

  /** Assert that successful count is at most the maximum */
  toHaveSuccessfulCountLessThanOrEqual(count: number): this;

  /** Assert that failed count matches expected value */
  toHaveFailedCount(count: number): this;

  /** Assert that failed count is greater than threshold */
  toHaveFailedCountGreaterThan(count: number): this;

  /** Assert that failed count is at least the minimum */
  toHaveFailedCountGreaterThanOrEqual(count: number): this;

  /** Assert that failed count is less than threshold */
  toHaveFailedCountLessThan(count: number): this;

  /** Assert that failed count is at most the maximum */
  toHaveFailedCountLessThanOrEqual(count: number): this;

  /** Assert that operation duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that operation duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that operation duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that operation duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for SQS receive result validation.
 */
export interface SqsReceiveResultExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation completed successfully */
  toBeSuccessful(): this;

  /** Assert that at least one message was received */
  toHaveContent(): this;

  /** Assert that message count matches expected value */
  toHaveLength(expected: number): this;

  /** Assert that message count is at least the minimum */
  toHaveLengthGreaterThanOrEqual(min: number): this;

  /** Assert that message count is at most the maximum */
  toHaveLengthLessThanOrEqual(max: number): this;

  /** Assert that at least one message contains the given subset */
  toMatchObject(
    subset: { body?: string; attributes?: Record<string, string> },
  ): this;

  /** Assert messages using custom matcher function */
  toSatisfy(matcher: (messages: SqsMessages) => void): this;

  /** Assert that operation duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that operation duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that operation duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that operation duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for SQS delete result validation.
 */
export interface SqsDeleteResultExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation completed successfully */
  toBeSuccessful(): this;

  /** Assert that operation duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that operation duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that operation duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that operation duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for SQS message validation.
 */
export interface SqsMessageExpectation {
  /** Assert that body contains the given substring */
  toHaveBodyContaining(substring: string): this;

  /** Assert body using custom matcher function */
  toHaveBodyMatching(matcher: (body: string) => void): this;

  /** Assert that body equals expected JSON (deep equality) */
  // deno-lint-ignore no-explicit-any
  toHaveBodyJsonEqualTo<T = any>(expected: T): this;

  /** Assert that body JSON contains the given subset */
  // deno-lint-ignore no-explicit-any
  toHaveBodyJsonContaining<T = any>(subset: Partial<T>): this;

  /** Assert that message has the given attribute */
  toHaveAttribute(name: string): this;

  /** Assert that message attributes contain the given subset */
  toHaveAttributesContaining(
    subset: Record<string, Partial<SqsMessageAttribute>>,
  ): this;

  /** Assert that messageId matches expected */
  toHaveMessageId(expected: string): this;
}

/**
 * Fluent API for SQS ensure queue result validation.
 */
export interface SqsEnsureQueueResultExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation completed successfully */
  toBeSuccessful(): this;

  /** Assert that queueUrl is present */
  toHaveQueueUrl(): this;

  /** Assert that queueUrl matches expected value */
  toHaveQueueUrl(expected: string): this;

  /** Assert that queueUrl contains the given substring */
  toHaveQueueUrlContaining(substring: string): this;

  /** Assert that operation duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that operation duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that operation duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that operation duration is greater than or equal to threshold (ms) */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

/**
 * Fluent API for SQS delete queue result validation.
 */
export interface SqsDeleteQueueResultExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation completed successfully */
  toBeSuccessful(): this;

  /** Assert that operation duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;

  /** Assert that operation duration is less than or equal to threshold (ms) */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /** Assert that operation duration is greater than threshold (ms) */
  toHaveDurationGreaterThan(ms: number): this;

  /** Assert that operation duration is greater than or equal to threshold (ms) */
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
