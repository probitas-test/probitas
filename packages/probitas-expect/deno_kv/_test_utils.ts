import type {
  DenoKvAtomicResult,
  DenoKvDeleteResult,
  DenoKvEntries,
  DenoKvEntry,
  DenoKvGetResult,
  DenoKvListResult,
  DenoKvSetResult,
} from "@probitas/client-deno-kv";

// Helper to create DenoKvEntries (array with helper methods)
export function createMockDenoKvEntries<T>(
  entries: DenoKvEntry<T>[],
): DenoKvEntries<T> {
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
export const mockDenoKvGetResult = <T>(
  overrides: Partial<DenoKvGetResult<T>> = {},
): DenoKvGetResult<T> => ({
  type: "deno-kv:get" as const,
  ok: true,
  key: ["users", "1"],
  value: { name: "Alice" } as T,
  versionstamp: "v1",
  duration: 100,
  ...overrides,
});

export const mockDenoKvListResult = <T>(
  overrides: Partial<Omit<DenoKvListResult<T>, "entries">> & {
    entries?: DenoKvEntry<T>[];
  } = {},
): DenoKvListResult<T> => {
  const { entries: rawEntries, ...rest } = overrides;
  const defaultEntries: DenoKvEntry<T>[] = [
    { key: ["users", "1"], value: { name: "Alice" } as T, versionstamp: "v1" },
  ];
  return {
    type: "deno-kv:list" as const,
    ok: true,
    entries: createMockDenoKvEntries(rawEntries ?? defaultEntries),
    duration: 100,
    ...rest,
  };
};

export const mockDenoKvSetResult = (
  overrides: Partial<DenoKvSetResult> = {},
): DenoKvSetResult => ({
  type: "deno-kv:set" as const,
  ok: true,
  versionstamp: "v1",
  duration: 100,
  ...overrides,
});

export const mockDenoKvDeleteResult = (
  overrides: Partial<DenoKvDeleteResult> = {},
): DenoKvDeleteResult => ({
  type: "deno-kv:delete" as const,
  ok: true,
  duration: 100,
  ...overrides,
});

export const mockDenoKvAtomicResult = (
  overrides: Partial<DenoKvAtomicResult> = {},
): DenoKvAtomicResult => ({
  type: "deno-kv:atomic" as const,
  ok: true,
  versionstamp: "v1",
  duration: 100,
  ...overrides,
});
