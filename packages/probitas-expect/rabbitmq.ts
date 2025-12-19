import type {
  RabbitMqAckResult,
  RabbitMqConsumeResult,
  RabbitMqExchangeResult,
  RabbitMqPublishResult,
  RabbitMqQueueResult,
  RabbitMqResult,
} from "@probitas/client-rabbitmq";
import {
  expectRabbitMqPublishResult,
  type RabbitMqPublishResultExpectation,
} from "./rabbitmq/publish.ts";
import {
  expectRabbitMqConsumeResult,
  type RabbitMqConsumeResultExpectation,
} from "./rabbitmq/consume.ts";
import {
  expectRabbitMqQueueResult,
  type RabbitMqQueueResultExpectation,
} from "./rabbitmq/queue.ts";
import {
  expectRabbitMqAckResult,
  type RabbitMqAckResultExpectation,
} from "./rabbitmq/ack.ts";
import {
  expectRabbitMqExchangeResult,
  type RabbitMqExchangeResultExpectation,
} from "./rabbitmq/exchange.ts";

// Re-export interfaces
export type {
  RabbitMqAckResultExpectation,
  RabbitMqConsumeResultExpectation,
  RabbitMqExchangeResultExpectation,
  RabbitMqPublishResultExpectation,
  RabbitMqQueueResultExpectation,
};

/**
 * Expectation type returned by expectRabbitMqResult based on the result type.
 */
export type RabbitMqExpectation<R extends RabbitMqResult> = R extends
  RabbitMqConsumeResult ? RabbitMqConsumeResultExpectation
  : R extends RabbitMqQueueResult ? RabbitMqQueueResultExpectation
  : R extends RabbitMqPublishResult ? RabbitMqPublishResultExpectation
  : R extends RabbitMqExchangeResult ? RabbitMqExchangeResultExpectation
  : R extends RabbitMqAckResult ? RabbitMqAckResultExpectation
  : never;

/**
 * Create a fluent expectation chain for any RabbitMQ result validation.
 *
 * This unified function accepts any RabbitMQ result type and returns
 * the appropriate expectation interface based on the result's type discriminator.
 *
 * @example
 * ```ts
 * import type { RabbitMqPublishResult, RabbitMqConsumeResult, RabbitMqQueueResult, RabbitMqExchangeResult, RabbitMqAckResult } from "@probitas/client-rabbitmq";
 * import { expectRabbitMqResult } from "./rabbitmq.ts";
 *
 * // For publish result - returns RabbitMqPublishResultExpectation
 * const publishResult = {
 *   kind: "rabbitmq:publish",
 *   ok: true,
 *   duration: 0,
 * } as unknown as RabbitMqPublishResult;
 * expectRabbitMqResult(publishResult).toBeOk();
 *
 * // For consume result - returns RabbitMqConsumeResultExpectation
 * const consumeResult = {
 *   kind: "rabbitmq:consume",
 *   ok: true,
 *   message: { content: new Uint8Array() },
 *   duration: 0,
 * } as unknown as RabbitMqConsumeResult;
 * expectRabbitMqResult(consumeResult).toBeOk().toHaveMessagePresent();
 *
 * // For queue result - returns RabbitMqQueueResultExpectation
 * const queueResult = {
 *   kind: "rabbitmq:queue",
 *   ok: true,
 *   queue: "my-queue",
 *   messageCount: 0,
 *   consumerCount: 0,
 *   duration: 0,
 * } as unknown as RabbitMqQueueResult;
 * expectRabbitMqResult(queueResult).toBeOk().toHaveMessageCount(0);
 *
 * // For exchange result - returns RabbitMqExchangeResultExpectation
 * const exchangeResult = {
 *   kind: "rabbitmq:exchange",
 *   ok: true,
 *   duration: 0,
 * } as unknown as RabbitMqExchangeResult;
 * expectRabbitMqResult(exchangeResult).toBeOk();
 *
 * // For ack result - returns RabbitMqAckResultExpectation
 * const ackResult = {
 *   kind: "rabbitmq:ack",
 *   ok: true,
 *   duration: 0,
 * } as unknown as RabbitMqAckResult;
 * expectRabbitMqResult(ackResult).toBeOk();
 * ```
 */
export function expectRabbitMqResult<R extends RabbitMqResult>(
  result: R,
): RabbitMqExpectation<R> {
  switch (result.kind) {
    case "rabbitmq:consume":
      return expectRabbitMqConsumeResult(
        result as RabbitMqConsumeResult,
      ) as RabbitMqExpectation<R>;
    case "rabbitmq:queue":
      return expectRabbitMqQueueResult(
        result as RabbitMqQueueResult,
      ) as RabbitMqExpectation<R>;
    case "rabbitmq:publish":
      return expectRabbitMqPublishResult(
        result as RabbitMqPublishResult,
      ) as RabbitMqExpectation<R>;
    case "rabbitmq:exchange":
      return expectRabbitMqExchangeResult(
        result as RabbitMqExchangeResult,
      ) as RabbitMqExpectation<R>;
    case "rabbitmq:ack":
      return expectRabbitMqAckResult(
        result as RabbitMqAckResult,
      ) as RabbitMqExpectation<R>;
    default:
      throw new Error(
        `Unknown RabbitMQ result kind: ${(result as { kind: string }).kind}`,
      );
  }
}
