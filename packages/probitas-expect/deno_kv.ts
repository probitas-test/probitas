import {
  buildCountAtLeastError,
  buildCountAtMostError,
  buildCountError,
  buildDurationError,
  containsSubset,
} from "./common.ts";
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
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation succeeded */
  toBeSuccessful(): this;

  /** Assert that content exists */
  toHaveContent(): this;

  /** Assert that value equals expected */
  toHaveValue(expected: T): this;

  /** Assert that data contains expected properties */
  toMatchObject(subset: Partial<T>): this;

  /** Assert data using custom matcher function */
  toSatisfy(matcher: (value: T) => void): this;

  /** Assert that versionstamp exists */
  toHaveVersionstamp(): this;

  /** Assert that duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for validating DenoKvListResult.
 */
export interface DenoKvListResultExpectation<T> {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation succeeded */
  toBeSuccessful(): this;

  /** Assert that content exists */
  toHaveContent(): this;

  /** Assert that entry count equals expected */
  toHaveLength(expected: number): this;

  /** Assert that entry count is at least min */
  toHaveLengthGreaterThanOrEqual(min: number): this;

  /** Assert that entry count is at most max */
  toHaveLengthLessThanOrEqual(max: number): this;

  /** Assert that at least one entry contains expected properties */
  toHaveEntryContaining(subset: { key?: Deno.KvKey; value?: Partial<T> }): this;

  /** Assert entries using custom matcher function */
  toSatisfy(matcher: (entries: DenoKvEntries<T>) => void): this;

  /** Assert that duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for validating DenoKvSetResult.
 */
export interface DenoKvSetResultExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation succeeded */
  toBeSuccessful(): this;

  /** Assert that versionstamp exists */
  toHaveVersionstamp(): this;

  /** Assert that duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for validating DenoKvDeleteResult.
 */
export interface DenoKvDeleteResultExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation succeeded */
  toBeSuccessful(): this;

  /** Assert that duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;
}

/**
 * Fluent API for validating DenoKvAtomicResult.
 */
export interface DenoKvAtomicResultExpectation {
  /** Invert all assertions */
  readonly not: this;

  /** Assert that operation succeeded */
  toBeSuccessful(): this;

  /** Assert that versionstamp exists (only present on successful atomic commits) */
  toHaveVersionstamp(): this;

  /** Assert that duration is less than threshold (ms) */
  toHaveDurationLessThan(ms: number): this;
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
  readonly #negate: boolean;

  constructor(result: DenoKvGetResult<T>, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new DenoKvGetResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate ? "Expected not ok result" : "Expected ok result",
      );
    }
    return this;
  }

  toHaveContent(): this {
    const hasContent = this.#result.value !== null;
    if (this.#negate ? hasContent : !hasContent) {
      throw new Error(
        this.#negate
          ? "Expected no content, but value exists"
          : "Expected content, but value is null",
      );
    }
    return this;
  }

  toHaveValue(expected: T): this {
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

  toMatchObject(subset: Partial<T>): this {
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

  toSatisfy(matcher: (value: T) => void): this {
    if (this.#result.value === null) {
      throw new Error("Expected data for matching, but value is null");
    }
    matcher(this.#result.value);
    return this;
  }

  toHaveVersionstamp(): this {
    if (this.#result.versionstamp === null) {
      throw new Error("Expected versionstamp, but it is null");
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
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
  readonly #negate: boolean;

  constructor(result: DenoKvListResult<T>, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new DenoKvListResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate ? "Expected not ok result" : "Expected ok result",
      );
    }
    return this;
  }

  toHaveContent(): this {
    const hasContent = this.#result.entries.length > 0;
    if (this.#negate ? hasContent : !hasContent) {
      throw new Error(
        this.#negate
          ? `Expected no entries, but found ${this.#result.entries.length}`
          : "Expected entries, but none found",
      );
    }
    return this;
  }

  toHaveLength(expected: number): this {
    if (this.#result.entries.length !== expected) {
      throw new Error(
        buildCountError(expected, this.#result.entries.length, "entries"),
      );
    }
    return this;
  }

  toHaveLengthGreaterThanOrEqual(min: number): this {
    if (this.#result.entries.length < min) {
      throw new Error(
        buildCountAtLeastError(min, this.#result.entries.length, "entries"),
      );
    }
    return this;
  }

  toHaveLengthLessThanOrEqual(max: number): this {
    if (this.#result.entries.length > max) {
      throw new Error(
        buildCountAtMostError(max, this.#result.entries.length, "entries"),
      );
    }
    return this;
  }

  toHaveEntryContaining(
    subset: { key?: Deno.KvKey; value?: Partial<T> },
  ): this {
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

  toSatisfy(matcher: (entries: DenoKvEntries<T>) => void): this {
    matcher(this.#result.entries);
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
    }
    return this;
  }
}

/**
 * DenoKvSetResultExpectation implementation.
 */
class DenoKvSetResultExpectationImpl implements DenoKvSetResultExpectation {
  readonly #result: DenoKvSetResult;
  readonly #negate: boolean;

  constructor(result: DenoKvSetResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new DenoKvSetResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate ? "Expected not ok result" : "Expected ok result",
      );
    }
    return this;
  }

  toHaveVersionstamp(): this {
    if (!this.#result.versionstamp) {
      throw new Error("Expected versionstamp, but it is empty");
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
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
  readonly #negate: boolean;

  constructor(result: DenoKvDeleteResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new DenoKvDeleteResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate ? "Expected not ok result" : "Expected ok result",
      );
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
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
  readonly #negate: boolean;

  constructor(result: DenoKvAtomicResult, negate = false) {
    this.#result = result;
    this.#negate = negate;
  }

  get not(): this {
    return new DenoKvAtomicResultExpectationImpl(
      this.#result,
      !this.#negate,
    ) as this;
  }

  toBeSuccessful(): this {
    const isSuccess = this.#result.ok;
    if (this.#negate ? isSuccess : !isSuccess) {
      throw new Error(
        this.#negate ? "Expected not ok result" : "Expected ok result",
      );
    }
    return this;
  }

  toHaveVersionstamp(): this {
    if (!this.#result.versionstamp) {
      throw new Error("Expected versionstamp, but it is missing or empty");
    }
    return this;
  }

  toHaveDurationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(buildDurationError(ms, this.#result.duration));
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
 * expectDenoKvResult(getResult).ok().hasContent().toMatchObject({ name: "Alice" });
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
