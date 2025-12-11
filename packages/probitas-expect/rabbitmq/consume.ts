import { containsSubset, createDurationMethods } from "../common.ts";
import type {
  RabbitMqConsumeResult,
  RabbitMqMessageProperties,
} from "@probitas/client-rabbitmq";

/**
 * Fluent API for RabbitMQ consume result validation.
 */
export interface RabbitMqConsumeResultExpectation {
  /**
   * Negates the next assertion.
   *
   * @example
   * ```ts
   * expectRabbitMqResult(result).not.toBeSuccessful();
   * ```
   */
  readonly not: this;

  /**
   * Asserts that the result ok is true.
   *
   * @example
   * ```ts
   * expectRabbitMqResult(result).toBeSuccessful();
   * ```
   */
  toBeSuccessful(): this;

  /**
   * Asserts that the consumed message is not null.
   *
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveContent();
   * ```
   */
  toHaveContent(): this;

  /**
   * Asserts that the message body contains the given subbody.
   *
   * @param subbody - The expected subbody as a Uint8Array
   * @example
   * ```ts
   * const expectedBody = new TextEncoder().encode("hello");
   * expectRabbitMqResult(result).toHaveBodyContaining(expectedBody);
   * ```
   */
  toHaveBodyContaining(subbody: Uint8Array): this;

  /**
   * Asserts that the message content satisfies the custom matcher function.
   *
   * @param matcher - A custom function to validate the message content
   * @example
   * ```ts
   * expectRabbitMqResult(result).toSatisfy((content) => {
   *   const text = new TextDecoder().decode(content);
   *   if (!text.startsWith("prefix")) {
   *     throw new Error("Expected content to start with 'prefix'");
   *   }
   * });
   * ```
   */
  toSatisfy(matcher: (content: Uint8Array) => void): this;

  /**
   * Asserts that the message properties contain the given subset.
   *
   * @param subset - A partial object of expected message properties
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHavePropertyContaining({
   *   contentType: "application/json",
   *   correlationId: "abc123",
   * });
   * ```
   */
  toHavePropertyContaining(subset: Partial<RabbitMqMessageProperties>): this;

  /**
   * Asserts that the message routing key matches the expected value.
   *
   * @param expected - The expected routing key
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveRoutingKey("orders.created");
   * ```
   */
  toHaveRoutingKey(expected: string): this;

  /**
   * Asserts that the message exchange matches the expected value.
   *
   * @param expected - The expected exchange name
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveExchange("my-exchange");
   * ```
   */
  toHaveExchange(expected: string): this;

  /**
   * Asserts that the operation duration is less than the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationLessThan(100);
   * ```
   */
  toHaveDurationLessThan(ms: number): this;

  /**
   * Asserts that the operation duration is less than or equal to the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationLessThanOrEqual(100);
   * ```
   */
  toHaveDurationLessThanOrEqual(ms: number): this;

  /**
   * Asserts that the operation duration is greater than the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationGreaterThan(50);
   * ```
   */
  toHaveDurationGreaterThan(ms: number): this;

  /**
   * Asserts that the operation duration is greater than or equal to the specified threshold.
   *
   * @param ms - The threshold in milliseconds
   * @example
   * ```ts
   * expectRabbitMqResult(result).toHaveDurationGreaterThanOrEqual(50);
   * ```
   */
  toHaveDurationGreaterThanOrEqual(ms: number): this;
}

export function expectRabbitMqConsumeResult(
  result: RabbitMqConsumeResult,
  negate = false,
): RabbitMqConsumeResultExpectation {
  const self: RabbitMqConsumeResultExpectation = {
    get not(): RabbitMqConsumeResultExpectation {
      return expectRabbitMqConsumeResult(result, !negate);
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
      const hasContent = result.message !== null;
      if (negate ? hasContent : !hasContent) {
        throw new Error(
          negate
            ? "Expected no message, but message exists"
            : "Expected message, but message is null",
        );
      }
      return this;
    },

    toHaveBodyContaining(subbody: Uint8Array) {
      if (result.message === null) {
        throw new Error("Expected message, but message is null");
      }

      const content = result.message.content;
      const subbodyStr = new TextDecoder().decode(subbody);
      const contentStr = new TextDecoder().decode(content);

      const contains = contentStr.includes(subbodyStr);
      if (negate ? contains : !contains) {
        throw new Error(
          negate
            ? `Expected data to not contain ${subbodyStr}, but it did`
            : `Expected data to contain ${subbodyStr}, but got ${contentStr}`,
        );
      }
      return this;
    },

    toSatisfy(matcher: (content: Uint8Array) => void) {
      if (result.message === null) {
        throw new Error("Expected message, but message is null");
      }
      matcher(result.message.content);
      return this;
    },

    toHavePropertyContaining(subset: Partial<RabbitMqMessageProperties>) {
      if (result.message === null) {
        throw new Error("Expected message, but message is null");
      }

      const props = result.message.properties;
      const matches = containsSubset(props, subset);
      if (negate ? matches : !matches) {
        throw new Error(
          negate
            ? `Expected properties to not contain ${
              JSON.stringify(subset)
            }, got ${JSON.stringify(props)}`
            : `Expected properties to contain ${JSON.stringify(subset)}, got ${
              JSON.stringify(props)
            }`,
        );
      }
      return this;
    },

    toHaveRoutingKey(expected: string) {
      if (result.message === null) {
        throw new Error("Expected message, but message is null");
      }

      const match = result.message.fields.routingKey === expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected routing key to not be ${expected}, got ${result.message.fields.routingKey}`
            : `Expected routing key ${expected}, got ${result.message.fields.routingKey}`,
        );
      }
      return this;
    },

    toHaveExchange(expected: string) {
      if (result.message === null) {
        throw new Error("Expected message, but message is null");
      }

      const match = result.message.fields.exchange === expected;
      if (negate ? match : !match) {
        throw new Error(
          negate
            ? `Expected exchange to not be ${expected}, got ${result.message.fields.exchange}`
            : `Expected exchange ${expected}, got ${result.message.fields.exchange}`,
        );
      }
      return this;
    },

    ...createDurationMethods(result.duration, negate),
  };

  return self;
}
