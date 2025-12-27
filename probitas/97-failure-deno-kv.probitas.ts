/**
 * Deno KV Client Failure Examples
 *
 * This file demonstrates failure messages for each Deno KV expectation method.
 * All scenarios are expected to fail - they use dummy results to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import {
  type DenoKvAtomicResult,
  DenoKvConnectionError,
  type DenoKvDeleteResult,
  type DenoKvEntry,
  type DenoKvGetResult,
  type DenoKvListResult,
  type DenoKvSetResult,
} from "jsr:@probitas/client-deno-kv@^0";

// Helper functions - separate functions for ok:true and ok:false states

function createSuccessGetResult<T>(
  key: Deno.KvKey,
  value: T | null,
  versionstamp: string | null,
): DenoKvGetResult<T> {
  return {
    kind: "deno-kv:get" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    key,
    value,
    versionstamp,
    duration: 3,
  };
}

function createFailureGetResult<T>(): DenoKvGetResult<T> {
  return {
    kind: "deno-kv:get" as const,
    processed: false as const,
    ok: false as const,
    error: new DenoKvConnectionError("Connection failed"),
    key: null,
    value: null,
    versionstamp: null,
    duration: 0,
  };
}

function createSuccessSetResult(versionstamp: string): DenoKvSetResult {
  return {
    kind: "deno-kv:set" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    versionstamp,
    duration: 5,
  };
}

function createFailureSetResult(): DenoKvSetResult {
  return {
    kind: "deno-kv:set" as const,
    processed: false as const,
    ok: false as const,
    error: new DenoKvConnectionError("Connection failed"),
    versionstamp: null,
    duration: 0,
  };
}

function createSuccessDeleteResult(): DenoKvDeleteResult {
  return {
    kind: "deno-kv:delete" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    duration: 2,
  };
}

function createFailureDeleteResult(): DenoKvDeleteResult {
  return {
    kind: "deno-kv:delete" as const,
    processed: false as const,
    ok: false as const,
    error: new DenoKvConnectionError("Connection failed"),
    duration: 0,
  };
}

function createSuccessListResult<T>(
  entries: readonly DenoKvEntry<T>[],
): DenoKvListResult<T> {
  return {
    kind: "deno-kv:list" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    entries,
    duration: 10,
  };
}

function createFailureListResult<T>(): DenoKvListResult<T> {
  return {
    kind: "deno-kv:list" as const,
    processed: false as const,
    ok: false as const,
    error: new DenoKvConnectionError("Connection failed"),
    entries: [],
    duration: 0,
  };
}

function createCheckFailedAtomicResult(): DenoKvAtomicResult {
  return {
    kind: "deno-kv:atomic" as const,
    processed: true as const,
    ok: false as const,
    error: null,
    versionstamp: null,
    duration: 8,
  };
}

function createFailureAtomicResult(): DenoKvAtomicResult {
  return {
    kind: "deno-kv:atomic" as const,
    processed: false as const,
    ok: false as const,
    error: new DenoKvConnectionError("Connection failed"),
    versionstamp: null,
    duration: 0,
  };
}

interface TestUser {
  name: string;
  age?: number;
}

const dummyGetResult = createSuccessGetResult<TestUser>(
  ["users", "123"],
  { name: "Alice", age: 30 },
  "00000001",
);
const dummySetResult = createSuccessSetResult("00000002");
const _dummyDeleteResult = createSuccessDeleteResult();
const dummyListResult = createSuccessListResult<TestUser>([
  { key: ["users", "1"], value: { name: "Alice" }, versionstamp: "v1" },
  { key: ["users", "2"], value: { name: "Bob" }, versionstamp: "v2" },
]);
const dummyAtomicResult = createCheckFailedAtomicResult();

// GET result failures
export const getToBeOk = scenario("Deno KV GET - toBeOk failure", {
  tags: ["failure", "deno-kv"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(createFailureGetResult()).toBeOk();
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
    expect(createFailureSetResult()).toBeOk();
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
    expect(createFailureDeleteResult()).toBeOk();
  })
  .build();

// LIST result failures
export const listToBeOk = scenario("Deno KV LIST - toBeOk failure", {
  tags: ["failure", "deno-kv"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(createFailureListResult()).toBeOk();
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
    expect(createFailureAtomicResult()).toBeOk();
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
    expect(dummyGetResult).not.toBeOk();
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
