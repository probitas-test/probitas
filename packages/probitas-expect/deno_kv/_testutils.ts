import type {
  DenoKvAtomicResult,
  DenoKvDeleteResult,
  DenoKvEntry,
  DenoKvGetResult,
  DenoKvListResult,
  DenoKvSetResult,
} from "@probitas/client-deno-kv";

// Mock helpers - create success results by default
// Note: These use type assertions because the result types are discriminated
// unions with literal types (ok: true, processed: true). The spread operator
// would widen these to boolean, breaking the type narrowing.
export const mockDenoKvGetResult = <T>(
  overrides: Partial<DenoKvGetResult<T>> = {},
): DenoKvGetResult<T> => {
  const base = {
    kind: "deno-kv:get",
    processed: true,
    ok: true,
    error: null,
    key: ["users", "1"] as Deno.KvKey,
    value: { name: "Alice" } as T,
    versionstamp: "v1",
    duration: 100,
  } as const;
  return { ...base, ...overrides } as DenoKvGetResult<T>;
};

export const mockDenoKvListResult = <T>(
  overrides: Partial<Omit<DenoKvListResult<T>, "entries">> & {
    entries?: DenoKvEntry<T>[];
  } = {},
): DenoKvListResult<T> => {
  const { entries: rawEntries, ...rest } = overrides;
  const defaultEntries: readonly DenoKvEntry<T>[] = [
    { key: ["users", "1"], value: { name: "Alice" } as T, versionstamp: "v1" },
  ];
  const base = {
    kind: "deno-kv:list",
    processed: true,
    ok: true,
    error: null,
    entries: rawEntries ?? defaultEntries,
    duration: 100,
  } as const;
  return { ...base, ...rest } as DenoKvListResult<T>;
};

export const mockDenoKvSetResult = (
  overrides: Partial<DenoKvSetResult> = {},
): DenoKvSetResult => {
  const base = {
    kind: "deno-kv:set",
    processed: true,
    ok: true,
    error: null,
    versionstamp: "v1",
    duration: 100,
  } as const;
  return { ...base, ...overrides } as DenoKvSetResult;
};

export const mockDenoKvDeleteResult = (
  overrides: Partial<DenoKvDeleteResult> = {},
): DenoKvDeleteResult => {
  const base = {
    kind: "deno-kv:delete",
    processed: true,
    ok: true,
    error: null,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as DenoKvDeleteResult;
};

export const mockDenoKvAtomicResult = (
  overrides: Partial<DenoKvAtomicResult> = {},
): DenoKvAtomicResult => {
  const base = {
    kind: "deno-kv:atomic",
    processed: true,
    ok: true,
    error: null,
    versionstamp: "v1",
    duration: 100,
  } as const;
  return { ...base, ...overrides } as DenoKvAtomicResult;
};
