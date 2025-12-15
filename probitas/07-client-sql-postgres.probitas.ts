/**
 * PostgreSQL Client Scenario Example
 *
 * Target: postgres service on port 15432 (compose.yaml)
 * Credentials: testuser/testpassword, database: testdb
 */
import { client, expect, outdent, scenario } from "jsr:@probitas/probitas@^0";

export default scenario("PostgreSQL Client Example", {
  tags: ["integration", "sql", "postgres"],
})
  .resource("pg", () =>
    client.sql.postgres.createPostgresClient({
      url: "postgres://testuser:testpassword@localhost:15432/testdb",
    }))
  .setup(async (ctx) => {
    const { pg } = ctx.resources;
    // Create test table
    await pg.query(outdent`
      CREATE TABLE IF NOT EXISTS test_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Return cleanup function to drop table
    return async () => {
      await pg.query(`DROP TABLE IF EXISTS test_users`);
    };
  })
  .step("Insert single row", async (ctx) => {
    const { pg } = ctx.resources;
    const result = await pg.query(
      `INSERT INTO test_users (name, email) VALUES ($1, $2) RETURNING id`,
      ["Alice", "alice@example.com"],
    );

    expect(result)
      .toBeOk()
      .toHaveRowCount(1);
  })
  .step("Insert multiple rows", async (ctx) => {
    const { pg } = ctx.resources;
    const result = await pg.query(
      `INSERT INTO test_users (name, email) VALUES ($1, $2), ($3, $4)`,
      ["Bob", "bob@example.com", "Charlie", "charlie@example.com"],
    );

    expect(result)
      .toBeOk()
      .toHaveRowCount(2);
  })
  .step("Select with WHERE clause", async (ctx) => {
    const { pg } = ctx.resources;
    const result = await pg.query<{ id: number; name: string }>(
      `SELECT id, name FROM test_users WHERE name = $1`,
      ["Alice"],
    );

    expect(result)
      .toBeOk()
      .toHaveRowCount(1)
      .toHaveRowsMatching({ name: "Alice" });
  })
  .step("Select all rows", async (ctx) => {
    const { pg } = ctx.resources;
    const result = await pg.query<{ id: number; name: string }>(
      `SELECT id, name FROM test_users ORDER BY id`,
    );

    expect(result)
      .toBeOk()
      .toHaveRowCountGreaterThanOrEqual(3);
  })
  .step("Update row", async (ctx) => {
    const { pg } = ctx.resources;
    const result = await pg.query(
      `UPDATE test_users SET name = $1 WHERE email = $2`,
      ["Alice Updated", "alice@example.com"],
    );

    expect(result)
      .toBeOk()
      .toHaveRowCount(1);
  })
  .step("Transaction - commit", async (ctx) => {
    const { pg } = ctx.resources;
    await pg.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO test_users (name, email) VALUES ($1, $2)`,
        ["TxUser", "tx@example.com"],
      );
    });

    const result = await pg.query<{ name: string }>(
      `SELECT name FROM test_users WHERE email = $1`,
      ["tx@example.com"],
    );

    expect(result)
      .toBeOk()
      .toHaveRowCount(1)
      .toHaveRowsMatching({ name: "TxUser" });
  })
  .step("Transaction - rollback on error", async (ctx) => {
    const { pg } = ctx.resources;
    try {
      await pg.transaction(async (tx) => {
        await tx.query(
          `INSERT INTO test_users (name, email) VALUES ($1, $2)`,
          ["RollbackUser", "rollback@example.com"],
        );
        throw new Error("Intentional rollback");
      });
    } catch {
      // Expected
    }

    const result = await pg.query<{ name: string }>(
      `SELECT name FROM test_users WHERE email = $1`,
      ["rollback@example.com"],
    );

    expect(result)
      .toBeOk()
      .toHaveRowCount(0);
  })
  .step("Delete row", async (ctx) => {
    const { pg } = ctx.resources;
    const result = await pg.query(
      `DELETE FROM test_users WHERE email = $1`,
      ["tx@example.com"],
    );

    expect(result)
      .toBeOk()
      .toHaveRowCount(1);
  })
  .build();
