/**
 * SQLite Client Scenario Example
 *
 * Uses in-memory database for testing (no external dependencies required).
 * For file-based database, set path to a file path like "./example/assets/test.db"
 */
import { client, expect, outdent, scenario } from "probitas";

export default scenario("SQLite Client Example", {
  tags: ["integration", "sql", "sqlite"],
})
  .resource("sqlite", () =>
    client.sql.sqlite.createSqliteClient({
      // Use in-memory database for testing
      path: ":memory:",
    }))
  .setup(async (ctx) => {
    const { sqlite } = ctx.resources;
    // Create test table
    await sqlite.query(outdent`
      CREATE TABLE IF NOT EXISTS test_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        isbn TEXT UNIQUE,
        published_year INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Return cleanup function to drop table
    return async () => {
      await sqlite.query(`DROP TABLE IF EXISTS test_books`);
    };
  })
  .step("Insert single row", async (ctx) => {
    const { sqlite } = ctx.resources;
    const result = await sqlite.query(
      `INSERT INTO test_books (title, author, isbn, published_year) VALUES (?, ?, ?, ?)`,
      ["The Pragmatic Programmer", "David Thomas", "978-0135957059", 2019],
    );

    expect(result)
      .ok()
      .rowCount(1);
  })
  .step("Insert multiple rows", async (ctx) => {
    const { sqlite } = ctx.resources;
    // SQLite doesn't support multiple VALUES in single INSERT with parameters easily,
    // so we use separate inserts
    await sqlite.query(
      `INSERT INTO test_books (title, author, isbn, published_year) VALUES (?, ?, ?, ?)`,
      ["Clean Code", "Robert C. Martin", "978-0132350884", 2008],
    );
    const result = await sqlite.query(
      `INSERT INTO test_books (title, author, isbn, published_year) VALUES (?, ?, ?, ?)`,
      ["Design Patterns", "Gang of Four", "978-0201633610", 1994],
    );

    expect(result)
      .ok()
      .rowCount(1);
  })
  .step("Select with WHERE clause", async (ctx) => {
    const { sqlite } = ctx.resources;
    const result = await sqlite.query<{ id: number; title: string }>(
      `SELECT id, title FROM test_books WHERE author = ?`,
      ["David Thomas"],
    );

    expect(result)
      .ok()
      .rowCount(1)
      .rowContains({ title: "The Pragmatic Programmer" });
  })
  .step("Select all rows", async (ctx) => {
    const { sqlite } = ctx.resources;
    const result = await sqlite.query<
      { id: number; title: string; author: string }
    >(
      `SELECT id, title, author FROM test_books ORDER BY id`,
    );

    expect(result)
      .ok()
      .rowCountAtLeast(3);
  })
  .step("Update row", async (ctx) => {
    const { sqlite } = ctx.resources;
    const result = await sqlite.query(
      `UPDATE test_books SET published_year = ? WHERE isbn = ?`,
      [2020, "978-0135957059"],
    );

    expect(result)
      .ok()
      .rowCount(1);
  })
  .step("Transaction - commit", async (ctx) => {
    const { sqlite } = ctx.resources;
    await sqlite.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO test_books (title, author, isbn) VALUES (?, ?, ?)`,
        ["Refactoring", "Martin Fowler", "978-0134757599"],
      );
    });

    const result = await sqlite.query<{ title: string }>(
      `SELECT title FROM test_books WHERE isbn = ?`,
      ["978-0134757599"],
    );

    expect(result)
      .ok()
      .rowCount(1)
      .rowContains({ title: "Refactoring" });
  })
  .step("Transaction - rollback on error", async (ctx) => {
    const { sqlite } = ctx.resources;
    try {
      await sqlite.transaction(async (tx) => {
        await tx.query(
          `INSERT INTO test_books (title, author, isbn) VALUES (?, ?, ?)`,
          ["Test Book", "Test Author", "978-0000000000"],
        );
        throw new Error("Intentional rollback");
      });
    } catch {
      // Expected
    }

    const result = await sqlite.query<{ title: string }>(
      `SELECT title FROM test_books WHERE isbn = ?`,
      ["978-0000000000"],
    );

    expect(result)
      .ok()
      .rowCount(0);
  })
  .step("Delete row", async (ctx) => {
    const { sqlite } = ctx.resources;
    const result = await sqlite.query(
      `DELETE FROM test_books WHERE isbn = ?`,
      ["978-0134757599"],
    );

    expect(result)
      .ok()
      .rowCount(1);
  })
  .build();
