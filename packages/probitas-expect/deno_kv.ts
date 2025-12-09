import { containsSubset } from "./common.ts";
import type {
  DenoKvAtomicResult,
  DenoKvDeleteResult,
  DenoKvEntries,
  DenoKvGetResult,
  DenoKvListResult,
  DenoKvResult,
  DenoKvSetResult,
} from "@probitas/client-deno-kv";

/**
 * Fluent API for validating DenoKvGetResult.
 */
export interface DenoKvGetResultExpectation<T> {
  /** Assert that operation succeeded */
  ok(): this;

  /** Assert that operation did not succeed */
  notOk(): this;

  /** Assert that no value was found (value is null) */
  noContent(): this;

  /** Assert that a value was found (value is not null) */
  hasContent(): this;

  /** Assert that value equals expected */
  value(expected: T): this;

  /** Assert that data contains expected properties */
  dataContains(subset: Partial<T>): this;

  /** Assert data using custom matcher function */
  dataMatch(matcher: (value: T) => void): this;

  /** Assert that versionstamp exists */
  hasVersionstamp(): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for validating DenoKvListResult.
 */
export interface DenoKvListResultExpectation<T> {
  /** Assert that operation succeeded */
  ok(): this;

  /** Assert that operation did not succeed */
  notOk(): this;

  /** Assert that no entries were found */
  noContent(): this;

  /** Assert that at least one entry was found */
  hasContent(): this;

  /** Assert that entry count equals expected */
  count(expected: number): this;

  /** Assert that entry count is at least min */
  countAtLeast(min: number): this;

  /** Assert that entry count is at most max */
  countAtMost(max: number): this;

  /** Assert that at least one entry contains expected properties */
  entryContains(subset: { key?: Deno.KvKey; value?: Partial<T> }): this;

  /** Assert entries using custom matcher function */
  entriesMatch(matcher: (entries: DenoKvEntries<T>) => void): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for validating DenoKvSetResult.
 */
export interface DenoKvSetResultExpectation {
  /** Assert that operation succeeded */
  ok(): this;

  /** Assert that operation did not succeed */
  notOk(): this;

  /** Assert that versionstamp exists */
  hasVersionstamp(): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for validating DenoKvDeleteResult.
 */
export interface DenoKvDeleteResultExpectation {
  /** Assert that operation succeeded */
  ok(): this;

  /** Assert that operation did not succeed */
  notOk(): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for validating DenoKvAtomicResult.
 */
export interface DenoKvAtomicResultExpectation {
  /** Assert that operation succeeded */
  ok(): this;

  /** Assert that operation did not succeed */
  notOk(): this;

  /** Assert that versionstamp exists (only present on successful atomic commits) */
  hasVersionstamp(): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Check if two KvKey arrays are equal.
 */
function keysEqual(a: Deno.KvKey, b: Deno.KvKey): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * DenoKvGetResultExpectation implementation.
 */
class DenoKvGetResultExpectationImpl<T>
  implements DenoKvGetResultExpectation<T> {
  readonly #result: DenoKvGetResult<T>;

  constructor(result: DenoKvGetResult<T>) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result");
    }
    return this;
  }

  noContent(): this {
    if (this.#result.value !== null) {
      throw new Error("Expected no content, but value exists");
    }
    return this;
  }

  hasContent(): this {
    if (this.#result.value === null) {
      throw new Error("Expected content, but value is null");
    }
    return this;
  }

