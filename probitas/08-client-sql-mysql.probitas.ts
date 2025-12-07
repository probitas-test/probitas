/**
 * MySQL Client Scenario Example
 *
 * Target: mysql service on port 13306 (compose.yaml)
 * Credentials: testuser/testpassword, database: testdb
 */
import { client, expect, outdent, scenario } from "probitas";

export default scenario("MySQL Client Example", {
  tags: ["integration", "sql", "mysql"],
})
  .resource("mysql", () =>
    client.sql.mysql.createMySqlClient({
      connection: {
        host: "localhost",
        port: 13306,
        database: "testdb",
        user: "testuser",
        password: "testpassword",
      },
    }))
  .setup(async (ctx) => {
    const { mysql } = ctx.resources;
    // Create test table
    await mysql.query(outdent`
      CREATE TABLE IF NOT EXISTS test_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Return cleanup function to drop table
    return async () => {
      await mysql.query(`DROP TABLE IF EXISTS test_products`);
    };
  })
  .step("Insert single row", async (ctx) => {
    const { mysql } = ctx.resources;
    const result = await mysql.query(
      `INSERT INTO test_products (name, price) VALUES (?, ?)`,
      ["Widget", 19.99],
    );

    expect(result)
      .ok()
      .rowCount(1);
  })
  .step("Insert multiple rows", async (ctx) => {
    const { mysql } = ctx.resources;
    const result = await mysql.query(
      `INSERT INTO test_products (name, price) VALUES (?, ?), (?, ?)`,
      ["Gadget", 29.99, "Gizmo", 39.99],
    );

    expect(result)
      .ok()
      .rowCount(2);
  })
  .step("Select with WHERE clause", async (ctx) => {
    const { mysql } = ctx.resources;
    const result = await mysql.query<{ id: number; name: string }>(
      `SELECT id, name FROM test_products WHERE name = ?`,
      ["Widget"],
    );

    expect(result)
      .ok()
      .rowCount(1)
      .rowContains({ name: "Widget" });
  })
  .step("Select all rows", async (ctx) => {
    const { mysql } = ctx.resources;
    const result = await mysql.query<
      { id: number; name: string; price: number }
    >(
      `SELECT id, name, price FROM test_products ORDER BY id`,
    );

    expect(result)
      .ok()
      .rowCountAtLeast(3);
  })
  .step("Update row", async (ctx) => {
    const { mysql } = ctx.resources;
    const result = await mysql.query(
      `UPDATE test_products SET price = ? WHERE name = ?`,
      [24.99, "Widget"],
    );

    expect(result)
      .ok()
      .rowCount(1);
  })
  .step("Transaction - commit", async (ctx) => {
    const { mysql } = ctx.resources;
    await mysql.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO test_products (name, price) VALUES (?, ?)`,
        ["TxProduct", 49.99],
      );
    });

    const result = await mysql.query<{ name: string }>(
      `SELECT name FROM test_products WHERE name = ?`,
      ["TxProduct"],
    );

    expect(result)
      .ok()
      .rowCount(1)
      .rowContains({ name: "TxProduct" });
  })
  .step("Delete row", async (ctx) => {
    const { mysql } = ctx.resources;
    const result = await mysql.query(
      `DELETE FROM test_products WHERE name = ?`,
      ["TxProduct"],
    );

    expect(result)
      .ok()
      .rowCount(1);
  })
  .build();
