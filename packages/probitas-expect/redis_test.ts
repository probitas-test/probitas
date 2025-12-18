import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { expectRedisResult } from "./redis.ts";
import {
  mockRedisArrayResult,
  mockRedisCommonResult,
  mockRedisCountResult,
  mockRedisGetResult,
  mockRedisHashResult,
  mockRedisSetResult,
} from "./redis/_testutils.ts";

// Integration tests for expectRedisResult dispatcher

Deno.test("expectRedisResult - dispatches redis:count to RedisCountResultExpectation", () => {
  const result = mockRedisCountResult({ value: 5 });
  const expectation = expectRedisResult(result);

  // Verify it's a RedisCountResultExpectation by checking for count-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveValue);
  assertExists(expectation.toHaveValueGreaterThan);
  assertExists(expectation.toHaveValueLessThan);
  assertExists(expectation.toHaveDuration);

  // Verify it works correctly
  expectation.toBeOk();
  expectation.toHaveValue(5);
  expectation.toHaveValueGreaterThan(4);
});

Deno.test("expectRedisResult - dispatches redis:array to RedisArrayResultExpectation", () => {
  const result = mockRedisArrayResult<string>({ value: ["item1", "item2"] });
  const expectation = expectRedisResult(result);

  // Verify it's a RedisArrayResultExpectation by checking for array-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveValue);
  assertExists(expectation.toHaveValueContaining);
  assertExists(expectation.toHaveValueEmpty);
  assertExists(expectation.toHaveValueCount);

  // Verify it works correctly
  expectation.toBeOk();
  expectation.toHaveValueCount(2);
  expectation.toHaveValueContaining("item1");
});

Deno.test("expectRedisResult - dispatches redis:get to RedisGetResultExpectation", () => {
  const result = mockRedisGetResult({ value: "test-value" });
  const expectation = expectRedisResult(result);

  // Verify it's a RedisGetResultExpectation by checking for string-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveValue);
  assertExists(expectation.toHaveValueContaining);
  assertExists(expectation.toHaveValueMatching);
  assertExists(expectation.toHaveDuration);

  // Verify it works correctly
  expectation.toBeOk();
  expectation.toHaveValue("test-value");
  expectation.toHaveValueContaining("test");
  expectation.toHaveValueMatching(/value/);
});

Deno.test("expectRedisResult - dispatches redis:set to RedisSetResultExpectation", () => {
  const result = mockRedisSetResult({ value: "OK" });
  const expectation = expectRedisResult(result);

  // Verify it's a RedisSetResultExpectation by checking for string-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveValue);
  assertExists(expectation.toHaveValueContaining);
  assertExists(expectation.toHaveValueMatching);
  assertExists(expectation.toHaveDuration);

  // Verify it works correctly
  expectation.toBeOk();
  expectation.toHaveValue("OK");
  expectation.toHaveValueMatching(/OK/);
});

Deno.test("expectRedisResult - dispatches redis:hash to RedisHashResultExpectation", () => {
  const result = mockRedisHashResult({
    value: { field1: "value1", field2: "value2" },
  });
  const expectation = expectRedisResult(result);

  // Verify it's a RedisHashResultExpectation by checking for hash-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveValue);
  assertExists(expectation.toHaveValueMatching);
  assertExists(expectation.toHaveValueProperty);
  assertExists(expectation.toHaveValuePropertySatisfying);
  assertExists(expectation.toHaveDuration);

  // Verify it works correctly
  expectation.toBeOk();
  expectation.toHaveValueProperty("field1", "value1");
  expectation.toHaveValueMatching({ field1: "value1" });
});

Deno.test("expectRedisResult - dispatches redis:common to RedisCommonResultExpectation", () => {
  const result = mockRedisCommonResult<string>({ value: "common-value" });
  const expectation = expectRedisResult(result);

  // Verify it's a RedisCommonResultExpectation by checking for common methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveValue);
  assertExists(expectation.toHaveValueEqual);
  assertExists(expectation.toHaveValueSatisfying);
  assertExists(expectation.toHaveDuration);

  // Verify it works correctly
  expectation.toBeOk();
  expectation.toHaveValue("common-value");
});

