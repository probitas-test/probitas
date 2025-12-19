import { assertExists, assertThrows } from "@std/assert";
import { expectDenoKvResult } from "./deno_kv.ts";
import {
  mockDenoKvAtomicResult,
  mockDenoKvDeleteResult,
  mockDenoKvGetResult,
  mockDenoKvListResult,
  mockDenoKvSetResult,
} from "./deno_kv/_testutils.ts";

Deno.test("expectDenoKvResult - dispatches to get result expectation", () => {
  const result = mockDenoKvGetResult();
  const expectation = expectDenoKvResult(result);

  // Verify it returns the correct expectation type by checking for get-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveKey);
  assertExists(expectation.toHaveValue);
  assertExists(expectation.toHaveVersionstamp);
  assertExists(expectation.toHaveDuration);

  // Verify methods work correctly (avoiding array/object equality issues)
  expectation.toBeOk().toHaveKeyContaining("users").toHaveValueProperty("name");
});

Deno.test("expectDenoKvResult - dispatches to list result expectation", () => {
  const result = mockDenoKvListResult();
  const expectation = expectDenoKvResult(result);

  // Verify it returns the correct expectation type by checking for list-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveEntries);
  assertExists(expectation.toHaveEntryCount);
  assertExists(expectation.toHaveDuration);

  // Verify methods work correctly
  expectation.toBeOk().toHaveEntryCount(1);
});

Deno.test("expectDenoKvResult - dispatches to set result expectation", () => {
  const result = mockDenoKvSetResult();
  const expectation = expectDenoKvResult(result);

  // Verify it returns the correct expectation type by checking for set-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveVersionstamp);
  assertExists(expectation.toHaveDuration);

  // Verify methods work correctly
  expectation.toBeOk().toHaveVersionstamp("v1");
});

Deno.test("expectDenoKvResult - dispatches to delete result expectation", () => {
  const result = mockDenoKvDeleteResult();
  const expectation = expectDenoKvResult(result);

  // Verify it returns the correct expectation type by checking for delete-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveDuration);

  // Verify methods work correctly
  expectation.toBeOk().toHaveDuration(100);
});

Deno.test("expectDenoKvResult - dispatches to atomic result expectation", () => {
  const result = mockDenoKvAtomicResult();
  const expectation = expectDenoKvResult(result);

  // Verify it returns the correct expectation type by checking for atomic-specific methods
  assertExists(expectation.toBeOk);
  assertExists(expectation.toHaveVersionstamp);
  assertExists(expectation.toHaveDuration);

  // Verify methods work correctly
  expectation.toBeOk().toHaveVersionstamp("v1");
});

Deno.test("expectDenoKvResult - throws on unknown result type", () => {
  const unknownResult = { kind: "deno-kv:unknown", ok: true };

  assertThrows(
    // deno-lint-ignore no-explicit-any
    () => expectDenoKvResult(unknownResult as any),
    Error,
    "Unknown Deno KV result kind: deno-kv:unknown",
  );
});

Deno.test("expectDenoKvResult - get result chaining with not", () => {
  const result = mockDenoKvGetResult({ ok: false, value: null });
  const expectation = expectDenoKvResult(result);

  expectation.not.toBeOk();
  expectation.toHaveValueNull();
});

Deno.test("expectDenoKvResult - list result with empty entries", () => {
  const result = mockDenoKvListResult({ entries: [] });
  const expectation = expectDenoKvResult(result);

  expectation.toBeOk().toHaveEntriesEmpty().toHaveEntryCount(0);
});

Deno.test("expectDenoKvResult - type inference works correctly", () => {
  // Test that TypeScript correctly infers the return type based on input

  // Get result
  const getResult = mockDenoKvGetResult();
  const getExpectation = expectDenoKvResult(getResult);
  // This should compile without errors - toHaveKeyContaining is only on get expectation
  getExpectation.toHaveKeyContaining("users");

  // List result
  const listResult = mockDenoKvListResult();
  const listExpectation = expectDenoKvResult(listResult);
  // This should compile without errors - toHaveEntryCount is only on list expectation
  listExpectation.toHaveEntryCount(1);

  // Set result
  const setResult = mockDenoKvSetResult();
  const setExpectation = expectDenoKvResult(setResult);
  // This should compile without errors - toHaveVersionstamp is on set expectation
  setExpectation.toHaveVersionstamp("v1");

  // Delete result
  const deleteResult = mockDenoKvDeleteResult();
  const deleteExpectation = expectDenoKvResult(deleteResult);
  // This should compile without errors - only has toBeOk and duration methods
  deleteExpectation.toBeOk().toHaveDuration(100);

  // Atomic result
  const atomicResult = mockDenoKvAtomicResult();
  const atomicExpectation = expectDenoKvResult(atomicResult);
  // This should compile without errors - toHaveVersionstamp is on atomic expectation
  atomicExpectation.toHaveVersionstamp("v1");
});

Deno.test("expectDenoKvResult - all result types support common methods", () => {
  // Verify that all result types support the common toBeOk and duration methods

  const results = [
    mockDenoKvGetResult(),
    mockDenoKvListResult(),
    mockDenoKvSetResult(),
    mockDenoKvDeleteResult(),
    mockDenoKvAtomicResult(),
  ];

  for (const result of results) {
    const expectation = expectDenoKvResult(result);

    // All should have toBeOk
    assertExists(expectation.toBeOk, `${result.kind} should have toBeOk`);

    // All should have duration methods
    assertExists(
      expectation.toHaveDuration,
      `${result.kind} should have toHaveDuration`,
    );

    // All should support chaining
    const chained = expectation.toBeOk();
    assertExists(chained.toHaveDuration);
  }
});
