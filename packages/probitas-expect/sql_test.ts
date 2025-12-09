import { assertThrows } from "@std/assert";
import { expectSqlQueryResult } from "./sql.ts";
import type { SqlQueryResult, SqlRows } from "@probitas/client-sql";

// Helper to create SqlRows (array with helper methods)
function createSqlRows<T>(items: T[]): SqlRows<T> {
  const arr = [...items] as T[] & {
    first(): T | undefined;
    firstOrThrow(): T;
    last(): T | undefined;
    lastOrThrow(): T;
  };
  arr.first = function () {
    return this[0];
  };
  arr.firstOrThrow = function () {
    if (this.length === 0) throw new Error("No rows found");
    return this[0];
  };
  arr.last = function () {
    return this[this.length - 1];
  };
  arr.lastOrThrow = function () {
    if (this.length === 0) throw new Error("No rows found");
    return this[this.length - 1];
  };
  return arr as unknown as SqlRows<T>;
}

// Mock helper
const mockSqlQueryResult = <T>(
  overrides: Partial<Omit<SqlQueryResult<T>, "rows">> & { rows?: T[] } = {},
): SqlQueryResult<T> => {
  const { rows: rawRows, ...rest } = overrides;
  const defaultRows: T[] = [];
  return {
    type: "sql" as const,
    ok: true,
    rows: createSqlRows(rawRows ?? defaultRows),
    rowCount: 0,
    metadata: {},
    duration: 100,
    map: function <U>(fn: (row: T) => U): U[] {
      return this.rows.map(fn);
    },
    as: function <U>(ctor: new (row: T) => U): U[] {
      return this.rows.map((row) => new ctor(row));
    },
    ...rest,
  };
};

