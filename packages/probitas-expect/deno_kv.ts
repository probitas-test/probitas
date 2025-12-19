import type {
  DenoKvAtomicResult,
  DenoKvDeleteResult,
  DenoKvGetResult,
  DenoKvListResult,
  DenoKvResult,
  DenoKvSetResult,
} from "@probitas/client-deno-kv";

// Import all expectation interfaces and functions
import {
  type DenoKvGetResultExpectation,
  expectDenoKvGetResult,
} from "./deno_kv/get.ts";
import {
  type DenoKvListResultExpectation,
  expectDenoKvListResult,
} from "./deno_kv/list.ts";
import {
  type DenoKvSetResultExpectation,
  expectDenoKvSetResult,
} from "./deno_kv/set.ts";
import {
  type DenoKvDeleteResultExpectation,
  expectDenoKvDeleteResult,
} from "./deno_kv/delete.ts";
import {
  type DenoKvAtomicResultExpectation,
  expectDenoKvAtomicResult,
} from "./deno_kv/atomic.ts";

// Re-export for public API
export type {
  DenoKvAtomicResultExpectation,
  DenoKvDeleteResultExpectation,
  DenoKvGetResultExpectation,
  DenoKvListResultExpectation,
  DenoKvSetResultExpectation,
};

/**
 * Expectation type returned by expectDenoKvResult based on the result type.
 */
export type DenoKvExpectation<R extends DenoKvResult> = R extends
  DenoKvGetResult<infer T> ? DenoKvGetResultExpectation<T>
  : R extends DenoKvListResult<infer T> ? DenoKvListResultExpectation<T>
  : R extends DenoKvSetResult ? DenoKvSetResultExpectation
  : R extends DenoKvDeleteResult ? DenoKvDeleteResultExpectation
  : R extends DenoKvAtomicResult ? DenoKvAtomicResultExpectation
  : never;

/**
 * Create a fluent expectation chain for any Deno KV result validation.
 *
 * This unified function accepts any Deno KV result type and returns
 * the appropriate expectation interface based on the result's type discriminator.
 *
 * @example
 * ```ts
 * import type { DenoKvGetResult, DenoKvSetResult, DenoKvListResult, DenoKvDeleteResult, DenoKvAtomicResult } from "@probitas/client-deno-kv";
 * import { expectDenoKvResult } from "./deno_kv.ts";
 *
 * // For GET result - returns DenoKvGetResultExpectation<T>
 * const getResult = {
 *   kind: "deno-kv:get",
 *   ok: true,
 *   key: ["users", "1"],
 *   value: { name: "Alice" },
 *   versionstamp: "00000000000000010000",
 *   duration: 0,
 * } as unknown as DenoKvGetResult<{ name: string }>;
 * expectDenoKvResult(getResult).toBeOk().toHaveValuePresent();
 *
 * // For SET result - returns DenoKvSetResultExpectation
 * const setResult = {
 *   kind: "deno-kv:set",
 *   ok: true,
 *   versionstamp: "00000000000000010000",
 *   duration: 0,
 * } as unknown as DenoKvSetResult;
 * expectDenoKvResult(setResult).toBeOk().toHaveVersionstamp("00000000000000010000");
 *
 * // For LIST result - returns DenoKvListResultExpectation<T>
 * const listResult = {
 *   kind: "deno-kv:list",
 *   ok: true,
 *   entries: [{ key: ["users", "1"], value: { name: "Alice" }, versionstamp: "00000000000000010000" }],
 *   duration: 0,
 * } as unknown as DenoKvListResult<{ name: string }>;
 * expectDenoKvResult(listResult).toBeOk().toHaveEntryCount(1);
 *
 * // For DELETE result - returns DenoKvDeleteResultExpectation
 * const deleteResult = {
 *   kind: "deno-kv:delete",
 *   ok: true,
 *   duration: 0,
 * } as unknown as DenoKvDeleteResult;
 * expectDenoKvResult(deleteResult).toBeOk();
 *
 * // For ATOMIC result - returns DenoKvAtomicResultExpectation
 * const atomicResult = {
 *   kind: "deno-kv:atomic",
 *   ok: true,
 *   versionstamp: "00000000000000010000",
 *   duration: 0,
 * } as unknown as DenoKvAtomicResult;
 * expectDenoKvResult(atomicResult).toBeOk().toHaveVersionstamp("00000000000000010000");
 * ```
 */
export function expectDenoKvResult<R extends DenoKvResult>(
  result: R,
): DenoKvExpectation<R> {
  switch (result.kind) {
    case "deno-kv:get":
      return expectDenoKvGetResult(
        result as DenoKvGetResult,
      ) as DenoKvExpectation<R>;
    case "deno-kv:list":
      return expectDenoKvListResult(
        result as DenoKvListResult,
      ) as DenoKvExpectation<R>;
    case "deno-kv:set":
      return expectDenoKvSetResult(
        result as DenoKvSetResult,
      ) as DenoKvExpectation<R>;
    case "deno-kv:delete":
      return expectDenoKvDeleteResult(
        result as DenoKvDeleteResult,
      ) as DenoKvExpectation<R>;
    case "deno-kv:atomic":
      return expectDenoKvAtomicResult(
        result as DenoKvAtomicResult,
      ) as DenoKvExpectation<R>;
    default:
      throw new Error(
        `Unknown Deno KV result kind: ${(result as { kind: string }).kind}`,
      );
  }
}
