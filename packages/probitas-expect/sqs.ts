import { containsSubset } from "./common.ts";
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
  /** Assert that result ok is true */
  ok(): this;

  /** Assert that result ok is false */
  notOk(): this;

  /** Assert that messageId exists */
  hasMessageId(): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for SQS send batch result validation.
 */
export interface SqsSendBatchResultExpectation {
  /** Assert that result ok is true */
  ok(): this;

  /** Assert that result ok is false */
  notOk(): this;

  /** Assert that all messages were sent successfully */
  allSuccessful(): this;

  /** Assert that successful count matches expected */
  successfulCount(count: number): this;

  /** Assert that failed count matches expected */
  failedCount(count: number): this;

  /** Assert that there are no failures */
  noFailures(): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for SQS receive result validation.
 */
export interface SqsReceiveResultExpectation {
  /** Assert that result ok is true */
  ok(): this;

  /** Assert that result ok is false */
  notOk(): this;

  /** Assert that messages array is empty */
  noContent(): this;

  /** Assert that messages array has at least one message */
  hasContent(): this;

  /** Assert that messages array has exactly count messages */
  count(expected: number): this;

  /** Assert that messages array has at least min messages */
  countAtLeast(min: number): this;

  /** Assert that messages array has at most max messages */
  countAtMost(max: number): this;

  /** Assert that at least one message contains the given subset */
  dataContains(
    subset: { body?: string; attributes?: Record<string, string> },
  ): this;

  /** Assert messages using custom matcher function */
  dataMatch(matcher: (messages: SqsMessages) => void): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for SQS delete result validation.
 */
export interface SqsDeleteResultExpectation {
  /** Assert that result ok is true */
  ok(): this;

  /** Assert that result ok is false */
  notOk(): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for SQS message validation.
 */
export interface SqsMessageExpectation {
  /** Assert that body contains the given substring */
  bodyContains(substring: string): this;

  /** Assert body using custom matcher function */
  bodyMatch(matcher: (body: string) => void): this;

  /** Assert that body equals expected JSON (deep equality) */
  // deno-lint-ignore no-explicit-any
  bodyJsonEquals<T = any>(expected: T): this;

  /** Assert that body JSON contains the given subset */
  // deno-lint-ignore no-explicit-any
  bodyJsonContains<T = any>(subset: Partial<T>): this;

  /** Assert that message has the given attribute */
  hasAttribute(name: string): this;

  /** Assert that message attributes contain the given subset */
  attributesContain(subset: Record<string, Partial<SqsMessageAttribute>>): this;

  /** Assert that messageId matches expected */
  messageId(expected: string): this;
}

/**
 * Implementation for SQS send result expectations.
 */
class SqsSendResultExpectationImpl implements SqsSendResultExpectation {
  readonly #result: SqsSendResult;

