/**
 * MongoDB Client Failure Examples
 *
 * This file demonstrates failure messages for each MongoDB expectation method.
 * All scenarios are expected to fail - they use dummy results to trigger failures.
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";
import {
  MongoConnectionError,
  type MongoCountResult,
  type MongoDeleteResult,
  type MongoFindOneResult,
  type MongoFindResult,
  type MongoInsertManyResult,
  type MongoInsertOneResult,
  type MongoUpdateResult,
} from "jsr:@probitas/client-mongodb@^0";

// Helper functions - separate functions for ok:true and ok:false states

function createSuccessFindResult<T>(docs: readonly T[]): MongoFindResult<T> {
  return {
    kind: "mongo:find" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    docs,
    duration: 20,
  };
}

function createFailureFindResult<T>(): MongoFindResult<T> {
  return {
    kind: "mongo:find" as const,
    processed: false as const,
    ok: false as const,
    error: new MongoConnectionError("Connection failed"),
    docs: null,
    duration: 0,
  };
}

function createSuccessFindOneResult<T>(doc: T | null): MongoFindOneResult<T> {
  return {
    kind: "mongo:find-one" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    doc,
    duration: 10,
  };
}

function createFailureFindOneResult<T>(): MongoFindOneResult<T> {
  return {
    kind: "mongo:find-one" as const,
    processed: false as const,
    ok: false as const,
    error: new MongoConnectionError("Connection failed"),
    doc: null,
    duration: 0,
  };
}

function createSuccessInsertOneResult(
  insertedId: string,
): MongoInsertOneResult {
  return {
    kind: "mongo:insert-one" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    insertedId,
    duration: 15,
  };
}

function createFailureInsertOneResult(): MongoInsertOneResult {
  return {
    kind: "mongo:insert-one" as const,
    processed: false as const,
    ok: false as const,
    error: new MongoConnectionError("Connection failed"),
    insertedId: null,
    duration: 0,
  };
}

function createSuccessInsertManyResult(
  insertedIds: readonly string[],
  insertedCount: number,
): MongoInsertManyResult {
  return {
    kind: "mongo:insert-many" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    insertedIds,
    insertedCount,
    duration: 25,
  };
}

function createFailureInsertManyResult(): MongoInsertManyResult {
  return {
    kind: "mongo:insert-many" as const,
    processed: false as const,
    ok: false as const,
    error: new MongoConnectionError("Connection failed"),
    insertedIds: null,
    insertedCount: null,
    duration: 0,
  };
}

function createSuccessUpdateResult(
  matchedCount: number,
  modifiedCount: number,
  upsertedId: string | null = null,
): MongoUpdateResult {
  return {
    kind: "mongo:update" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    matchedCount,
    modifiedCount,
    upsertedId,
    duration: 18,
  };
}

function createFailureUpdateResult(): MongoUpdateResult {
  return {
    kind: "mongo:update" as const,
    processed: false as const,
    ok: false as const,
    error: new MongoConnectionError("Connection failed"),
    matchedCount: null,
    modifiedCount: null,
    upsertedId: null,
    duration: 0,
  };
}

function createSuccessDeleteResult(deletedCount: number): MongoDeleteResult {
  return {
    kind: "mongo:delete" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    deletedCount,
    duration: 12,
  };
}

function createFailureDeleteResult(): MongoDeleteResult {
  return {
    kind: "mongo:delete" as const,
    processed: false as const,
    ok: false as const,
    error: new MongoConnectionError("Connection failed"),
    deletedCount: null,
    duration: 0,
  };
}

function createSuccessCountResult(count: number): MongoCountResult {
  return {
    kind: "mongo:count" as const,
    processed: true as const,
    ok: true as const,
    error: null,
    count,
    duration: 8,
  };
}

function createFailureCountResult(): MongoCountResult {
  return {
    kind: "mongo:count" as const,
    processed: false as const,
    ok: false as const,
    error: new MongoConnectionError("Connection failed"),
    count: null,
    duration: 0,
  };
}

interface TestDoc {
  _id: string;
  name: string;
  age: number;
}

const dummyFindResult = createSuccessFindResult<TestDoc>([
  { _id: "1", name: "Alice", age: 30 },
  { _id: "2", name: "Bob", age: 25 },
]);
const dummyFindOneResult = createSuccessFindOneResult<TestDoc>({
  _id: "1",
  name: "Alice",
  age: 30,
});
const dummyInsertOneResult = createSuccessInsertOneResult("abc123");
const dummyInsertManyResult = createSuccessInsertManyResult(
  ["id1", "id2", "id3"],
  3,
);
const dummyUpdateResult = createSuccessUpdateResult(2, 1, undefined);
const dummyDeleteResult = createSuccessDeleteResult(3);
const dummyCountResult = createSuccessCountResult(42);

// Find result failures
export const findToBeOk = scenario("MongoDB Find - toBeOk failure", {
  tags: ["failure", "mongodb"],
})
  .step("toBeOk fails when ok is false", () => {
    expect(createFailureFindResult()).toBeOk();
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
    expect(createFailureFindOneResult()).toBeOk();
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
    expect(createFailureInsertOneResult()).toBeOk();
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
    expect(createFailureInsertManyResult()).toBeOk();
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
    expect(createFailureUpdateResult()).toBeOk();
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
    expect(createFailureDeleteResult()).toBeOk();
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
    expect(createFailureCountResult()).toBeOk();
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
    expect(dummyFindResult).not.toBeOk();
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
