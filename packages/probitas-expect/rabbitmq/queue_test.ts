import { assertEquals, assertExists } from "@std/assert";
import {
  expectRabbitMqQueueResult,
  type RabbitMqQueueResultExpectation,
} from "./queue.ts";
import { mockRabbitMqQueueResult } from "./_testutils.ts";

// Define expected methods with their test arguments
// Using Record to ensure all interface methods are listed (compile-time check)
const EXPECTED_METHODS: Record<
  keyof RabbitMqQueueResultExpectation,
  unknown[]
> = {
  // Core (special property, not a method)
  not: [],
  // Ok
  toBeOk: [],
  // Queue
  toHaveQueue: ["test-queue"],
  toHaveQueueEqual: ["test-queue"],
  toHaveQueueStrictEqual: ["test-queue"],
  toHaveQueueSatisfying: [(v: string) => assertEquals(v, "test-queue")],
  toHaveQueueContaining: ["test"],
  toHaveQueueMatching: [/test-queue/],
  // Message count
  toHaveMessageCount: [10],
  toHaveMessageCountEqual: [10],
  toHaveMessageCountStrictEqual: [10],
  toHaveMessageCountSatisfying: [(v: number) => assertEquals(v, 10)],
  toHaveMessageCountNaN: [],
  toHaveMessageCountGreaterThan: [5],
  toHaveMessageCountGreaterThanOrEqual: [10],
  toHaveMessageCountLessThan: [100],
  toHaveMessageCountLessThanOrEqual: [10],
  toHaveMessageCountCloseTo: [10, 0],
  // Consumer count
  toHaveConsumerCount: [2],
  toHaveConsumerCountEqual: [2],
  toHaveConsumerCountStrictEqual: [2],
  toHaveConsumerCountSatisfying: [(v: number) => assertEquals(v, 2)],
  toHaveConsumerCountNaN: [],
  toHaveConsumerCountGreaterThan: [1],
  toHaveConsumerCountGreaterThanOrEqual: [2],
  toHaveConsumerCountLessThan: [10],
  toHaveConsumerCountLessThanOrEqual: [2],
  toHaveConsumerCountCloseTo: [2, 0],
  // Duration
  toHaveDuration: [100],
  toHaveDurationEqual: [100],
  toHaveDurationStrictEqual: [100],
  toHaveDurationSatisfying: [(v: number) => assertEquals(v, 100)],
  toHaveDurationNaN: [],
  toHaveDurationGreaterThan: [50],
  toHaveDurationGreaterThanOrEqual: [100],
  toHaveDurationLessThan: [200],
  toHaveDurationLessThanOrEqual: [100],
  toHaveDurationCloseTo: [100, 0],
};

Deno.test("expectRabbitMqQueueResult - method existence check", () => {
  const result = mockRabbitMqQueueResult();
  const expectation = expectRabbitMqQueueResult(result);

  const expectedMethodNames = Object.keys(EXPECTED_METHODS) as Array<
    keyof RabbitMqQueueResultExpectation
  >;

  // Check that all expected methods exist
  for (const method of expectedMethodNames) {
    assertExists(
      expectation[method],
      `Method '${method}' should exist on RabbitMqQueueResultExpectation`,
    );
  }

  // Verify count matches (helps catch if we added methods but didn't list them)
  const actualPropertyCount = Object.getOwnPropertyNames(expectation).length;
  assertEquals(
    actualPropertyCount,
    expectedMethodNames.length,
    `Expected ${expectedMethodNames.length} methods but found ${actualPropertyCount}`,
  );
});

// Generate individual test for each method
for (
  const [methodName, args] of Object.entries(EXPECTED_METHODS) as Array<
    [keyof RabbitMqQueueResultExpectation, unknown[]]
  >
) {
  // Skip 'not' as it's a property, not a method
  if (methodName === "not") continue;

  // Skip NaN tests (need special values)
  if (
    methodName === "toHaveMessageCountNaN" ||
    methodName === "toHaveConsumerCountNaN" ||
    methodName === "toHaveDurationNaN"
  ) {
    continue;
  }

  Deno.test(`expectRabbitMqQueueResult - ${methodName} - success`, () => {
    const result = mockRabbitMqQueueResult();
    const expectation = expectRabbitMqQueueResult(result);

    // Call the method with provided arguments
    // deno-lint-ignore no-explicit-any
    const method = expectation[methodName] as (...args: any[]) => any;
    const returnValue = method.call(expectation, ...args);

    // Verify method returns an expectation object (for chaining)
    assertExists(returnValue);
    assertExists(
      returnValue.toBeOk,
      "Result should have toBeOk method for chaining",
    );
  });
}

Deno.test("expectRabbitMqQueueResult - not property - success", () => {
  const result = mockRabbitMqQueueResult({ ok: false });
  const expectation = expectRabbitMqQueueResult(result);

  // Verify .not is accessible and returns expectation
  expectation.not.toBeOk();
  expectation.not.toHaveQueue("other-queue");
});

Deno.test("expectRabbitMqQueueResult - chaining - success", () => {
  const result = mockRabbitMqQueueResult({
    queue: "my-queue",
    messageCount: 50,
    consumerCount: 5,
    duration: 150,
  });
  const expectation = expectRabbitMqQueueResult(result);

  // Chain multiple assertions
  expectation
    .toBeOk()
    .toHaveQueue("my-queue")
    .toHaveQueueContaining("queue")
    .toHaveMessageCount(50)
    .toHaveMessageCountGreaterThan(10)
    .toHaveConsumerCount(5)
    .toHaveConsumerCountLessThan(10)
    .toHaveDuration(150);
});

Deno.test("expectRabbitMqQueueResult - empty queue - success", () => {
  const result = mockRabbitMqQueueResult({
    messageCount: 0,
    consumerCount: 0,
  });
  const expectation = expectRabbitMqQueueResult(result);

  expectation
    .toBeOk()
    .toHaveMessageCount(0)
    .toHaveConsumerCount(0);
});