  value(expected: T): this {
    if (this.#result.value === null) {
      throw new Error("Expected value, but value is null");
    }
    if (JSON.stringify(this.#result.value) !== JSON.stringify(expected)) {
      throw new Error(
        `Expected value ${JSON.stringify(expected)}, got ${
          JSON.stringify(this.#result.value)
        }`,
      );
    }
    return this;
  }

  dataContains(subset: Partial<T>): this {
    if (this.#result.value === null) {
      throw new Error(
        "Expected data to contain properties, but value is null",
      );
    }
    if (!containsSubset(this.#result.value, subset)) {
      throw new Error("Data does not contain expected properties");
    }
    return this;
  }

  dataMatch(matcher: (value: T) => void): this {
    if (this.#result.value === null) {
      throw new Error("Expected data for matching, but value is null");
    }
    matcher(this.#result.value);
    return this;
  }

  hasVersionstamp(): this {
    if (this.#result.versionstamp === null) {
      throw new Error("Expected versionstamp, but it is null");
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * DenoKvListResultExpectation implementation.
 */
class DenoKvListResultExpectationImpl<T>
  implements DenoKvListResultExpectation<T> {
  readonly #result: DenoKvListResult<T>;

  constructor(result: DenoKvListResult<T>) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result");
    }
    return this;
  }

  noContent(): this {
    if (this.#result.entries.length !== 0) {
      throw new Error(
        `Expected no entries, but found ${this.#result.entries.length}`,
      );
    }
    return this;
  }

  hasContent(): this {
    if (this.#result.entries.length === 0) {
      throw new Error("Expected entries, but none found");
    }
    return this;
  }

  count(expected: number): this {
    if (this.#result.entries.length !== expected) {
      throw new Error(
        `Expected ${expected} entries, got ${this.#result.entries.length}`,
      );
    }
    return this;
  }

  countAtLeast(min: number): this {
    if (this.#result.entries.length < min) {
      throw new Error(
        `Expected at least ${min} entries, got ${this.#result.entries.length}`,
      );
    }
    return this;
  }

  countAtMost(max: number): this {
    if (this.#result.entries.length > max) {
      throw new Error(
        `Expected at most ${max} entries, got ${this.#result.entries.length}`,
      );
    }
    return this;
  }

  entryContains(subset: { key?: Deno.KvKey; value?: Partial<T> }): this {
    const found = this.#result.entries.some((entry) => {
      if (subset.key !== undefined && !keysEqual(entry.key, subset.key)) {
        return false;
      }
      if (
        subset.value !== undefined &&
        !containsSubset(entry.value, subset.value)
      ) {
        return false;
      }
      return true;
    });

    if (!found) {
      throw new Error("No entry matches the expected criteria");
    }
    return this;
  }

  entriesMatch(matcher: (entries: DenoKvEntries<T>) => void): this {
    matcher(this.#result.entries);
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * DenoKvSetResultExpectation implementation.
 */
class DenoKvSetResultExpectationImpl implements DenoKvSetResultExpectation {
  readonly #result: DenoKvSetResult;

  constructor(result: DenoKvSetResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result");
    }
    return this;
  }

  hasVersionstamp(): this {
    if (!this.#result.versionstamp) {
      throw new Error("Expected versionstamp, but it is empty");
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * DenoKvDeleteResultExpectation implementation.
 */
class DenoKvDeleteResultExpectationImpl
  implements DenoKvDeleteResultExpectation {
  readonly #result: DenoKvDeleteResult;

  constructor(result: DenoKvDeleteResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result");
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * DenoKvAtomicResultExpectation implementation.
 */
class DenoKvAtomicResultExpectationImpl
  implements DenoKvAtomicResultExpectation {
  readonly #result: DenoKvAtomicResult;

  constructor(result: DenoKvAtomicResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result");
    }
    return this;
  }

  hasVersionstamp(): this {
    if (!this.#result.versionstamp) {
      throw new Error("Expected versionstamp, but it is missing or empty");
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

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
 * expectDenoKvResult(getResult).ok().hasContent().dataContains({ name: "Alice" });
 *
 * // For SET result - returns DenoKvSetResultExpectation
 * const setResult = await kv.set(["users", "1"], { name: "Alice" });
 * expectDenoKvResult(setResult).ok().hasVersionstamp();
 *
 * // For LIST result - returns DenoKvListResultExpectation<T>
 * const listResult = await kv.list({ prefix: ["users"] });
 * expectDenoKvResult(listResult).ok().count(3);
 *
 * // For DELETE result - returns DenoKvDeleteResultExpectation
 * const deleteResult = await kv.delete(["users", "1"]);
 * expectDenoKvResult(deleteResult).ok();
 *
 * // For ATOMIC result - returns DenoKvAtomicResultExpectation
 * const atomicResult = await kv.atomic().set(["counter"], 1).commit();
 * expectDenoKvResult(atomicResult).ok().hasVersionstamp();
 * ```
 */
// deno-lint-ignore no-explicit-any
export function expectDenoKvResult<R extends DenoKvResult<any>>(
  result: R,
): DenoKvExpectation<R> {
  switch (result.type) {
    case "deno-kv:get":
      return new DenoKvGetResultExpectationImpl(
        // deno-lint-ignore no-explicit-any
        result as DenoKvGetResult<any>,
      ) as unknown as DenoKvExpectation<R>;
    case "deno-kv:list":
      return new DenoKvListResultExpectationImpl(
        // deno-lint-ignore no-explicit-any
        result as DenoKvListResult<any>,
      ) as unknown as DenoKvExpectation<R>;
    case "deno-kv:set":
      return new DenoKvSetResultExpectationImpl(
        result as DenoKvSetResult,
      ) as unknown as DenoKvExpectation<R>;
    case "deno-kv:delete":
      return new DenoKvDeleteResultExpectationImpl(
        result as DenoKvDeleteResult,
      ) as unknown as DenoKvExpectation<R>;
    case "deno-kv:atomic":
      return new DenoKvAtomicResultExpectationImpl(
        result as DenoKvAtomicResult,
      ) as unknown as DenoKvExpectation<R>;
    default:
      throw new Error(
        `Unknown Deno KV result type: ${(result as { type: string }).type}`,
      );
  }
}
