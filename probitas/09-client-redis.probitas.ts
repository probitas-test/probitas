/**
 * Redis Client Scenario Example
 *
 * Target: redis service on port 16379 (compose.yaml)
 */
import { client, expect, scenario, Skip } from "jsr:@probitas/probitas@^0";

const HOST = "localhost";
const PORT = 6379;

export default scenario("Redis Client Example", {
  tags: ["integration", "redis"],
})
  .setup("Check Redis server availability", async () => {
    try {
      const conn = await Deno.connect({ hostname: HOST, port: PORT });
      conn.close();
    } catch {
      throw new Skip(`Redis server not available at ${HOST}:${PORT}`);
    }
  })
  .resource("redis", () =>
    client.redis.createRedisClient({
      url: `redis://${HOST}:${PORT}`,
    }))
  .setup((ctx) => {
    const { redis } = ctx.resources;
    // Return cleanup function to delete all test keys
    return async () => {
      await redis.del([
        "test:key",
        "test:expiring",
        "test:counter",
        "test:hash",
        "test:list",
        "test:set",
      ]);
    };
  })
  .step("SET and GET string", async (ctx) => {
    const { redis } = ctx.resources;
    await redis.set("test:key", "hello world");
    const result = await redis.get("test:key");

    expect(result).toBeOk().toHaveValue("hello world");
  })
  .step("SET with expiry", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.set("test:expiring", "temporary", { ex: 60 });

    expect(result).toBeOk();
  })
  .step("GET non-existent key", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.get("test:nonexistent");

    expect(result).toBeOk().toHaveValueNull();
  })
  .step("INCR counter", async (ctx) => {
    const { redis } = ctx.resources;
    await redis.set("test:counter", "0");
    const result = await redis.incr("test:counter");

    expect(result).toBeOk().toHaveValue(1);
  })
  .step("Multiple INCR", async (ctx) => {
    const { redis } = ctx.resources;
    await redis.incr("test:counter");
    await redis.incr("test:counter");
    await redis.incr("test:counter");
    const getResult = await redis.get("test:counter");

    expect(getResult).toBeOk().toHaveValue("4");
  })
  .step("DECR counter", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.decr("test:counter");

    expect(result).toBeOk().toHaveValue(3);
  })
  .step("HSET and HGET hash", async (ctx) => {
    const { redis } = ctx.resources;
    await redis.hset("test:hash", "field1", "value1");
    await redis.hset("test:hash", "field2", "value2");
    const result = await redis.hget("test:hash", "field1");

    expect(result).toBeOk().toHaveValue("value1");
  })
  .step("HGETALL hash", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.hgetall("test:hash");

    expect(result).toBeOk().toHaveValueSatisfying((value) => {
      expect(value)
        .not.toBeNull()
        .toMatchObject({
          field1: "value1",
          field2: "value2",
        });
    });
  })
  .step("LPUSH and LRANGE list", async (ctx) => {
    const { redis } = ctx.resources;
    await redis.lpush("test:list", ["c", "b", "a"]);
    const result = await redis.lrange("test:list", 0, -1);

    expect(result).toBeOk().toHaveValueCount(3).toHaveValueContaining("a");
  })
  .step("LLEN list", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.llen("test:list");

    expect(result).toBeOk().toHaveValue(3);
  })
  .step("SADD and SMEMBERS set", async (ctx) => {
    const { redis } = ctx.resources;
    await redis.sadd("test:set", ["member1", "member2", "member3"]);
    const result = await redis.smembers("test:set");

    expect(result).toBeOk().toHaveValueCount(3);
  })
  .step("SISMEMBER set membership", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.sismember("test:set", "member1");

    expect(result).toBeOk().toHaveValue(true);
  })
  .step("DEL key", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.del(["test:key"]);

    expect(result).toBeOk().toHaveValue(1);
  })
  .step("DEL non-existent key", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.del(["test:nonexistent:key"]);

    expect(result).toBeOk().toHaveValue(0);
  })
  .build();