  constructor(result: SqsSendResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  hasMessageId(): this {
    if (!this.#result.messageId) {
      throw new Error("Expected messageId, but messageId is undefined");
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Implementation for SQS send batch result expectations.
 */
class SqsSendBatchResultExpectationImpl
  implements SqsSendBatchResultExpectation {
  readonly #result: SqsSendBatchResult;

  constructor(result: SqsSendBatchResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  allSuccessful(): this {
    if (this.#result.failed.length > 0) {
      throw new Error(
        `Expected all messages successful, but ${this.#result.failed.length} failed`,
      );
    }
    return this;
  }

  successfulCount(count: number): this {
    if (this.#result.successful.length !== count) {
      throw new Error(
        `Expected ${count} successful, got ${this.#result.successful.length}`,
      );
    }
    return this;
  }

  failedCount(count: number): this {
    if (this.#result.failed.length !== count) {
      throw new Error(
        `Expected ${count} failed, got ${this.#result.failed.length}`,
      );
    }
    return this;
  }

  noFailures(): this {
    if (this.#result.failed.length > 0) {
      throw new Error(
        `Expected no failures, but ${this.#result.failed.length} failed`,
      );
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Implementation for SQS receive result expectations.
 */
class SqsReceiveResultExpectationImpl implements SqsReceiveResultExpectation {
  readonly #result: SqsReceiveResult;

  constructor(result: SqsReceiveResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  noContent(): this {
    if (this.#result.messages.length !== 0) {
      throw new Error(
        `Expected no messages, but got ${this.#result.messages.length} messages`,
      );
    }
    return this;
  }

  hasContent(): this {
    if (this.#result.messages.length === 0) {
      throw new Error("Expected messages, but messages array is empty");
    }
    return this;
  }

  count(expected: number): this {
    if (this.#result.messages.length !== expected) {
      throw new Error(
        `Expected ${expected} messages, got ${this.#result.messages.length}`,
      );
    }
    return this;
  }

  countAtLeast(min: number): this {
    if (this.#result.messages.length < min) {
      throw new Error(
        `Expected at least ${min} messages, got ${this.#result.messages.length}`,
      );
    }
    return this;
  }

  countAtMost(max: number): this {
    if (this.#result.messages.length > max) {
      throw new Error(
        `Expected at most ${max} messages, got ${this.#result.messages.length}`,
      );
    }
    return this;
  }

  dataContains(
    subset: { body?: string; attributes?: Record<string, string> },
  ): this {
    const found = this.#result.messages.some((msg) => {
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

    if (!found) {
      throw new Error(
        `Expected at least one message to contain ${JSON.stringify(subset)}`,
      );
    }
    return this;
  }

  dataMatch(matcher: (messages: SqsMessages) => void): this {
    matcher(this.#result.messages);
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Implementation for SQS delete result expectations.
 */
class SqsDeleteResultExpectationImpl implements SqsDeleteResultExpectation {
  readonly #result: SqsDeleteResult;

  constructor(result: SqsDeleteResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Implementation for SQS delete batch result expectations.
 * Reuses the same interface as SqsSendBatchResultExpectation per spec.
 */
class SqsDeleteBatchResultExpectationImpl
  implements SqsSendBatchResultExpectation {
  readonly #result: SqsDeleteBatchResult;

  constructor(result: SqsDeleteBatchResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  allSuccessful(): this {
    if (this.#result.failed.length > 0) {
      throw new Error(
        `Expected all deletions successful, but ${this.#result.failed.length} failed`,
      );
    }
    return this;
  }

  successfulCount(count: number): this {
    if (this.#result.successful.length !== count) {
      throw new Error(
        `Expected ${count} successful, got ${this.#result.successful.length}`,
      );
    }
    return this;
  }

  failedCount(count: number): this {
    if (this.#result.failed.length !== count) {
      throw new Error(
        `Expected ${count} failed, got ${this.#result.failed.length}`,
      );
    }
    return this;
  }

  noFailures(): this {
    if (this.#result.failed.length > 0) {
      throw new Error(
        `Expected no failures, but ${this.#result.failed.length} failed`,
      );
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Implementation for SQS message expectations.
 */
class SqsMessageExpectationImpl implements SqsMessageExpectation {
  readonly #message: SqsMessage;

  constructor(message: SqsMessage) {
    this.#message = message;
  }

  bodyContains(substring: string): this {
    if (!this.#message.body.includes(substring)) {
      throw new Error(
        `Expected body to contain "${substring}", but got "${this.#message.body}"`,
      );
    }
    return this;
  }

  bodyMatch(matcher: (body: string) => void): this {
    matcher(this.#message.body);
    return this;
  }

  // deno-lint-ignore no-explicit-any
  bodyJsonEquals<T = any>(expected: T): this {
    const actual = JSON.parse(this.#message.body);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `Expected body JSON to equal ${JSON.stringify(expected)}, got ${
          JSON.stringify(actual)
        }`,
      );
    }
    return this;
  }

  // deno-lint-ignore no-explicit-any
  bodyJsonContains<T = any>(subset: Partial<T>): this {
    const actual = JSON.parse(this.#message.body);
    if (!containsSubset(actual, subset)) {
      throw new Error(
        `Expected body JSON to contain ${JSON.stringify(subset)}, got ${
          JSON.stringify(actual)
        }`,
      );
    }
    return this;
  }

  hasAttribute(name: string): this {
    if (!this.#message.messageAttributes?.[name]) {
      throw new Error(`Expected message to have attribute "${name}"`);
    }
    return this;
  }

  attributesContain(
    subset: Record<string, Partial<SqsMessageAttribute>>,
  ): this {
    const attrs = this.#message.messageAttributes ?? {};
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
  }

  messageId(expected: string): this {
    if (this.#message.messageId !== expected) {
      throw new Error(
        `Expected messageId "${expected}", got "${this.#message.messageId}"`,
      );
    }
    return this;
  }
}

/**
 * Create a fluent expectation chain for SQS message validation.
 */
export function expectSqsMessage(
  message: SqsMessage,
): SqsMessageExpectation {
  return new SqsMessageExpectationImpl(message);
}

/**
 * Fluent API for SQS ensure queue result validation.
 */
export interface SqsEnsureQueueResultExpectation {
  /** Assert that result ok is true */
  ok(): this;

  /** Assert that result ok is false */
  notOk(): this;

  /** Assert that queueUrl exists */
  hasQueueUrl(): this;

  /** Assert that queueUrl matches expected */
  queueUrl(expected: string): this;

  /** Assert that queueUrl contains substring */
  queueUrlContains(substring: string): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for SQS delete queue result validation.
 */
export interface SqsDeleteQueueResultExpectation {
  /** Assert that result ok is true */
  ok(): this;

  /** Assert that result ok is false */
  notOk(): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Implementation for SQS ensure queue result expectations.
 */
class SqsEnsureQueueResultExpectationImpl
  implements SqsEnsureQueueResultExpectation {
  readonly #result: SqsEnsureQueueResult;

  constructor(result: SqsEnsureQueueResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  hasQueueUrl(): this {
    if (!this.#result.queueUrl) {
      throw new Error("Expected queueUrl, but queueUrl is empty");
    }
    return this;
  }

  queueUrl(expected: string): this {
    if (this.#result.queueUrl !== expected) {
      throw new Error(
        `Expected queueUrl "${expected}", got "${this.#result.queueUrl}"`,
      );
    }
    return this;
  }

  queueUrlContains(substring: string): this {
    if (!this.#result.queueUrl.includes(substring)) {
      throw new Error(
        `Expected queueUrl to contain "${substring}", got "${this.#result.queueUrl}"`,
      );
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Implementation for SQS delete queue result expectations.
 */
class SqsDeleteQueueResultExpectationImpl
  implements SqsDeleteQueueResultExpectation {
  readonly #result: SqsDeleteQueueResult;

  constructor(result: SqsDeleteQueueResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
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
 *   .ok()
 *   .hasMessageId()
 *   .durationLessThan(1000);
 * ```
 *
 * @example Receive result validation
 * ```ts
 * const receiveResult = await sqs.receive({ maxMessages: 10 });
 * expectSqsResult(receiveResult)
 *   .ok()
 *   .hasContent()
 *   .countAtLeast(1)
 *   .dataContains({ body: "orderId" });
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
 *   .ok()
 *   .allSuccessful()
 *   .noFailures();
 *
 * // Delete batch
 * const deleteResult = await sqs.deleteBatch(receiptHandles);
 * expectSqsResult(deleteResult)
 *   .ok()
 *   .successfulCount(2);
 * ```
 *
 * @example Queue management
 * ```ts
 * // Ensure queue exists
 * const ensureResult = await sqs.ensureQueue("test-queue");
 * expectSqsResult(ensureResult)
 *   .ok()
 *   .hasQueueUrl()
 *   .queueUrlContains("test-queue");
 *
 * // Delete queue
 * const deleteResult = await sqs.deleteQueue(queueUrl);
 * expectSqsResult(deleteResult).ok();
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
      return new SqsSendResultExpectationImpl(
        result as SqsSendResult,
      ) as unknown as SqsExpectation<R>;
    case "sqs:send-batch":
      return new SqsSendBatchResultExpectationImpl(
        result as SqsSendBatchResult,
      ) as unknown as SqsExpectation<R>;
    case "sqs:receive":
      return new SqsReceiveResultExpectationImpl(
        result as SqsReceiveResult,
      ) as unknown as SqsExpectation<R>;
    case "sqs:delete":
      return new SqsDeleteResultExpectationImpl(
        result as SqsDeleteResult,
      ) as unknown as SqsExpectation<R>;
    case "sqs:delete-batch":
      return new SqsDeleteBatchResultExpectationImpl(
        result as SqsDeleteBatchResult,
      ) as unknown as SqsExpectation<R>;
    case "sqs:ensure-queue":
      return new SqsEnsureQueueResultExpectationImpl(
        result as SqsEnsureQueueResult,
      ) as unknown as SqsExpectation<R>;
    case "sqs:delete-queue":
      return new SqsDeleteQueueResultExpectationImpl(
        result as SqsDeleteQueueResult,
      ) as unknown as SqsExpectation<R>;
    default:
      throw new Error(
        `Unknown SQS result type: ${(result as { type: string }).type}`,
      );
  }
}
