import type {
  RedisArrayResult,
  RedisCommonResult,
  RedisCountResult,
  RedisGetResult,
  RedisHashResult,
  RedisResult,
  RedisSetResult,
} from "@probitas/client-redis";
import {
  expectRedisCountResult,
  type RedisCountResultExpectation,
} from "./redis/count.ts";
import {
  expectRedisArrayResult,
  type RedisArrayResultExpectation,
} from "./redis/array.ts";
import {
  expectRedisGetResult,
  type RedisGetResultExpectation,
} from "./redis/get.ts";
import {
  expectRedisSetResult,
  type RedisSetResultExpectation,
} from "./redis/set.ts";
import {
  expectRedisCommonResult,
  type RedisCommonResultExpectation,
} from "./redis/common.ts";
import {
  expectRedisHashResult,
  type RedisHashResultExpectation,
} from "./redis/hash.ts";

// Re-export interfaces
export type {
  RedisArrayResultExpectation,
  RedisCommonResultExpectation,
  RedisCountResultExpectation,
  RedisGetResultExpectation,
  RedisHashResultExpectation,
  RedisSetResultExpectation,
};

/**
 * Expectation type returned by expectRedisResult based on the result type.
 */
export type RedisExpectation<R extends RedisResult> = R extends RedisCountResult
  ? RedisCountResultExpectation
  : R extends RedisArrayResult ? RedisArrayResultExpectation
  : R extends RedisGetResult ? RedisGetResultExpectation
  : R extends RedisSetResult ? RedisSetResultExpectation
  : R extends RedisHashResult ? RedisHashResultExpectation
  : R extends RedisCommonResult ? RedisCommonResultExpectation
  : never;

/**
 * Create a fluent expectation chain for any Redis result validation.
 *
 * This unified function accepts any Redis result type and returns
 * the appropriate expectation interface based on the result's type discriminator.
 *
 * @example
 * ```ts
 * import type { RedisGetResult, RedisCountResult, RedisArrayResult } from "@probitas/client-redis";
 * import { expectRedisResult } from "./redis.ts";
 *
 * // For GET result - returns RedisGetResultExpectation
 * const getResult = {
 *   kind: "redis:get",
 *   ok: true,
 *   value: "expected",
 *   duration: 0,
 * } as unknown as RedisGetResult;
 * expectRedisResult(getResult).toBeOk().toHaveValue("expected");
 *
 * // For COUNT result - returns RedisCountResultExpectation
 * const countResult = {
 *   kind: "redis:count",
 *   ok: true,
 *   value: 1,
 *   duration: 0,
 * } as unknown as RedisCountResult;
 * expectRedisResult(countResult).toBeOk().toHaveValue(1);
 *
 * // For ARRAY result - returns RedisArrayResultExpectation
 * const arrayResult = {
 *   kind: "redis:array",
 *   ok: true,
 *   value: ["a", "b", "item"],
 *   duration: 0,
 * } as unknown as RedisArrayResult<string>;
 * expectRedisResult(arrayResult).toBeOk().toHaveValueCount(3).toHaveValueContaining("item");
 * ```
 */
export function expectRedisResult<R extends RedisResult>(
  result: R,
): RedisExpectation<R> {
  switch (result.kind) {
    case "redis:count":
      return expectRedisCountResult(
        result as RedisCountResult,
      ) as RedisExpectation<R>;
    case "redis:array":
      return expectRedisArrayResult(
        result as RedisArrayResult,
      ) as RedisExpectation<R>;
    case "redis:get":
      return expectRedisGetResult(
        result as RedisGetResult,
      ) as RedisExpectation<R>;
    case "redis:set":
      return expectRedisSetResult(
        result as RedisSetResult,
      ) as RedisExpectation<R>;
    case "redis:hash":
      return expectRedisHashResult(
        result as RedisHashResult,
      ) as RedisExpectation<R>;
    case "redis:common":
      return expectRedisCommonResult(
        result as RedisCommonResult,
      ) as RedisExpectation<R>;
    default:
      throw new Error(
        `Unknown Redis result kind: ${(result as { kind: string }).kind}`,
      );
  }
}
