/**
 * Redis Client Scenario Example
 *
 * Target: redis service on port 16379 (compose.yaml)
 */
import { scenario } from "probitas";
import { createRedisClient, expectRedisResult } from "@probitas/client-redis";

export default scenario("Redis Client Example", {
  tags: ["integration", "redis"],
})
  .resource("redis", () =>
    createRedisClient({
      host: "localhost",
      port: 16379,
    }))
  .setup((ctx) => {
    const { redis } = ctx.resources;
    // Return cleanup function to delete all test keys
    return async () => {
      await redis.del(
        "test:key",
        "test:expiring",
        "test:counter",
        "test:hash",
        "test:list",
        "test:set",
      );
    };
  })
  .step("SET and GET string", async (ctx) => {
    const { redis } = ctx.resources;
    await redis.set("test:key", "hello world");
    const result = await redis.get("test:key");

    expectRedisResult(result).ok().value("hello world");
  })
  .step("SET with expiry", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.set("test:expiring", "temporary", { ex: 60 });

    expectRedisResult(result).ok();
  })
  .step("GET non-existent key", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.get("test:nonexistent");

    expectRedisResult(result).ok().value(null);
  })
  .step("INCR counter", async (ctx) => {
    const { redis } = ctx.resources;
    await redis.set("test:counter", "0");
    const result = await redis.incr("test:counter");

    expectRedisResult(result).ok().count(1);
  })
  .step("Multiple INCR", async (ctx) => {
    const { redis } = ctx.resources;
    await redis.incr("test:counter");
    await redis.incr("test:counter");
    await redis.incr("test:counter");
    const getResult = await redis.get("test:counter");

    expectRedisResult(getResult).ok().value("4");
  })
  .step("DECR counter", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.decr("test:counter");

    expectRedisResult(result).ok().count(3);
  })
  .step("HSET and HGET hash", async (ctx) => {
    const { redis } = ctx.resources;
    await redis.hset("test:hash", "field1", "value1");
    await redis.hset("test:hash", "field2", "value2");
    const result = await redis.hget("test:hash", "field1");

    expectRedisResult(result).ok().value("value1");
  })
  .step("HGETALL hash", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.hgetall("test:hash");

    expectRedisResult(result).ok().valueMatch((value) => {
      if (value.field1 !== "value1" || value.field2 !== "value2") {
        throw new Error("Expected hash with field1=value1, field2=value2");
      }
    });
  })
  .step("LPUSH and LRANGE list", async (ctx) => {
    const { redis } = ctx.resources;
    await redis.lpush("test:list", "c", "b", "a");
    const result = await redis.lrange("test:list", 0, -1);

    expectRedisResult(result).ok().length(3).contains("a");
  })
  .step("LLEN list", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.llen("test:list");

    expectRedisResult(result).ok().count(3);
  })
  .step("SADD and SMEMBERS set", async (ctx) => {
    const { redis } = ctx.resources;
    await redis.sadd("test:set", "member1", "member2", "member3");
    const result = await redis.smembers("test:set");

    expectRedisResult(result).ok().length(3);
  })
  .step("SISMEMBER set membership", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.sismember("test:set", "member1");

    expectRedisResult(result).ok().value(true);
  })
  .step("DEL key", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.del("test:key");

    expectRedisResult(result).ok().count(1);
  })
  .step("DEL non-existent key", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.del("test:nonexistent:key");

    expectRedisResult(result).ok().count(0);
  })
  .build();
