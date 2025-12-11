import type {
  MongoCountResult,
  MongoDeleteResult,
  MongoDocs,
  MongoFindOneResult,
  MongoFindResult,
  MongoInsertOneResult,
  MongoUpdateResult,
} from "@probitas/client-mongodb";

// Helper to create MongoDocs (array with helper methods)
export function createMockMongoDocs<T>(docs: T[]): MongoDocs<T> {
  const arr = [...docs] as T[] & {
    first(): T | undefined;
    firstOrThrow(): T;
    last(): T | undefined;
    lastOrThrow(): T;
  };
  arr.first = function () {
    return this[0];
  };
  arr.firstOrThrow = function () {
    if (this.length === 0) throw new Error("No documents available");
    return this[0];
  };
  arr.last = function () {
    return this[this.length - 1];
  };
  arr.lastOrThrow = function () {
    if (this.length === 0) throw new Error("No documents available");
    return this[this.length - 1];
  };
  return arr as unknown as MongoDocs<T>;
}

export const mockMongoFindResult = <T>(
  overrides: Partial<Omit<MongoFindResult<T>, "docs">> & { docs?: T[] } = {},
): MongoFindResult<T> => {
  const { docs: rawDocs, ...rest } = overrides;
  const defaultDocs: T[] = [{ id: "1", name: "Alice" }] as T[];
  return {
    type: "mongo:find" as const,
    ok: true,
    docs: createMockMongoDocs(rawDocs ?? defaultDocs),
    duration: 100,
    ...rest,
  };
};

export const mockMongoInsertOneResult = (
  overrides: Partial<MongoInsertOneResult> = {},
): MongoInsertOneResult => ({
  type: "mongo:insert" as const,
  ok: true,
  insertedId: "123",
  duration: 100,
  ...overrides,
});

export const mockMongoUpdateResult = (
  overrides: Partial<MongoUpdateResult> = {},
): MongoUpdateResult => ({
  type: "mongo:update" as const,
  ok: true,
  matchedCount: 1,
  modifiedCount: 1,
  upsertedId: undefined,
  duration: 100,
  ...overrides,
});

export const mockMongoDeleteResult = (
  overrides: Partial<MongoDeleteResult> = {},
): MongoDeleteResult => ({
  type: "mongo:delete" as const,
  ok: true,
  deletedCount: 1,
  duration: 100,
  ...overrides,
});

export const mockMongoFindOneResult = <T>(
  overrides: Partial<MongoFindOneResult<T>> = {},
): MongoFindOneResult<T> => ({
  type: "mongo:find-one" as const,
  ok: true,
  doc: { id: "1", name: "Alice" } as T,
  duration: 100,
  ...overrides,
});

export const mockMongoCountResult = (
  overrides: Partial<MongoCountResult> = {},
): MongoCountResult => ({
  type: "mongo:count" as const,
  ok: true,
  count: 10,
  duration: 100,
  ...overrides,
});