Deno.test("expectRedisResult - throws for unknown result type", () => {
  const unknownResult = {
    kind: "redis:unknown" as const,
    ok: true,
    value: "test",
    duration: 100,
  };

  assertThrows(
    // deno-lint-ignore no-explicit-any
    () => expectRedisResult(unknownResult as any),
    Error,
    "Unknown Redis result kind: redis:unknown",
  );
});

Deno.test("expectRedisResult - chaining works across dispatch", () => {
  const countResult = mockRedisCountResult({ value: 10 });
  const arrayResult = mockRedisArrayResult<string>({
    value: ["a", "b", "c"],
  });
  const getResult = mockRedisGetResult({ value: "hello world" });

  // Test chaining for count result
  expectRedisResult(countResult)
    .toBeOk()
    .toHaveValue(10)
    .toHaveValueGreaterThan(5)
    .toHaveDuration(100);

  // Test chaining for array result
  expectRedisResult(arrayResult)
    .toBeOk()
    .toHaveValueCount(3)
    .toHaveValueContaining("a")
    .toHaveDuration(100);

  // Test chaining for get result
  expectRedisResult(getResult)
    .toBeOk()
    .toHaveValue("hello world")
    .toHaveValueContaining("hello")
    .toHaveDuration(100);
});

Deno.test("expectRedisResult - not property works across dispatch", () => {
  // Note: When ok: false, value must be null per discriminated union
  const countResult = mockRedisCountResult({ ok: false, value: null });
  const arrayResult = mockRedisArrayResult<string>({
    ok: false,
    value: null,
  });
  const getResult = mockRedisGetResult({ ok: false, value: null });

  // Test not for count result
  expectRedisResult(countResult).not.toBeOk();

  // Test not for array result
  expectRedisResult(arrayResult).not.toBeOk();

  // Test not for get result
  expectRedisResult(getResult).not.toBeOk();
});

Deno.test("expectRedisResult - type inference preserves correct expectation type", () => {
  // This test verifies compile-time type inference
  // The specific methods available should match the result type

  const countResult = mockRedisCountResult();
  const countExpectation = expectRedisResult(countResult);
  // RedisCountResultExpectation has number-specific methods
  assertEquals(typeof countExpectation.toHaveValueGreaterThan, "function");
  assertEquals(typeof countExpectation.toHaveValueLessThan, "function");
  assertEquals(typeof countExpectation.toHaveValueCloseTo, "function");

  const arrayResult = mockRedisArrayResult<string>();
  const arrayExpectation = expectRedisResult(arrayResult);
  // RedisArrayResultExpectation has array-specific methods
  assertEquals(typeof arrayExpectation.toHaveValueContaining, "function");
  assertEquals(typeof arrayExpectation.toHaveValueEmpty, "function");
  assertEquals(typeof arrayExpectation.toHaveValueCount, "function");

  const getResult = mockRedisGetResult();
  const getExpectation = expectRedisResult(getResult);
  // RedisGetResultExpectation has string-specific methods
  assertEquals(typeof getExpectation.toHaveValueContaining, "function");
  assertEquals(typeof getExpectation.toHaveValueMatching, "function");

  const setResult = mockRedisSetResult();
  const setExpectation = expectRedisResult(setResult);
  // RedisSetResultExpectation has string-specific methods
  assertEquals(typeof setExpectation.toHaveValueContaining, "function");
  assertEquals(typeof setExpectation.toHaveValueMatching, "function");

  const hashResult = mockRedisHashResult();
  const hashExpectation = expectRedisResult(hashResult);
  // RedisHashResultExpectation has object-specific methods
  assertEquals(typeof hashExpectation.toHaveValueProperty, "function");
  assertEquals(typeof hashExpectation.toHaveValueMatching, "function");

  const commonResult = mockRedisCommonResult<unknown>();
  const commonExpectation = expectRedisResult(commonResult);
  // RedisCommonResultExpectation has basic value methods
  assertEquals(typeof commonExpectation.toHaveValue, "function");
  assertEquals(typeof commonExpectation.toHaveValueEqual, "function");
});
