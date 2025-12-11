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
 * // For GET result - returns DenoKvGetResultExpectation<T>
 * const getResult = await kv.get(["users", "1"]);
 * expectDenoKvResult(getResult).toBeSuccessful().toHaveContent().toMatchObject({ name: "Alice" });
 *
 * // For SET result - returns DenoKvSetResultExpectation
 * const setResult = await kv.set(["users", "1"], { name: "Alice" });
 * expectDenoKvResult(setResult).toBeSuccessful().toHaveVersionstamp();
 *
 * // For LIST result - returns DenoKvListResultExpectation<T>
 * const listResult = await kv.list({ prefix: ["users"] });
 * expectDenoKvResult(listResult).toBeSuccessful().toHaveLength(3);
 *
 * // For DELETE result - returns DenoKvDeleteResultExpectation
 * const deleteResult = await kv.delete(["users", "1"]);
 * expectDenoKvResult(deleteResult).toBeSuccessful();
 *
 * // For ATOMIC result - returns DenoKvAtomicResultExpectation
 * const atomicResult = await kv.atomic().set(["counter"], 1).commit();
 * expectDenoKvResult(atomicResult).toBeSuccessful().toHaveVersionstamp();
 * ```
 */
// deno-lint-ignore no-explicit-any
export function expectDenoKvResult<R extends DenoKvResult<any>>(
  result: R,
): DenoKvExpectation<R> {
  switch (result.type) {
    case "deno-kv:get":
      return expectDenoKvGetResult(
        // deno-lint-ignore no-explicit-any
        result as DenoKvGetResult<any>,
      ) as unknown as DenoKvExpectation<R>;
    case "deno-kv:list":
      return expectDenoKvListResult(
        // deno-lint-ignore no-explicit-any
        result as DenoKvListResult<any>,
      ) as unknown as DenoKvExpectation<R>;
    case "deno-kv:set":
      return expectDenoKvSetResult(
        result as DenoKvSetResult,
      ) as unknown as DenoKvExpectation<R>;
    case "deno-kv:delete":
      return expectDenoKvDeleteResult(
        result as DenoKvDeleteResult,
      ) as unknown as DenoKvExpectation<R>;
    case "deno-kv:atomic":
      return expectDenoKvAtomicResult(
        result as DenoKvAtomicResult,
      ) as unknown as DenoKvExpectation<R>;
    default:
      throw new Error(
        `Unknown Deno KV result type: ${(result as { type: string }).type}`,
      );
  }
}
