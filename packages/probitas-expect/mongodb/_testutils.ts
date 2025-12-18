import type {
  MongoCountResult,
  MongoDeleteResult,
  MongoFindOneResult,
  MongoFindResult,
  MongoInsertManyResult,
  MongoInsertOneResult,
  MongoUpdateResult,
} from "@probitas/client-mongodb";

// Note: These use type assertions because the result types are discriminated
// unions with literal types (ok: true, processed: true). The spread operator
// would widen these to boolean, breaking the type narrowing.

export const mockMongoFindResult = <T>(
  overrides: Partial<MongoFindResult<T>> = {},
): MongoFindResult<T> => {
  const defaultDocs: T[] = [{ id: "1", name: "Alice" }] as T[];
  const base = {
    kind: "mongo:find",
    processed: true,
    ok: true,
    error: null,
    docs: defaultDocs,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as MongoFindResult<T>;
};

export const mockMongoInsertOneResult = (
  overrides: Partial<MongoInsertOneResult> = {},
): MongoInsertOneResult => {
  const base = {
    kind: "mongo:insert-one",
    processed: true,
    ok: true,
    error: null,
    insertedId: "123",
    duration: 100,
  } as const;
  return { ...base, ...overrides } as MongoInsertOneResult;
};

export const mockMongoInsertManyResult = (
  overrides: Partial<MongoInsertManyResult> = {},
): MongoInsertManyResult => {
  const base = {
    kind: "mongo:insert-many",
    processed: true,
    ok: true,
    error: null,
    insertedIds: ["123", "456", "789"],
    insertedCount: 3,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as MongoInsertManyResult;
};

export const mockMongoUpdateResult = (
  overrides: Partial<MongoUpdateResult> = {},
): MongoUpdateResult => {
  const base = {
    kind: "mongo:update",
    processed: true,
    ok: true,
    error: null,
    matchedCount: 1,
    modifiedCount: 1,
    upsertedId: undefined,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as MongoUpdateResult;
};

export const mockMongoDeleteResult = (
  overrides: Partial<MongoDeleteResult> = {},
): MongoDeleteResult => {
  const base = {
    kind: "mongo:delete",
    processed: true,
    ok: true,
    error: null,
    deletedCount: 1,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as MongoDeleteResult;
};

export const mockMongoFindOneResult = <T>(
  overrides: Partial<MongoFindOneResult<T>> = {},
): MongoFindOneResult<T> => {
  const base = {
    kind: "mongo:find-one",
    processed: true,
    ok: true,
    error: null,
    doc: { id: "1", name: "Alice" } as T,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as MongoFindOneResult<T>;
};

export const mockMongoCountResult = (
  overrides: Partial<MongoCountResult> = {},
): MongoCountResult => {
  const base = {
    kind: "mongo:count",
    processed: true,
    ok: true,
    error: null,
    count: 10,
    duration: 100,
  } as const;
  return { ...base, ...overrides } as MongoCountResult;
};
