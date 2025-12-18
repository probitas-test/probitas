import type {
  RedisArrayResult,
  RedisCommonResult,
  RedisCountResult,
  RedisGetResult,
  RedisHashResult,
  RedisSetResult,
} from "@probitas/client-redis";

// Mock helpers - create success results by default
// Note: These use type assertions because the result types are discriminated
// unions with literal types (ok: true, processed: true). The spread operator
// would widen these to boolean, breaking the type narrowing.
export const mockRedisGetResult = (
  overrides: Partial<RedisGetResult> = {},
): RedisGetResult => {
  const base = {
    kind: "redis:get",
    processed: true,
    ok: true,
    error: null,
    value: "test-value",
    duration: 100,
  } as const;
  return { ...base, ...overrides } as RedisGetResult;
};

export const mockRedisSetResult = (
  overrides: Partial<RedisSetResult> = {},
): RedisSetResult => {
  const base = {
    kind: "redis:set",
    processed: true,
    ok: true,
    error: null,
    value: "OK",
    duration: 100,
  } as const;
  return { ...base, ...overrides } as RedisSetResult;
};

export const mockRedisCountResult = (
  overrides: Partial<RedisCountResult> = {},
): RedisCountResult => {
  const base = {
    kind: "redis:count",
    processed: true,
    ok: true,
    error: null,
    value: 5,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as RedisCountResult;
};

export const mockRedisArrayResult = <T>(
  overrides: Partial<RedisArrayResult<T>> = {},
): RedisArrayResult<T> => {
  const base = {
    kind: "redis:array",
    processed: true,
    ok: true,
    error: null,
    value: [] as readonly T[],
    duration: 100,
  } as const;
  return { ...base, ...overrides } as RedisArrayResult<T>;
};

export const mockRedisHashResult = (
  overrides: Partial<RedisHashResult> = {},
): RedisHashResult => {
  const base = {
    kind: "redis:hash",
    processed: true,
    ok: true,
    error: null,
    value: { field1: "value1", field2: "value2" },
    duration: 100,
  } as const;
  return { ...base, ...overrides } as RedisHashResult;
};

export const mockRedisCommonResult = <T>(
  overrides: Partial<RedisCommonResult<T>> = {},
): RedisCommonResult<T> => {
  const base = {
    kind: "redis:common",
    processed: true,
    ok: true,
    error: null,
    value: null as T,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as RedisCommonResult<T>;
};
