/**
 * MongoDB Client Scenario Example
 *
 * Target: mongodb service on port 27017 (compose.yaml)
 * Database: testdb (replica set mode for transactions)
 */
import { client, expect, scenario, Skip } from "jsr:@probitas/probitas@^0";

const HOST = "localhost";
const PORT = 27017;

export default scenario("MongoDB Client Example", {
  tags: ["integration", "mongodb"],
})
  .setup("Check MongoDB server availability", async () => {
    try {
      const conn = await Deno.connect({ hostname: HOST, port: PORT });
      conn.close();
    } catch {
      throw new Skip(`MongoDB server not available at ${HOST}:${PORT}`);
    }
  })
  .resource("mongo", () =>
    client.mongodb.createMongoClient({
      url: `mongodb://${HOST}:${PORT}/?replicaSet=rs0`,
      database: "testdb",
    }))
  .setup(async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection("test_users");
    // Clean up any existing data
    await users.deleteMany({});

    // Return cleanup function to drop collection
    return async () => {
      await users.deleteMany({});
    };
  })
  .step("Insert one document", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.insertOne({ name: "Alice", age: 30 });

    expect(result)
      .toBeOk()
      .toHaveInsertedIdMatching(/.+/); // Verify insertedId is present and non-empty
  })
  .step("Insert many documents", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.insertMany([
      { name: "Bob", age: 25 },
      { name: "Charlie", age: 35 },
      { name: "Diana", age: 28 },
    ]);

    expect(result)
      .toBeOk()
      .toHaveInsertedCount(3);
  })
  .step("Find one document", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.findOne({ name: "Alice" });

    expect(result)
      .toBeOk()
      .toHaveDocMatching({ name: "Alice" });
  })
  .step("Find with filter", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.find({ age: { $gte: 30 } });

    expect(result).toBeOk().toHaveDocsCount(2);
  })
  .step("Find with sort and limit", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.find({}, {
      sort: { age: -1 },
      limit: 2,
    });

    expect(result)
      .toBeOk()
      .toHaveDocsCount(2)
      .toHaveDocsMatching({ age: 35 }); // First doc should be oldest user (age: 35)
  })
  .step("Update one document", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.updateOne(
      { name: "Alice" },
      { $set: { age: 31 } },
    );

    expect(result)
      .toBeOk()
      .toHaveModifiedCount(1);
  })
  .step("Update many documents", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.updateMany(
      { age: { $lt: 30 } },
      { $inc: { age: 1 } },
    );

    expect(result).toBeOk().toHaveModifiedCountGreaterThanOrEqual(1);
  })
  .step("Count documents", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.countDocuments({ age: { $gte: 25 } });

    expect(result)
      .toBeOk()
      .toHaveCountGreaterThanOrEqual(3);
  })
  .step("Transaction - commit", async (ctx) => {
    const { mongo } = ctx.resources;
    await mongo.transaction(async () => {
      const users = mongo.collection("test_users");
      await users.insertOne({ name: "TxUser", age: 40 });
    });

    // NOTE: findOne returns T | undefined directly
    const users = mongo.collection<{ name: string }>("test_users");
    const result = await users.findOne({ name: "TxUser" });
    expect(result).toBeOk();
  })
  .step("Delete one document", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection("test_users");
    const result = await users.deleteOne({ name: "TxUser" });

    expect(result)
      .toBeOk()
      .toHaveDeletedCount(1);
  })
  .step("Delete many documents", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection("test_users");
    const result = await users.deleteMany({});

    expect(result)
      .toBeOk()
      .toHaveDeletedCountGreaterThanOrEqual(1);
  })
  .build();