Deno.test("expectSqlQueryResult", async (t) => {
  await t.step("toBeSuccessful", async (t) => {
    await t.step("passes when ok is true", () => {
      const result = mockSqlQueryResult({ ok: true });
      expectSqlQueryResult(result).toBeSuccessful();
    });

    await t.step("fails when ok is false", () => {
      const result = mockSqlQueryResult({ ok: false });
      assertThrows(
        () => expectSqlQueryResult(result).toBeSuccessful(),
        Error,
        "Expected query to succeed",
      );
    });

    await t.step("negated - fails when ok is true", () => {
      const result = mockSqlQueryResult({ ok: true });
      assertThrows(
        () => expectSqlQueryResult(result).not.toBeSuccessful(),
        Error,
        "Expected query to fail",
      );
    });
  });

  await t.step("toHaveContent", async (t) => {
    await t.step("passes when rows exist", () => {
      const result = mockSqlQueryResult({ rows: [{ id: 1 }] });
      expectSqlQueryResult(result).toHaveContent();
    });

    await t.step("fails when rows are empty", () => {
      const result = mockSqlQueryResult({ rows: [] });
      assertThrows(
        () => expectSqlQueryResult(result).toHaveContent(),
        Error,
        "Expected rows to be present",
      );
    });

    await t.step("negated - passes when rows are empty", () => {
      const result = mockSqlQueryResult({ rows: [] });
      expectSqlQueryResult(result).not.toHaveContent();
    });
  });

  await t.step("toHaveLength", async (t) => {
    await t.step("passes for matching count", () => {
      const result = mockSqlQueryResult({ rows: [{ id: 1 }, { id: 2 }] });
      expectSqlQueryResult(result).toHaveLength(2);
    });

    await t.step("fails for non-matching count", () => {
      const result = mockSqlQueryResult({ rows: [{ id: 1 }] });
      assertThrows(
        () => expectSqlQueryResult(result).toHaveLength(2),
        Error,
        "Expected 2 rows, got 1",
      );
    });
  });

  await t.step("toHaveLengthGreaterThanOrEqual", async (t) => {
    await t.step("passes when count is greater", () => {
      const result = mockSqlQueryResult({ rows: [{ id: 1 }, { id: 2 }] });
      expectSqlQueryResult(result).toHaveLengthGreaterThanOrEqual(1);
    });

    await t.step("passes when count is equal", () => {
      const result = mockSqlQueryResult({ rows: [{ id: 1 }] });
      expectSqlQueryResult(result).toHaveLengthGreaterThanOrEqual(1);
    });

    await t.step("fails when count is less", () => {
      const result = mockSqlQueryResult({ rows: [] });
      assertThrows(
        () => expectSqlQueryResult(result).toHaveLengthGreaterThanOrEqual(1),
        Error,
        "Expected at least 1 rows, got 0",
      );
    });
  });

  await t.step("toHaveLengthLessThanOrEqual", async (t) => {
    await t.step("passes when count is less", () => {
      const result = mockSqlQueryResult({ rows: [] });
      expectSqlQueryResult(result).toHaveLengthLessThanOrEqual(1);
    });

    await t.step("passes when count is equal", () => {
      const result = mockSqlQueryResult({ rows: [{ id: 1 }] });
      expectSqlQueryResult(result).toHaveLengthLessThanOrEqual(1);
    });

    await t.step("fails when count is greater", () => {
      const result = mockSqlQueryResult({ rows: [{ id: 1 }, { id: 2 }] });
      assertThrows(
        () => expectSqlQueryResult(result).toHaveLengthLessThanOrEqual(1),
        Error,
        "Expected at most 1 rows, got 2",
      );
    });
  });

  await t.step("toHaveRowCount", async (t) => {
    await t.step("passes for matching count", () => {
      const result = mockSqlQueryResult({ rowCount: 2 });
      expectSqlQueryResult(result).toHaveRowCount(2);
    });

    await t.step("fails for non-matching count", () => {
      const result = mockSqlQueryResult({ rowCount: 1 });
      assertThrows(
        () => expectSqlQueryResult(result).toHaveRowCount(2),
        Error,
        "Expected 2 rowCount, got 1",
      );
    });
  });

  await t.step("toHaveRowCountGreaterThanOrEqual", async (t) => {
    await t.step("passes when count is greater", () => {
      const result = mockSqlQueryResult({ rowCount: 2 });
      expectSqlQueryResult(result).toHaveRowCountGreaterThanOrEqual(1);
    });

    await t.step("passes when count is equal", () => {
      const result = mockSqlQueryResult({ rowCount: 1 });
      expectSqlQueryResult(result).toHaveRowCountGreaterThanOrEqual(1);
    });

    await t.step("fails when count is less", () => {
      const result = mockSqlQueryResult({ rowCount: 0 });
      assertThrows(
        () => expectSqlQueryResult(result).toHaveRowCountGreaterThanOrEqual(1),
        Error,
        "Expected at least 1 rowCount, got 0",
      );
    });
  });

  await t.step("toHaveRowCountLessThanOrEqual", async (t) => {
    await t.step("passes when count is less", () => {
      const result = mockSqlQueryResult({ rowCount: 0 });
      expectSqlQueryResult(result).toHaveRowCountLessThanOrEqual(1);
    });

    await t.step("passes when count is equal", () => {
      const result = mockSqlQueryResult({ rowCount: 1 });
      expectSqlQueryResult(result).toHaveRowCountLessThanOrEqual(1);
    });

    await t.step("fails when count is greater", () => {
      const result = mockSqlQueryResult({ rowCount: 2 });
      assertThrows(
        () => expectSqlQueryResult(result).toHaveRowCountLessThanOrEqual(1),
        Error,
        "Expected at most 1 rowCount, got 2",
      );
    });
  });

  await t.step("toMatchObject", async (t) => {
    await t.step("passes when row contains subset", () => {
      const result = mockSqlQueryResult({
        rows: [{ id: 1, name: "Alice", age: 30 }],
      });
      expectSqlQueryResult(result).toMatchObject({ name: "Alice" });
    });

    await t.step("fails when no row contains subset", () => {
      const result = mockSqlQueryResult({
        rows: [{ id: 1, name: "Bob" }],
      });
      assertThrows(
        () => expectSqlQueryResult(result).toMatchObject({ name: "Alice" }),
        Error,
        "No row contains the expected subset",
      );
    });
  });

  await t.step("toSatisfy", async (t) => {
    await t.step("passes when matcher succeeds", () => {
      const result = mockSqlQueryResult({
        rows: [{ id: 1 }, { id: 2 }],
      });
      expectSqlQueryResult(result).toSatisfy((rows) => {
        if (rows.length !== 2) throw new Error("Expected 2 rows");
      });
    });

    await t.step("fails when matcher throws", () => {
      const result = mockSqlQueryResult({
        rows: [{ id: 1 }],
      });
      assertThrows(
        () =>
          expectSqlQueryResult(result).toSatisfy((rows) => {
            if (rows.length !== 2) throw new Error("Expected 2 rows");
          }),
        Error,
        "Expected 2 rows",
      );
    });
  });

  await t.step("toHaveMapContaining", async (t) => {
    await t.step("passes when mapped row contains subset", () => {
      const result = mockSqlQueryResult({
        rows: [
          { id: 1, name: "Alice", age: 30 },
          { id: 2, name: "Bob", age: 25 },
        ],
      });
      expectSqlQueryResult(result).toHaveMapContaining(
        (row: { id: number; name: string; age: number }) => ({
          upper: row.name.toUpperCase(),
        }),
        { upper: "ALICE" },
      );
    });

    await t.step("fails when no mapped row contains subset", () => {
      const result = mockSqlQueryResult({
        rows: [{ id: 1, name: "Bob", age: 25 }],
      });
      assertThrows(
        () =>
          expectSqlQueryResult(result).toHaveMapContaining(
            (row: { id: number; name: string; age: number }) => ({
              upper: row.name.toUpperCase(),
            }),
            { upper: "ALICE" },
          ),
        Error,
        "No mapped row contains the expected subset",
      );
    });
  });

  await t.step("toHaveMapMatching", async (t) => {
    await t.step("passes when matcher succeeds", () => {
      const result = mockSqlQueryResult({
        rows: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
      });
      expectSqlQueryResult(result).toHaveMapMatching(
        (row: { id: number; name: string }) => row.name.toUpperCase(),
        (names) => {
          if (names.length !== 2) throw new Error("Expected 2 names");
        },
      );
    });

    await t.step("fails when matcher throws", () => {
      const result = mockSqlQueryResult({
        rows: [{ id: 1, name: "Alice" }],
      });
      assertThrows(
        () =>
          expectSqlQueryResult(result).toHaveMapMatching(
            (row: { id: number; name: string }) => row.name,
            (names) => {
              if (names.length !== 2) throw new Error("Expected 2 names");
            },
          ),
        Error,
        "Expected 2 names",
      );
    });
  });

  await t.step("toHaveInstanceContaining", async (t) => {
    class User {
      id: number;
      name: string;
      constructor(row: { id: number; name: string }) {
        this.id = row.id;
        this.name = row.name;
      }
    }

    await t.step("passes when instance contains subset", () => {
      const result = mockSqlQueryResult({
        rows: [{ id: 1, name: "Alice" }],
      });
      expectSqlQueryResult(result).toHaveInstanceContaining(User, {
        name: "Alice",
      });
    });

    await t.step("fails when no instance contains subset", () => {
      const result = mockSqlQueryResult({
        rows: [{ id: 1, name: "Bob" }],
      });
      assertThrows(
        () =>
          expectSqlQueryResult(result).toHaveInstanceContaining(User, {
            name: "Alice",
          }),
        Error,
        "No instance contains the expected subset",
      );
    });
  });

  await t.step("toHaveInstanceMatching", async (t) => {
    class User {
      id: number;
      name: string;
      constructor(row: { id: number; name: string }) {
        this.id = row.id;
        this.name = row.name;
      }
    }

    await t.step("passes when matcher succeeds", () => {
      const result = mockSqlQueryResult({
        rows: [{ id: 1, name: "Alice" }],
      });
      expectSqlQueryResult(result).toHaveInstanceMatching(User, (instances) => {
        if (instances.length !== 1) throw new Error("Expected 1 instance");
      });
    });

    await t.step("fails when matcher throws", () => {
      const result = mockSqlQueryResult({
        rows: [{ id: 1, name: "Alice" }],
      });
      assertThrows(
        () =>
          expectSqlQueryResult(result).toHaveInstanceMatching(
            User,
            (instances) => {
              if (instances.length !== 2) {
                throw new Error("Expected 2 instances");
              }
            },
          ),
        Error,
        "Expected 2 instances",
      );
    });
  });

  await t.step("toHaveLastInsertId", async (t) => {
    await t.step("passes when lastInsertId exists (no arg)", () => {
      const result = mockSqlQueryResult({
        metadata: { lastInsertId: BigInt(123) },
      });
      expectSqlQueryResult(result).toHaveLastInsertId();
    });

    await t.step("passes when lastInsertId matches", () => {
      const result = mockSqlQueryResult({
        metadata: { lastInsertId: BigInt(123) },
      });
      expectSqlQueryResult(result).toHaveLastInsertId(BigInt(123));
    });

    await t.step("fails when lastInsertId does not exist", () => {
      const result = mockSqlQueryResult({ metadata: {} });
      assertThrows(
        () => expectSqlQueryResult(result).toHaveLastInsertId(),
        Error,
        "Expected lastInsertId to be present",
      );
    });

    await t.step("fails when lastInsertId does not match", () => {
      const result = mockSqlQueryResult({
        metadata: { lastInsertId: BigInt(456) },
      });
      assertThrows(
        () => expectSqlQueryResult(result).toHaveLastInsertId(BigInt(123)),
        Error,
        "Expected lastInsertId 123, got 456",
      );
    });
  });

  await t.step("toHaveDurationLessThan", async (t) => {
    await t.step("passes when duration is less", () => {
      const result = mockSqlQueryResult({ duration: 50 });
      expectSqlQueryResult(result).toHaveDurationLessThan(100);
    });

    await t.step("fails when duration is equal", () => {
      const result = mockSqlQueryResult({ duration: 100 });
      assertThrows(
        () => expectSqlQueryResult(result).toHaveDurationLessThan(100),
        Error,
        "Expected duration < 100ms, got 100ms",
      );
    });
  });

  await t.step("toHaveDurationLessThanOrEqual", async (t) => {
    await t.step("passes when duration is equal", () => {
      const result = mockSqlQueryResult({ duration: 100 });
      expectSqlQueryResult(result).toHaveDurationLessThanOrEqual(100);
    });

    await t.step("fails when duration is greater", () => {
      const result = mockSqlQueryResult({ duration: 150 });
      assertThrows(
        () => expectSqlQueryResult(result).toHaveDurationLessThanOrEqual(100),
        Error,
        "Expected duration <= 100ms, got 150ms",
      );
    });
  });

  await t.step("toHaveDurationGreaterThan", async (t) => {
    await t.step("passes when duration is greater", () => {
      const result = mockSqlQueryResult({ duration: 150 });
      expectSqlQueryResult(result).toHaveDurationGreaterThan(100);
    });

    await t.step("fails when duration is equal", () => {
      const result = mockSqlQueryResult({ duration: 100 });
      assertThrows(
        () => expectSqlQueryResult(result).toHaveDurationGreaterThan(100),
        Error,
        "Expected duration > 100ms, got 100ms",
      );
    });
  });

  await t.step("toHaveDurationGreaterThanOrEqual", async (t) => {
    await t.step("passes when duration is equal", () => {
      const result = mockSqlQueryResult({ duration: 100 });
      expectSqlQueryResult(result).toHaveDurationGreaterThanOrEqual(100);
    });

    await t.step("fails when duration is less", () => {
      const result = mockSqlQueryResult({ duration: 50 });
      assertThrows(
        () =>
          expectSqlQueryResult(result).toHaveDurationGreaterThanOrEqual(100),
        Error,
        "Expected duration >= 100ms, got 50ms",
      );
    });
  });

  await t.step("method chaining", () => {
    const result = mockSqlQueryResult({
      ok: true,
      rows: [{ id: 1, name: "Alice" }],
      rowCount: 1,
      metadata: { lastInsertId: BigInt(1) },
      duration: 50,
    });

    expectSqlQueryResult(result)
      .toBeSuccessful()
      .toHaveContent()
      .toHaveLength(1)
      .toHaveRowCount(1)
      .toMatchObject({ name: "Alice" })
      .toHaveLastInsertId()
      .toHaveDurationLessThan(100);
  });
});
