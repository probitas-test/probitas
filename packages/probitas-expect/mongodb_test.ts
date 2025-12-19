import { assertExists, assertThrows } from "@std/assert";
import { expectMongoResult } from "./mongodb.ts";
import {
  mockMongoCountResult,
  mockMongoDeleteResult,
  mockMongoFindOneResult,
  mockMongoFindResult,
  mockMongoInsertManyResult,
  mockMongoInsertOneResult,
  mockMongoUpdateResult,
} from "./mongodb/_testutils.ts";

// Test that expectMongoResult correctly dispatches to the right expectation type

Deno.test("expectMongoResult - dispatches mongo:find to MongoFindResultExpectation", () => {
  const result = mockMongoFindResult();
  const expectation = expectMongoResult(result);

  // Verify it returns the correct expectation type by checking for type-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveDocs);
  assertExists(expectation.toHaveDocsCount);
  assertExists(expectation.toHaveDocsContaining);

  // Verify chaining works
  expectation.toBeOk().toHaveDocsCount(1);
});

Deno.test("expectMongoResult - dispatches mongo:find-one to MongoFindOneResultExpectation", () => {
  const result = mockMongoFindOneResult();
  const expectation = expectMongoResult(result);

  // Verify it returns the correct expectation type by checking for type-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveDoc);
  assertExists(expectation.toHaveDocPresent);
  assertExists(expectation.toHaveDocMatching);

  // Verify chaining works
  expectation.toBeOk().toHaveDocPresent();
});

Deno.test("expectMongoResult - dispatches mongo:insert with insertedId to MongoInsertOneResultExpectation", () => {
  const result = mockMongoInsertOneResult();
  const expectation = expectMongoResult(result);

  // Verify it returns the correct expectation type by checking for type-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveInsertedId);
  assertExists(expectation.toHaveInsertedIdContaining);
  assertExists(expectation.toHaveInsertedIdMatching);

  // Verify chaining works
  expectation.toBeOk().toHaveInsertedId("123");
});

Deno.test("expectMongoResult - dispatches mongo:insert with insertedIds to MongoInsertManyResultExpectation", () => {
  const result = mockMongoInsertManyResult();
  const expectation = expectMongoResult(result);

  // Verify it returns the correct expectation type by checking for type-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveInsertedIds);
  assertExists(expectation.toHaveInsertedCount);
  assertExists(expectation.toHaveInsertedIdsContaining);

  // Verify chaining works
  expectation.toBeOk().toHaveInsertedCount(3);
});

Deno.test("expectMongoResult - dispatches mongo:update to MongoUpdateResultExpectation", () => {
  const result = mockMongoUpdateResult();
  const expectation = expectMongoResult(result);

  // Verify it returns the correct expectation type by checking for type-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveMatchedCount);
  assertExists(expectation.toHaveModifiedCount);
  assertExists(expectation.toHaveUpsertedId);

  // Verify chaining works
  expectation.toBeOk().toHaveMatchedCount(1).toHaveModifiedCount(1);
});

Deno.test("expectMongoResult - dispatches mongo:delete to MongoDeleteResultExpectation", () => {
  const result = mockMongoDeleteResult();
  const expectation = expectMongoResult(result);

  // Verify it returns the correct expectation type by checking for type-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveDeletedCount);
  assertExists(expectation.toHaveDeletedCountGreaterThan);

  // Verify chaining works
  expectation.toBeOk().toHaveDeletedCount(1);
});

Deno.test("expectMongoResult - dispatches mongo:count to MongoCountResultExpectation", () => {
  const result = mockMongoCountResult();
  const expectation = expectMongoResult(result);

  // Verify it returns the correct expectation type by checking for type-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveCount);
  assertExists(expectation.toHaveCountGreaterThan);

  // Verify chaining works
  expectation.toBeOk().toHaveCount(10);
});

Deno.test("expectMongoResult - throws on unknown result type", () => {
  const unknownResult = {
    kind: "mongo:unknown",
    ok: true,
    duration: 100,
  };

  assertThrows(
    // deno-lint-ignore no-explicit-any
    () => expectMongoResult(unknownResult as any),
    Error,
    "Unknown MongoDB result kind: mongo:unknown",
  );
});

Deno.test("expectMongoResult - insert type discrimination works correctly", () => {
  // Test insertOne (has insertedId)
  const insertOneResult = mockMongoInsertOneResult();
  const insertOneExpectation = expectMongoResult(insertOneResult);

  // insertOne should have toHaveInsertedId (singular)
  assertExists(
    insertOneExpectation.toHaveInsertedId,
    "insertOne should have toHaveInsertedId",
  );

  // Test insertMany (has insertedIds)
  const insertManyResult = mockMongoInsertManyResult();
  const insertManyExpectation = expectMongoResult(insertManyResult);

  // insertMany should have toHaveInsertedIds (plural)
  assertExists(
    insertManyExpectation.toHaveInsertedIds,
    "insertMany should have toHaveInsertedIds",
  );
});

Deno.test("expectMongoResult - all result types have common methods", () => {
  const results = [
    mockMongoFindResult(),
    mockMongoFindOneResult(),
    mockMongoInsertOneResult(),
    mockMongoInsertManyResult(),
    mockMongoUpdateResult(),
    mockMongoDeleteResult(),
    mockMongoCountResult(),
  ];

  for (const result of results) {
    const expectation = expectMongoResult(result);

    // All expectations should have these common methods
    assertExists(expectation.toBeOk, `${result.kind} should have toBeOk`);
    assertExists(
      expectation.toHaveDuration,
      `${result.kind} should have toHaveDuration`,
    );
    assertExists(expectation.not, `${result.kind} should have not property`);
  }
});
