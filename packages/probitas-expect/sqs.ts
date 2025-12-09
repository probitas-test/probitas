import {
  buildCountAtLeastError,
  buildCountAtMostError,
  buildCountError,
  buildDurationError,
  containsSubset,
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
  readonly not: this;
  toBeSuccessful(): this;
  toHaveMessageId(): this;
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for SQS send batch result validation.
 */
export interface SqsSendBatchResultExpectation {
  readonly not: this;
  toBeSuccessful(): this;
  toBeAllSuccessful(): this;
  toHaveSuccessfulCount(count: number): this;
  toHaveFailedCount(count: number): this;
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for SQS receive result validation.
 */
export interface SqsReceiveResultExpectation {
  readonly not: this;
  toBeSuccessful(): this;
  toHaveContent(): this;
  toHaveLength(expected: number): this;
  toHaveLengthGreaterThanOrEqual(min: number): this;
  toHaveLengthLessThanOrEqual(max: number): this;
  toMatchObject(
    subset: { body?: string; attributes?: Record<string, string> },
  ): this;
  toSatisfy(matcher: (messages: SqsMessages) => void): this;
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for SQS delete result validation.
 */
export interface SqsDeleteResultExpectation {
  readonly not: this;
  toBeSuccessful(): this;
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for SQS message validation.
 */
export interface SqsMessageExpectation {
  /** Assert that body contains the given substring */
  toHaveBodyContaining(substring: string): this;

  /** Assert body using custom matcher function */
  bodyMatch(matcher: (body: string) => void): this;

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
 * Implementation for SQS send result expectations.
 */
class SqsSendResultExpectationImpl implements SqsSendResultExpectation {
  readonly #result: SqsSendResult;
  readonly #negate: boolean;

  constructor(result: SqsSendResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new SqsSendResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  toHaveMessageId(): this {
    if (!this.#result.messageId) {
      throw new Error("Expected messageId, but messageId is undefined");
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
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
  readonly #negate: boolean;

  constructor(result: SqsSendBatchResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new SqsSendBatchResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  toBeAllSuccessful(): this {
    if (this.#result.failed.length > 0) {
      throw new Error(
        `Expected all messages successful, but ${this.#result.failed.length} failed`,
      );
    }
    return this;
  }

  toHaveSuccessfulCount(count: number): this {
    if (this.#result.successful.length !== count) {
      throw new Error(
        buildCountError(count, this.#result.successful.length, "successful"),
      );
    }
    return this;
  }

  toHaveFailedCount(count: number): this {
    if (this.#result.failed.length !== count) {
      throw new Error(
        buildCountError(count, this.#result.failed.length, "failed"),
      );
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
    }
    return this;
  }
}

/**
 * Implementation for SQS receive result expectations.
 */
class SqsReceiveResultExpectationImpl implements SqsReceiveResultExpectation {
  readonly #result: SqsReceiveResult;
  readonly #negate: boolean;

  constructor(result: SqsReceiveResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new SqsReceiveResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  toHaveContent(): this {
    const hasContent = this.#result.messages.length > 0;
    if (this.#negate ? hasContent : !hasContent) {
      throw new Error(
        this.#negate
          ? `Expected no messages, but got ${this.#result.messages.length} messages`
          : "Expected messages, but messages array is empty",
      );
    }
    return this;
  }

  toHaveLength(expected: number): this {
    if (this.#result.messages.length !== expected) {
      throw new Error(
        buildCountError(expected, this.#result.messages.length, "messages"),
      );
    }
    return this;
  }

  toHaveLengthGreaterThanOrEqual(min: number): this {
    if (this.#result.messages.length < min) {
      throw new Error(
        buildCountAtLeastError(min, this.#result.messages.length, "messages"),
      );
    }
    return this;
  }

  toHaveLengthLessThanOrEqual(max: number): this {
    if (this.#result.messages.length > max) {
      throw new Error(
        buildCountAtMostError(max, this.#result.messages.length, "messages"),
      );
    }
    return this;
  }

  toMatchObject(
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

  toSatisfy(matcher: (messages: SqsMessages) => void): this {
    matcher(this.#result.messages);
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
    }
    return this;
  }
}

/**
 * Implementation for SQS delete result expectations.
 */
class SqsDeleteResultExpectationImpl implements SqsDeleteResultExpectation {
  readonly #result: SqsDeleteResult;
  readonly #negate: boolean;

  constructor(result: SqsDeleteResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new SqsDeleteResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
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
  readonly #negate: boolean;

  constructor(result: SqsDeleteBatchResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new SqsDeleteBatchResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  toBeAllSuccessful(): this {
    if (this.#result.failed.length > 0) {
      throw new Error(
        `Expected all deletions successful, but ${this.#result.failed.length} failed`,
      );
    }
    return this;
  }

  toHaveSuccessfulCount(count: number): this {
    if (this.#result.successful.length !== count) {
      throw new Error(
        buildCountError(count, this.#result.successful.length, "successful"),
      );
    }
    return this;
  }

  toHaveFailedCount(count: number): this {
    if (this.#result.failed.length !== count) {
      throw new Error(
        buildCountError(count, this.#result.failed.length, "failed"),
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

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
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

  toHaveBodyContaining(substring: string): this {
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
  toHaveBodyJsonEqualTo<T = any>(expected: T): this {
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
  toHaveBodyJsonContaining<T = any>(subset: Partial<T>): this {
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

  toHaveAttribute(name: string): this {
    if (!this.#message.messageAttributes?.[name]) {
      throw new Error(`Expected message to have attribute "${name}"`);
    }
    return this;
  }

  toHaveAttributesContaining(
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

  toHaveMessageId(expected: string): this {
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
  readonly not: this;
  toBeSuccessful(): this;
  toHaveQueueUrl(): this;
  toHaveQueueUrl(expected: string): this;
  toHaveQueueUrlContaining(substring: string): this;
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for SQS delete queue result validation.
 */
export interface SqsDeleteQueueResultExpectation {
  readonly not: this;
  toBeSuccessful(): this;
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Implementation for SQS ensure queue result expectations.
 */
class SqsEnsureQueueResultExpectationImpl
  implements SqsEnsureQueueResultExpectation {
  readonly #result: SqsEnsureQueueResult;
  readonly #negate: boolean;

  constructor(result: SqsEnsureQueueResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new SqsEnsureQueueResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  toHaveQueueUrl(expected?: string): this {
    if (expected !== undefined) {
      if (this.#result.queueUrl !== expected) {
        throw new Error(
          `Expected queueUrl "${expected}", got "${this.#result.queueUrl}"`,
        );
      }
    } else {
      if (!this.#result.queueUrl) {
        throw new Error("Expected queueUrl, but queueUrl is empty");
      }
    }
    return this;
  }

  toHaveQueueUrlContaining(substring: string): this {
    if (!this.#result.queueUrl.includes(substring)) {
      throw new Error(
        `Expected queueUrl to contain "${substring}", got "${this.#result.queueUrl}"`,
      );
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
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
  readonly #negate: boolean;

  constructor(result: SqsDeleteQueueResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new SqsDeleteQueueResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate
          ? "Expected not ok result, but ok is true"
          : "Expected ok result, but ok is false",
      );
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
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
