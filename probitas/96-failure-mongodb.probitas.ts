/**
 * MongoDB Client Failure Examples
 *
 * This file demonstrates failure messages for each MongoDB expectation method.
 * All scenarios are expected to fail - they use dummy results to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import type {
  MongoCountResult,
  MongoDeleteResult,
  MongoDocs,
  MongoFindOneResult,
  MongoFindResult,
  MongoInsertManyResult,
  MongoInsertOneResult,
  MongoUpdateResult,
} from "jsr:@probitas/client-mongodb@^0";

// Helper to create MongoDocs
function createMockDocs<T>(docs: T[]): MongoDocs<T> {
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

// Mock helpers
const mockFindResult = <T>(
  overrides: Partial<Omit<MongoFindResult<T>, "docs">> & { docs?: T[] } = {},
): MongoFindResult<T> => {
  const { docs: rawDocs, ...rest } = overrides;
  const defaultDocs: T[] = [
    { _id: "1", name: "Alice", age: 30 },
    { _id: "2", name: "Bob", age: 25 },
  ] as T[];
  return {
    kind: "mongo:find" as const,
    ok: false,
    docs: createMockDocs(rawDocs ?? defaultDocs),
    duration: 20,
    ...rest,
  };
};

const mockFindOneResult = <T>(
  overrides: Partial<MongoFindOneResult<T>> = {},
): MongoFindOneResult<T> => ({
  kind: "mongo:find-one" as const,
  ok: false,
  doc: { _id: "1", name: "Alice", age: 30 } as T,
  duration: 10,
  ...overrides,
});

const mockInsertOneResult = (
  overrides: Partial<MongoInsertOneResult> = {},
): MongoInsertOneResult => ({
  kind: "mongo:insert-one" as const,
  ok: false,
  insertedId: "abc123",
  duration: 15,
  ...overrides,
});

const mockInsertManyResult = (
  overrides: Partial<MongoInsertManyResult> = {},
): MongoInsertManyResult => ({
  kind: "mongo:insert-many" as const,
  ok: false,
  insertedIds: ["id1", "id2", "id3"],
  insertedCount: 3,
  duration: 25,
  ...overrides,
});

const mockUpdateResult = (
  overrides: Partial<MongoUpdateResult> = {},
): MongoUpdateResult => ({
  kind: "mongo:update" as const,
  ok: false,
  matchedCount: 2,
  modifiedCount: 1,
  upsertedId: undefined,
  duration: 18,
  ...overrides,
});

const mockDeleteResult = (
  overrides: Partial<MongoDeleteResult> = {},
): MongoDeleteResult => ({
  kind: "mongo:delete" as const,
  ok: false,
  deletedCount: 3,
  duration: 12,
  ...overrides,
});

const mockCountResult = (
  overrides: Partial<MongoCountResult> = {},
): MongoCountResult => ({
  kind: "mongo:count" as const,
  ok: false,
  count: 42,
  duration: 8,
  ...overrides,
});

const dummyFindResult = mockFindResult();
const dummyFindOneResult = mockFindOneResult();
const dummyInsertOneResult = mockInsertOneResult();
const dummyInsertManyResult = mockInsertManyResult();
const dummyUpdateResult = mockUpdateResult();
const dummyDeleteResult = mockDeleteResult();
const dummyCountResult = mockCountResult();

// Find result failures
export const findToBeOk = scenario("MongoDB Find - toBeOk failure", {
  tags: ["failure", "mongodb"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyFindResult).toBeOk();
  })
  .build();

export const findToHaveDocsEmpty = scenario(
  "MongoDB Find - toHaveDocsEmpty failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveDocsEmpty fails when docs exist", () => {
    expect(dummyFindResult).toHaveDocsEmpty();
  })
  .build();

export const findToHaveDocsCount = scenario(
  "MongoDB Find - toHaveDocsCount failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveDocsCount fails with wrong count", () => {
    expect(dummyFindResult).toHaveDocsCount(10);
  })
  .build();

export const findToHaveDocsCountGreaterThan = scenario(
  "MongoDB Find - toHaveDocsCountGreaterThan failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveDocsCountGreaterThan fails", () => {
    expect(dummyFindResult).toHaveDocsCountGreaterThan(5);
  })
  .build();

// FindOne result failures
export const findOneToBeOk = scenario("MongoDB FindOne - toBeOk failure", {
  tags: ["failure", "mongodb"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyFindOneResult).toBeOk();
  })
  .build();

export const findOneToHaveDocMatching = scenario(
  "MongoDB FindOne - toHaveDocMatching failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveDocMatching fails", () => {
    expect(dummyFindOneResult).toHaveDocMatching({ name: "Charlie" });
  })
  .build();

export const findOneToHaveDocNull = scenario(
  "MongoDB FindOne - toHaveDocNull failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveDocNull fails when doc exists", () => {
    expect(dummyFindOneResult).toHaveDocNull();
  })
  .build();

// InsertOne result failures
export const insertOneToBeOk = scenario("MongoDB InsertOne - toBeOk failure", {
  tags: ["failure", "mongodb"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyInsertOneResult).toBeOk();
  })
  .build();

export const insertOneToHaveInsertedId = scenario(
  "MongoDB InsertOne - toHaveInsertedId failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveInsertedId fails with wrong id", () => {
    expect(dummyInsertOneResult).toHaveInsertedId("wrong-id");
  })
  .build();

export const insertOneToHaveInsertedIdMatching = scenario(
  "MongoDB InsertOne - toHaveInsertedIdMatching failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveInsertedIdMatching fails", () => {
    expect(dummyInsertOneResult).toHaveInsertedIdMatching(/^xyz/);
  })
  .build();

// InsertMany result failures
export const insertManyToBeOk = scenario(
  "MongoDB InsertMany - toBeOk failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toBeOk fails when ok is false", () => {
    expect(dummyInsertManyResult).toBeOk();
  })
  .build();

export const insertManyToHaveInsertedCount = scenario(
  "MongoDB InsertMany - toHaveInsertedCount failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveInsertedCount fails with wrong count", () => {
    expect(dummyInsertManyResult).toHaveInsertedCount(10);
  })
  .build();

export const insertManyToHaveInsertedCountGreaterThan = scenario(
  "MongoDB InsertMany - toHaveInsertedCountGreaterThan failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveInsertedCountGreaterThan fails", () => {
    expect(dummyInsertManyResult).toHaveInsertedCountGreaterThan(5);
  })
  .build();

// Update result failures
export const updateToBeOk = scenario("MongoDB Update - toBeOk failure", {
  tags: ["failure", "mongodb"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyUpdateResult).toBeOk();
  })
  .build();

export const updateToHaveMatchedCount = scenario(
  "MongoDB Update - toHaveMatchedCount failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveMatchedCount fails with wrong count", () => {
    expect(dummyUpdateResult).toHaveMatchedCount(10);
  })
  .build();

export const updateToHaveModifiedCount = scenario(
  "MongoDB Update - toHaveModifiedCount failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveModifiedCount fails with wrong count", () => {
    expect(dummyUpdateResult).toHaveModifiedCount(5);
  })
  .build();

export const updateToHaveUpsertedIdPresent = scenario(
  "MongoDB Update - toHaveUpsertedIdPresent failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveUpsertedIdPresent fails when undefined", () => {
    expect(dummyUpdateResult).toHaveUpsertedIdPresent();
  })
  .build();

// Delete result failures
export const deleteToBeOk = scenario("MongoDB Delete - toBeOk failure", {
  tags: ["failure", "mongodb"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyDeleteResult).toBeOk();
  })
  .build();

export const deleteToHaveDeletedCount = scenario(
  "MongoDB Delete - toHaveDeletedCount failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveDeletedCount fails with wrong count", () => {
    expect(dummyDeleteResult).toHaveDeletedCount(10);
  })
  .build();

export const deleteToHaveDeletedCountGreaterThan = scenario(
  "MongoDB Delete - toHaveDeletedCountGreaterThan failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveDeletedCountGreaterThan fails", () => {
    expect(dummyDeleteResult).toHaveDeletedCountGreaterThan(5);
  })
  .build();

// Count result failures
export const countToBeOk = scenario("MongoDB Count - toBeOk failure", {
  tags: ["failure", "mongodb"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(dummyCountResult).toBeOk();
  })
  .build();

export const countToHaveCount = scenario(
  "MongoDB Count - toHaveCount failure",
  {
    tags: ["failure", "mongodb"],
  },
)
  .step("toHaveCount fails with wrong count", () => {
    expect(dummyCountResult).toHaveCount(100);
  })
  .build();

export const countToHaveCountGreaterThan = scenario(
  "MongoDB Count - toHaveCountGreaterThan failure",
  { tags: ["failure", "mongodb"] },
)
  .step("toHaveCountGreaterThan fails", () => {
    expect(dummyCountResult).toHaveCountGreaterThan(50);
  })
  .build();

// Duration failures
export const toHaveDuration = scenario("MongoDB - toHaveDuration failure", {
  tags: ["failure", "mongodb"],
})
  .step("toHaveDuration fails with wrong duration", () => {
    expect(dummyFindResult).toHaveDuration(100);
  })
  .build();

// Negation failures
export const notToBeOk = scenario("MongoDB - not.toBeOk failure", {
  tags: ["failure", "mongodb"],
})
  .step("not.toBeOk fails when ok is true", () => {
    const okResult = mockFindResult({ ok: true });
    expect(okResult).not.toBeOk();
  })
  .build();

export default [
  findToBeOk,
  findToHaveDocsEmpty,
  findToHaveDocsCount,
  findToHaveDocsCountGreaterThan,
  findOneToBeOk,
  findOneToHaveDocMatching,
  findOneToHaveDocNull,
  insertOneToBeOk,
  insertOneToHaveInsertedId,
  insertOneToHaveInsertedIdMatching,
  insertManyToBeOk,
  insertManyToHaveInsertedCount,
  insertManyToHaveInsertedCountGreaterThan,
  updateToBeOk,
  updateToHaveMatchedCount,
  updateToHaveModifiedCount,
  updateToHaveUpsertedIdPresent,
  deleteToBeOk,
  deleteToHaveDeletedCount,
  deleteToHaveDeletedCountGreaterThan,
  countToBeOk,
  countToHaveCount,
  countToHaveCountGreaterThan,
  toHaveDuration,
  notToBeOk,
];
