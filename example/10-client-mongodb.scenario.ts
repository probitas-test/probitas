/**
 * MongoDB Client Scenario Example
 *
 * Target: mongodb service on port 27017 (compose.yaml)
 * Database: testdb (replica set mode for transactions)
 */
import { scenario } from "probitas";
import { createMongoClient, expectMongoResult } from "@probitas/client-mongodb";

export default scenario("MongoDB Client Example", {
  tags: ["integration", "mongodb"],
})
  .resource("mongo", () =>
    createMongoClient({
      uri: "mongodb://localhost:27017/?replicaSet=rs0",
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

    expectMongoResult(result)
      .ok()
      .hasInsertedId();
  })
  .step("Insert many documents", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.insertMany([
      { name: "Bob", age: 25 },
      { name: "Charlie", age: 35 },
      { name: "Diana", age: 28 },
    ]);

    expectMongoResult(result)
      .ok()
      .insertedCount(3);
  })
  .step("Find one document", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.findOne({ name: "Alice" });

    expectMongoResult(result)
      .ok()
      .docContains({ name: "Alice" });
  })
  .step("Find with filter", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.find({ age: { $gte: 30 } });

    expectMongoResult(result).ok().docs(2);
  })
  .step("Find with sort and limit", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.find({}, {
      sort: { age: -1 },
      limit: 2,
    });

    expectMongoResult(result)
      .ok()
      .docs(2)
      .docMatch((docs) => {
        if (docs.first()?.age !== 35) {
          throw new Error("Expected oldest user first");
        }
      });
  })
  .step("Update one document", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.updateOne(
      { name: "Alice" },
      { $set: { age: 31 } },
    );

    expectMongoResult(result)
      .ok()
      .modifiedCount(1);
  })
  .step("Update many documents", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.updateMany(
      { age: { $lt: 30 } },
      { $inc: { age: 1 } },
    );

    // NOTE: modifiedAtLeast is not available in current API
    expectMongoResult(result).ok();
    if (result.modifiedCount < 1) {
      throw new Error("Expected at least 1 modified document");
    }
  })
  .step("Count documents", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection<{ name: string; age: number }>("test_users");
    const result = await users.countDocuments({ age: { $gte: 25 } });

    expectMongoResult(result)
      .ok()
      .countAtLeast(3);
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
    expectMongoResult(result).ok();
  })
  .step("Delete one document", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection("test_users");
    const result = await users.deleteOne({ name: "TxUser" });

    expectMongoResult(result)
      .ok()
      .deletedCount(1);
  })
  .step("Delete many documents", async (ctx) => {
    const { mongo } = ctx.resources;
    const users = mongo.collection("test_users");
    const result = await users.deleteMany({});

    expectMongoResult(result)
      .ok()
      .deletedAtLeast(1);
  })
  .build();
