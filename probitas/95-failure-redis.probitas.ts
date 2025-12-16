/**
 * Redis Client Failure Examples
 *
 * This file demonstrates failure messages for each Redis expectation method.
 * All scenarios are expected to fail - they use dummy results to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import type {
  RedisArrayResult,
  RedisCountResult,
  RedisGetResult,
  RedisHashResult,
  RedisSetResult,
} from "jsr:@probitas/client-redis@^0";

// Helper functions
const mockGetResult = (
  overrides: Partial<RedisGetResult> = {},
): RedisGetResult => ({
  kind: "redis:get" as const,
  ok: false,
  value: "cached-data",
  duration: 5,
  ...overrides,
});

const mockSetResult = (
  overrides: Partial<RedisSetResult> = {},
): RedisSetResult => ({
  kind: "redis:set" as const,
  ok: false,
  value: "OK" as const,
  duration: 3,
  ...overrides,
});

const mockCountResult = (
  overrides: Partial<RedisCountResult> = {},
): RedisCountResult => ({
  kind: "redis:count" as const,
  ok: false,
  value: 42,
  duration: 2,
  ...overrides,
});

const mockArrayResult = (
  overrides: Partial<RedisArrayResult<string>> = {},
): RedisArrayResult<string> => ({
  kind: "redis:array" as const,
  ok: false,
  value: ["item1", "item2", "item3"] as const,
  duration: 4,
  ...overrides,
});

const mockHashResult = (
  overrides: Partial<RedisHashResult> = {},
): RedisHashResult => ({
  kind: "redis:hash" as const,
  ok: false,
  value: { field1: "value1", field2: "value2" },
  duration: 6,
  ...overrides,
});

const dummyGetResult = mockGetResult();
const dummySetResult = mockSetResult();
const dummyCountResult = mockCountResult();
const dummyArrayResult = mockArrayResult();
const dummyHashResult = mockHashResult();

// GET result failures
export const getToBeOk = scenario("Redis GET - toBeOk failure", {
  tags: ["failure", "redis"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyGetResult).toBeOk();
  })
  .build();

export const getToHaveValue = scenario("Redis GET - toHaveValue failure", {
  tags: ["failure", "redis"],
})
  .step("toHaveValue fails with wrong value", () => {
    expect(dummyGetResult).toHaveValue("different-data");
  })
  .build();

export const getToHaveValueNull = scenario(
  "Redis GET - toHaveValueNull failure",
  { tags: ["failure", "redis"] },
)
  .step("toHaveValueNull fails when value exists", () => {
    expect(dummyGetResult).toHaveValueNull();
  })
  .build();

export const getToHaveValueContaining = scenario(
  "Redis GET - toHaveValueContaining failure",
  { tags: ["failure", "redis"] },
)
  .step("toHaveValueContaining fails", () => {
    expect(dummyGetResult).toHaveValueContaining("missing");
  })
  .build();

// SET result failures
export const setToBeOk = scenario("Redis SET - toBeOk failure", {
  tags: ["failure", "redis"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummySetResult).toBeOk();
  })
  .build();

export const setToHaveValue = scenario("Redis SET - toHaveValue failure", {
  tags: ["failure", "redis"],
})
  .step("toHaveValue fails with wrong value", () => {
    expect(dummySetResult).toHaveValue("FAIL");
  })
  .build();

// COUNT result failures
export const countToBeOk = scenario("Redis COUNT - toBeOk failure", {
  tags: ["failure", "redis"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyCountResult).toBeOk();
  })
  .build();

export const countToHaveValue = scenario("Redis COUNT - toHaveValue failure", {
  tags: ["failure", "redis"],
})
  .step("toHaveValue fails with wrong value", () => {
    expect(dummyCountResult).toHaveValue(100);
  })
  .build();

export const countToHaveValueGreaterThan = scenario(
  "Redis COUNT - toHaveValueGreaterThan failure",
  { tags: ["failure", "redis"] },
)
  .step("toHaveValueGreaterThan fails", () => {
    expect(dummyCountResult).toHaveValueGreaterThan(50);
  })
  .build();

export const countToHaveValueLessThan = scenario(
  "Redis COUNT - toHaveValueLessThan failure",
  { tags: ["failure", "redis"] },
)
  .step("toHaveValueLessThan fails", () => {
    expect(dummyCountResult).toHaveValueLessThan(40);
  })
  .build();

// ARRAY result failures
export const arrayToBeOk = scenario("Redis ARRAY - toBeOk failure", {
  tags: ["failure", "redis"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyArrayResult).toBeOk();
  })
  .build();

export const arrayToHaveValueEmpty = scenario(
  "Redis ARRAY - toHaveValueEmpty failure",
  { tags: ["failure", "redis"] },
)
  .step("toHaveValueEmpty fails when array has items", () => {
    expect(dummyArrayResult).toHaveValueEmpty();
  })
  .build();

export const arrayToHaveValueContaining = scenario(
  "Redis ARRAY - toHaveValueContaining failure",
  { tags: ["failure", "redis"] },
)
  .step("toHaveValueContaining fails when item missing", () => {
    expect(dummyArrayResult).toHaveValueContaining("missing-item");
  })
  .build();

export const arrayToHaveValueCount = scenario(
  "Redis ARRAY - toHaveValueCount failure",
  { tags: ["failure", "redis"] },
)
  .step("toHaveValueCount fails with wrong count", () => {
    expect(dummyArrayResult).toHaveValueCount(10);
  })
  .build();

// HASH result failures
export const hashToBeOk = scenario("Redis HASH - toBeOk failure", {
  tags: ["failure", "redis"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyHashResult).toBeOk();
  })
  .build();

export const hashToHaveValueProperty = scenario(
  "Redis HASH - toHaveValueProperty failure",
  { tags: ["failure", "redis"] },
)
  .step("toHaveValueProperty fails when property missing", () => {
    expect(dummyHashResult).toHaveValueProperty("missingField");
  })
  .build();

// Duration failures
export const toHaveDuration = scenario("Redis - toHaveDuration failure", {
  tags: ["failure", "redis"],
})
  .step("toHaveDuration fails with wrong duration", () => {
    expect(dummyGetResult).toHaveDuration(100);
  })
  .build();

export const toHaveDurationLessThan = scenario(
  "Redis - toHaveDurationLessThan failure",
  { tags: ["failure", "redis"] },
)
  .step("toHaveDurationLessThan fails", () => {
    expect(dummyGetResult).toHaveDurationLessThan(3);
  })
  .build();

// Negation failures
export const notToBeOk = scenario("Redis - not.toBeOk failure", {
  tags: ["failure", "redis"],
})
  .step("not.toBeOk fails when ok is true", () => {
    const okResult = mockGetResult({ ok: true });
    expect(okResult).not.toBeOk();
  })
  .build();

export default [
  getToBeOk,
  getToHaveValue,
  getToHaveValueNull,
  getToHaveValueContaining,
  setToBeOk,
  setToHaveValue,
  countToBeOk,
  countToHaveValue,
  countToHaveValueGreaterThan,
  countToHaveValueLessThan,
  arrayToBeOk,
  arrayToHaveValueEmpty,
  arrayToHaveValueContaining,
  arrayToHaveValueCount,
  hashToBeOk,
  hashToHaveValueProperty,
  toHaveDuration,
  toHaveDurationLessThan,
  notToBeOk,
];
