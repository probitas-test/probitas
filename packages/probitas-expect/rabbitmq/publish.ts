import type { RabbitMqPublishResult } from "@probitas/client-rabbitmq";
import {
  expectSimpleResult,
  type RabbitMqSimpleResultExpectation,
} from "./simple.ts";

/**
 * Fluent API for RabbitMQ publish result validation.
 * Publish results only have ok and duration properties.
 */
export type RabbitMqPublishResultExpectation = RabbitMqSimpleResultExpectation;

/**
 * Create expectation for RabbitMQ publish result.
 */
export function expectRabbitMqPublishResult(
  result: RabbitMqPublishResult,
  negate = false,
): RabbitMqPublishResultExpectation {
  return expectSimpleResult(result, negate);
}
