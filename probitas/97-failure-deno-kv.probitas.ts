/**
 * Deno KV Client Failure Examples
 *
 * This file demonstrates failure messages for each Deno KV expectation method.
 * All scenarios are expected to fail - they use dummy results to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import type {
  DenoKvAtomicResult,
  DenoKvDeleteResult,
  DenoKvEntries,
  DenoKvEntry,
  DenoKvGetResult,
  DenoKvListResult,
  DenoKvSetResult,
} from "jsr:@probitas/client-deno-kv@^0";

// Helper to create DenoKvEntries
function createMockEntries<T>(entries: DenoKvEntry<T>[]): DenoKvEntries<T> {
  const arr = [...entries] as DenoKvEntry<T>[] & {
    first(): DenoKvEntry<T> | undefined;
    firstOrThrow(): DenoKvEntry<T>;
    last(): DenoKvEntry<T> | undefined;
    lastOrThrow(): DenoKvEntry<T>;
  };
  arr.first = function () {
    return this[0];
  };
  arr.firstOrThrow = function () {
    if (this.length === 0) throw new Error("No entries available");
    return this[0];
  };
  arr.last = function () {
    return this[this.length - 1];
  };
  arr.lastOrThrow = function () {
    if (this.length === 0) throw new Error("No entries available");
    return this[this.length - 1];
  };
  return arr as unknown as DenoKvEntries<T>;
}

// Mock helpers
const mockGetResult = <T>(
  overrides: Partial<DenoKvGetResult<T>> = {},
): DenoKvGetResult<T> => ({
  kind: "deno-kv:get" as const,
  ok: false,
  key: ["users", "123"],
  value: { name: "Alice", age: 30 } as T,
  versionstamp: "00000001",
  duration: 3,
  ...overrides,
});

const mockSetResult = (
  overrides: Partial<DenoKvSetResult> = {},
): DenoKvSetResult => ({
  kind: "deno-kv:set" as const,
  ok: false,
  versionstamp: "00000002",
  duration: 5,
  ...overrides,
});

const mockDeleteResult = (
  overrides: Partial<DenoKvDeleteResult> = {},
): DenoKvDeleteResult => ({
  kind: "deno-kv:delete" as const,
  ok: false,
  duration: 2,
  ...overrides,
});

const mockListResult = <T>(
  overrides: Partial<Omit<DenoKvListResult<T>, "entries">> & {
    entries?: DenoKvEntry<T>[];
  } = {},
): DenoKvListResult<T> => {
  const { entries: rawEntries, ...rest } = overrides;
  const defaultEntries: DenoKvEntry<T>[] = [
    { key: ["users", "1"], value: { name: "Alice" } as T, versionstamp: "v1" },
    { key: ["users", "2"], value: { name: "Bob" } as T, versionstamp: "v2" },
  ];
  return {
    kind: "deno-kv:list" as const,
    ok: false,
    entries: createMockEntries(rawEntries ?? defaultEntries),
    duration: 10,
    ...rest,
  };
};

const mockAtomicResult = (
  overrides: Partial<DenoKvAtomicResult> = {},
): DenoKvAtomicResult => ({
  kind: "deno-kv:atomic" as const,
  ok: false,
  versionstamp: undefined,
  duration: 8,
  ...overrides,
});

const dummyGetResult = mockGetResult();
const dummySetResult = mockSetResult();
const dummyDeleteResult = mockDeleteResult();
const dummyListResult = mockListResult();
const dummyAtomicResult = mockAtomicResult();

// GET result failures
export const getToBeOk = scenario("Deno KV GET - toBeOk failure", {
  tags: ["failure", "deno-kv"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyGetResult).toBeOk();
  })
  .build();

export const getToHaveKey = scenario("Deno KV GET - toHaveKey failure", {
  tags: ["failure", "deno-kv"],
})
  .step("toHaveKey fails with wrong key", () => {
    expect(dummyGetResult).toHaveKey(["different", "key"]);
  })
  .build();

export const getToHaveValueNull = scenario(
  "Deno KV GET - toHaveValueNull failure",
  { tags: ["failure", "deno-kv"] },
)
  .step("toHaveValueNull fails when value exists", () => {
    expect(dummyGetResult).toHaveValueNull();
  })
  .build();

export const getToHaveVersionstamp = scenario(
  "Deno KV GET - toHaveVersionstamp failure",
  { tags: ["failure", "deno-kv"] },
)
  .step("toHaveVersionstamp fails with wrong versionstamp", () => {
    expect(dummyGetResult).toHaveVersionstamp("99999999");
  })
  .build();

// SET result failures
export const setToBeOk = scenario("Deno KV SET - toBeOk failure", {
  tags: ["failure", "deno-kv"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummySetResult).toBeOk();
  })
  .build();

export const setToHaveVersionstamp = scenario(
  "Deno KV SET - toHaveVersionstamp failure",
  { tags: ["failure", "deno-kv"] },
)
  .step("toHaveVersionstamp fails with wrong versionstamp", () => {
    expect(dummySetResult).toHaveVersionstamp("99999999");
  })
  .build();

// DELETE result failures
export const deleteToBeOk = scenario("Deno KV DELETE - toBeOk failure", {
  tags: ["failure", "deno-kv"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyDeleteResult).toBeOk();
  })
  .build();

// LIST result failures
export const listToBeOk = scenario("Deno KV LIST - toBeOk failure", {
  tags: ["failure", "deno-kv"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyListResult).toBeOk();
  })
  .build();

export const listToHaveEntriesEmpty = scenario(
  "Deno KV LIST - toHaveEntriesEmpty failure",
  { tags: ["failure", "deno-kv"] },
)
  .step("toHaveEntriesEmpty fails when entries exist", () => {
    expect(dummyListResult).toHaveEntriesEmpty();
  })
  .build();

export const listToHaveEntryCount = scenario(
  "Deno KV LIST - toHaveEntryCount failure",
  { tags: ["failure", "deno-kv"] },
)
  .step("toHaveEntryCount fails with wrong count", () => {
    expect(dummyListResult).toHaveEntryCount(10);
  })
  .build();

// ATOMIC result failures
export const atomicToBeOk = scenario("Deno KV ATOMIC - toBeOk failure", {
  tags: ["failure", "deno-kv"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyAtomicResult).toBeOk();
  })
  .build();

export const atomicToHaveVersionstampPresent = scenario(
  "Deno KV ATOMIC - toHaveVersionstampPresent failure",
  { tags: ["failure", "deno-kv"] },
)
  .step("toHaveVersionstampPresent fails when undefined", () => {
    expect(dummyAtomicResult).toHaveVersionstampPresent();
  })
  .build();

// Duration failures
export const toHaveDuration = scenario("Deno KV - toHaveDuration failure", {
  tags: ["failure", "deno-kv"],
})
  .step("toHaveDuration fails with wrong duration", () => {
    expect(dummyGetResult).toHaveDuration(100);
  })
  .build();

export const toHaveDurationLessThan = scenario(
  "Deno KV - toHaveDurationLessThan failure",
  { tags: ["failure", "deno-kv"] },
)
  .step("toHaveDurationLessThan fails", () => {
    expect(dummyGetResult).toHaveDurationLessThan(2);
  })
  .build();

// Negation failures
export const notToBeOk = scenario("Deno KV - not.toBeOk failure", {
  tags: ["failure", "deno-kv"],
})
  .step("not.toBeOk fails when ok is true", () => {
    const okResult = mockGetResult({ ok: true });
    expect(okResult).not.toBeOk();
  })
  .build();

export default [
  getToBeOk,
  getToHaveKey,
  getToHaveValueNull,
  getToHaveVersionstamp,
  setToBeOk,
  setToHaveVersionstamp,
  deleteToBeOk,
  listToBeOk,
  listToHaveEntriesEmpty,
  listToHaveEntryCount,
  atomicToBeOk,
  atomicToHaveVersionstampPresent,
  toHaveDuration,
  toHaveDurationLessThan,
  notToBeOk,
];
