import { assertThrows } from "@std/assert";
import { expectMongoResult } from "./mongodb.ts";
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
function createMockMongoDocs<T>(docs: T[]): MongoDocs<T> {
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
const mockMongoFindResult = <T>(
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

const mockMongoInsertOneResult = (
  overrides: Partial<MongoInsertOneResult> = {},
): MongoInsertOneResult => ({
  type: "mongo:insert" as const,
  ok: true,
  insertedId: "123",
  duration: 100,
  ...overrides,
});

const mockMongoUpdateResult = (
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

const mockMongoDeleteResult = (
  overrides: Partial<MongoDeleteResult> = {},
): MongoDeleteResult => ({
  type: "mongo:delete" as const,
  ok: true,
  deletedCount: 1,
  duration: 100,
  ...overrides,
});

const mockMongoFindOneResult = <T>(
  overrides: Partial<MongoFindOneResult<T>> = {},
): MongoFindOneResult<T> => ({
  type: "mongo:find-one" as const,
  ok: true,
  doc: { id: "1", name: "Alice" } as T,
  duration: 100,
  ...overrides,
});

const mockMongoCountResult = (
  overrides: Partial<MongoCountResult> = {},
): MongoCountResult => ({
  type: "mongo:count" as const,
  ok: true,
  count: 10,
  duration: 100,
  ...overrides,
});

Deno.test("expectMongoResult - MongoFindResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectMongoResult(mockMongoFindResult({ ok: true })).toBeSuccessful();
    assertThrows(
      () =>
        expectMongoResult(mockMongoFindResult({ ok: false })).toBeSuccessful(),
      Error,
    );
  });

  await t.step("toHaveContent", () => {
    expectMongoResult(mockMongoFindResult()).toHaveContent();
    expectMongoResult(mockMongoFindResult({ docs: [] })).not.toHaveContent();
  });

  await t.step("toHaveLength", () => {
    expectMongoResult(mockMongoFindResult({ docs: [{ id: "1" }, { id: "2" }] }))
      .toHaveLength(2);
  });

  await t.step("toHaveLengthGreaterThanOrEqual", () => {
    expectMongoResult(mockMongoFindResult({ docs: [{ id: "1" }, { id: "2" }] }))
      .toHaveLengthGreaterThanOrEqual(1);
  });

  await t.step("toHaveLengthLessThanOrEqual", () => {
    expectMongoResult(mockMongoFindResult({ docs: [{ id: "1" }] }))
      .toHaveLengthLessThanOrEqual(5);
  });

  await t.step("toMatchObject", () => {
    expectMongoResult(mockMongoFindResult()).toMatchObject({ name: "Alice" });
  });

  await t.step("toSatisfy", () => {
    expectMongoResult(mockMongoFindResult()).toSatisfy((docs) => {
      if (docs.length !== 1) throw new Error("Expected 1 doc");
    });
  });

  await t.step("duration methods", () => {
    expectMongoResult(mockMongoFindResult({ duration: 50 }))
      .toHaveDurationLessThan(100);
  });
});

Deno.test("expectMongoResult - MongoInsertOneResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectMongoResult(mockMongoInsertOneResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveInsertedCount", () => {
    expectMongoResult(mockMongoInsertOneResult()).toHaveInsertedCount(1);
  });

  await t.step("toHaveInsertedCountGreaterThan", () => {
    expectMongoResult(mockMongoInsertOneResult())
      .toHaveInsertedCountGreaterThan(0);
  });

  await t.step("toHaveInsertedCountGreaterThanOrEqual", () => {
    expectMongoResult(mockMongoInsertOneResult())
      .toHaveInsertedCountGreaterThanOrEqual(1);
  });

  await t.step("toHaveInsertedCountLessThan", () => {
    expectMongoResult(mockMongoInsertOneResult()).toHaveInsertedCountLessThan(
      2,
    );
  });

  await t.step("toHaveInsertedCountLessThanOrEqual", () => {
    expectMongoResult(mockMongoInsertOneResult())
      .toHaveInsertedCountLessThanOrEqual(1);
  });

  await t.step("toHaveInsertedId", () => {
    expectMongoResult(mockMongoInsertOneResult({ insertedId: "123" }))
      .toHaveInsertedId();
  });
});

