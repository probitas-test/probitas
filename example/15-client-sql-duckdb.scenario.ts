/**
 * DuckDB Client Scenario Example
 *
 * Uses in-memory database for testing (no external dependencies required).
 * DuckDB excels at analytical queries and can directly query Parquet/CSV files.
 *
 * For file-based database, set path like "./example/assets/analytics.duckdb"
 */
import { client, expect, outdent, scenario } from "probitas";

export default scenario("DuckDB Client Example", {
  tags: ["integration", "sql", "duckdb"],
})
  .resource("duckdb", () =>
    client.sql.duckdb.createDuckDbClient({
      // Use in-memory database for testing
      // path: ":memory:" is the default
    }))
  .setup(async (ctx) => {
    const { duckdb } = ctx.resources;
    // Create test table for analytics-style data
    await duckdb.query(outdent`
      CREATE TABLE IF NOT EXISTS sales_events (
        id INTEGER PRIMARY KEY,
        event_date DATE NOT NULL,
        product_name VARCHAR NOT NULL,
        category VARCHAR NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        region VARCHAR NOT NULL
      )
    `);

    // Return cleanup function to drop table
    return async () => {
      await duckdb.query(`DROP TABLE IF EXISTS sales_events`);
    };
  })
  .step("Insert sample data", async (ctx) => {
    const { duckdb } = ctx.resources;
    // DuckDB supports multi-row INSERT
    const result = await duckdb.query(`
      INSERT INTO sales_events (id, event_date, product_name, category, quantity, unit_price, region)
      VALUES
        (1, '2024-01-15', 'Widget A', 'Electronics', 10, 29.99, 'North'),
        (2, '2024-01-16', 'Widget B', 'Electronics', 5, 49.99, 'South'),
        (3, '2024-01-17', 'Gadget X', 'Hardware', 20, 19.99, 'North'),
        (4, '2024-01-18', 'Gadget Y', 'Hardware', 15, 24.99, 'East'),
        (5, '2024-01-19', 'Widget A', 'Electronics', 8, 29.99, 'West'),
        (6, '2024-01-20', 'Widget C', 'Electronics', 12, 39.99, 'North')
    `);

    expect(result).ok();
  })
  .step("Simple aggregation query", async (ctx) => {
    const { duckdb } = ctx.resources;
    const result = await duckdb.query<
      { category: string; total_quantity: number }
    >(
      `SELECT category, SUM(quantity) as total_quantity
       FROM sales_events
       GROUP BY category
       ORDER BY total_quantity DESC`,
    );

    expect(result)
      .ok()
      .rowCountAtLeast(2);
  })
  .step("Window function query", async (ctx) => {
    const { duckdb } = ctx.resources;
    // DuckDB excels at analytical queries with window functions
    const result = await duckdb.query<{
      product_name: string;
      quantity: number;
      running_total: number;
    }>(
      `SELECT
         product_name,
         quantity,
         SUM(quantity) OVER (ORDER BY event_date) as running_total
       FROM sales_events
       ORDER BY event_date`,
    );

    expect(result)
      .ok()
      .rowCountAtLeast(6);
  })
  .step("Parameterized query", async (ctx) => {
    const { duckdb } = ctx.resources;
    const result = await duckdb.query<
      { product_name: string; quantity: number }
    >(
      `SELECT product_name, quantity FROM sales_events WHERE region = $1`,
      ["North"],
    );

    expect(result)
      .ok()
      .rowCountAtLeast(2);
  })
  .step("Complex analytical query", async (ctx) => {
    const { duckdb } = ctx.resources;
    // Revenue analysis by region
    const result = await duckdb.query<{
      region: string;
      total_revenue: number;
      avg_order_value: number;
    }>(
      `SELECT
         region,
         SUM(quantity * unit_price) as total_revenue,
         AVG(quantity * unit_price) as avg_order_value
       FROM sales_events
       GROUP BY region
       ORDER BY total_revenue DESC`,
    );

    expect(result)
      .ok()
      .rowCountAtLeast(4);
  })
  .step("Update row", async (ctx) => {
    const { duckdb } = ctx.resources;
    const result = await duckdb.query(
      `UPDATE sales_events SET quantity = $1 WHERE id = $2`,
      [25, 1],
    );

    expect(result).ok();
  })
  .step("Transaction - commit", async (ctx) => {
    const { duckdb } = ctx.resources;
    await duckdb.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO sales_events (id, event_date, product_name, category, quantity, unit_price, region)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [7, "2024-01-21", "TxProduct", "Test", 1, 9.99, "Central"],
      );
    });

    const result = await duckdb.query<{ product_name: string }>(
      `SELECT product_name FROM sales_events WHERE id = $1`,
      [7],
    );

    expect(result)
      .ok()
      .rowCount(1)
      .rowContains({ product_name: "TxProduct" });
  })
  .step("Transaction - rollback on error", async (ctx) => {
    const { duckdb } = ctx.resources;
    try {
      await duckdb.transaction(async (tx) => {
        await tx.query(
          `INSERT INTO sales_events (id, event_date, product_name, category, quantity, unit_price, region)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [999, "2024-01-22", "RollbackProduct", "Test", 1, 9.99, "Central"],
        );
        throw new Error("Intentional rollback");
      });
    } catch {
      // Expected
    }

    const result = await duckdb.query<{ product_name: string }>(
      `SELECT product_name FROM sales_events WHERE id = $1`,
      [999],
    );

    expect(result)
      .ok()
      .rowCount(0);
  })
  .step("Delete row", async (ctx) => {
    const { duckdb } = ctx.resources;
    const result = await duckdb.query(
      `DELETE FROM sales_events WHERE id = $1`,
      [7],
    );

    expect(result).ok();
  })
  .build();