Deno.test("expectMongoResult - MongoUpdateResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectMongoResult(mockMongoUpdateResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveMatchedCount", () => {
    expectMongoResult(mockMongoUpdateResult({ matchedCount: 2 }))
      .toHaveMatchedCount(2);
  });

  await t.step("toHaveMatchedCountGreaterThan", () => {
    expectMongoResult(mockMongoUpdateResult({ matchedCount: 5 }))
      .toHaveMatchedCountGreaterThan(2);
  });

  await t.step("toHaveMatchedCountGreaterThanOrEqual", () => {
    expectMongoResult(mockMongoUpdateResult({ matchedCount: 5 }))
      .toHaveMatchedCountGreaterThanOrEqual(5);
  });

  await t.step("toHaveMatchedCountLessThan", () => {
    expectMongoResult(mockMongoUpdateResult({ matchedCount: 2 }))
      .toHaveMatchedCountLessThan(5);
  });

  await t.step("toHaveMatchedCountLessThanOrEqual", () => {
    expectMongoResult(mockMongoUpdateResult({ matchedCount: 5 }))
      .toHaveMatchedCountLessThanOrEqual(5);
  });

  await t.step("toHaveModifiedCount", () => {
    expectMongoResult(mockMongoUpdateResult({ modifiedCount: 3 }))
      .toHaveModifiedCount(3);
  });

  await t.step("toHaveModifiedCountGreaterThan", () => {
    expectMongoResult(mockMongoUpdateResult({ modifiedCount: 5 }))
      .toHaveModifiedCountGreaterThan(2);
  });

  await t.step("toHaveModifiedCountGreaterThanOrEqual", () => {
    expectMongoResult(mockMongoUpdateResult({ modifiedCount: 5 }))
      .toHaveModifiedCountGreaterThanOrEqual(5);
  });

  await t.step("toHaveModifiedCountLessThan", () => {
    expectMongoResult(mockMongoUpdateResult({ modifiedCount: 2 }))
      .toHaveModifiedCountLessThan(5);
  });

  await t.step("toHaveModifiedCountLessThanOrEqual", () => {
    expectMongoResult(mockMongoUpdateResult({ modifiedCount: 5 }))
      .toHaveModifiedCountLessThanOrEqual(5);
  });

  await t.step("toHaveUpsertedId", () => {
    expectMongoResult(mockMongoUpdateResult({ upsertedId: "456" }))
      .toHaveUpsertedId();
  });
});

Deno.test("expectMongoResult - MongoDeleteResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectMongoResult(mockMongoDeleteResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveDeletedCount", () => {
    expectMongoResult(mockMongoDeleteResult({ deletedCount: 2 }))
      .toHaveDeletedCount(2);
  });

  await t.step("toHaveDeletedCountGreaterThan", () => {
    expectMongoResult(mockMongoDeleteResult({ deletedCount: 5 }))
      .toHaveDeletedCountGreaterThan(2);
  });

  await t.step("toHaveDeletedCountGreaterThanOrEqual", () => {
    expectMongoResult(mockMongoDeleteResult({ deletedCount: 5 }))
      .toHaveDeletedCountGreaterThanOrEqual(5);
  });

  await t.step("toHaveDeletedCountLessThan", () => {
    expectMongoResult(mockMongoDeleteResult({ deletedCount: 2 }))
      .toHaveDeletedCountLessThan(5);
  });

  await t.step("toHaveDeletedCountLessThanOrEqual", () => {
    expectMongoResult(mockMongoDeleteResult({ deletedCount: 5 }))
      .toHaveDeletedCountLessThanOrEqual(5);
  });
});

Deno.test("expectMongoResult - MongoFindOneResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectMongoResult(mockMongoFindOneResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveContent", () => {
    expectMongoResult(mockMongoFindOneResult()).toHaveContent();
    expectMongoResult(mockMongoFindOneResult({ doc: undefined })).not
      .toHaveContent();
  });

  await t.step("toMatchObject", () => {
    expectMongoResult(mockMongoFindOneResult()).toMatchObject({
      name: "Alice",
    });
  });

  await t.step("toSatisfy", () => {
    expectMongoResult(mockMongoFindOneResult<{ id: string; name: string }>())
      .toSatisfy(
        (doc) => {
          if (doc.name !== "Alice") throw new Error("Expected Alice");
        },
      );
  });
});

Deno.test("expectMongoResult - MongoCountResult", async (t) => {
  await t.step("toBeSuccessful", () => {
    expectMongoResult(mockMongoCountResult({ ok: true })).toBeSuccessful();
  });

  await t.step("toHaveLength", () => {
    expectMongoResult(mockMongoCountResult({ count: 10 })).toHaveLength(10);
  });

  await t.step("toHaveLengthGreaterThanOrEqual", () => {
    expectMongoResult(mockMongoCountResult({ count: 10 }))
      .toHaveLengthGreaterThanOrEqual(5);
  });

  await t.step("toHaveLengthLessThanOrEqual", () => {
    expectMongoResult(mockMongoCountResult({ count: 10 }))
      .toHaveLengthLessThanOrEqual(20);
  });
});
