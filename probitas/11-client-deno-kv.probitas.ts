/**
 * Deno KV Client Scenario Example
 *
 * Uses in-memory Deno KV storage for testing.
 */
import { client, expect, scenario } from "probitas";

export default scenario("Deno KV Client Example", {
  tags: ["integration", "deno-kv"],
})
  .resource("kv", () => client.deno_kv.createDenoKvClient())
  .setup((ctx) => {
    const { kv } = ctx.resources;
    // Return cleanup function to delete all test keys
    return async () => {
      await kv.delete(["test", "string"]);
      await kv.delete(["test", "object"]);
      await kv.delete(["users", "1"]);
      await kv.delete(["users", "2"]);
      await kv.delete(["users", "3"]);
      await kv.delete(["counter"]);
    };
  })
  .step("Set string value", async (ctx) => {
    const { kv } = ctx.resources;
    const result = await kv.set(["test", "string"], "hello world");
    expect(result).toBeSuccessful();
  })
  .step("Get string value", async (ctx) => {
    const { kv } = ctx.resources;
    const result = await kv.get<string>(["test", "string"]);

    expect(result)
      .toBeSuccessful()
      .value("hello world");
  })
  .step("Set object value", async (ctx) => {
    const { kv } = ctx.resources;
    await kv.set(["test", "object"], { name: "Alice", age: 30 });
  })
  .step("Get object value", async (ctx) => {
    const { kv } = ctx.resources;
    const result = await kv.get<{ name: string; age: number }>([
      "test",
      "object",
    ]);

    expect(result)
      .toBeSuccessful()
      .toHaveContent()
      .toMatchObject({ name: "Alice" });
  })
  .step("Set multiple values", async (ctx) => {
    const { kv } = ctx.resources;
    await kv.set(["users", "1"], { id: 1, name: "User1" });
    await kv.set(["users", "2"], { id: 2, name: "User2" });
    await kv.set(["users", "3"], { id: 3, name: "User3" });
  })
  .step("List with prefix", async (ctx) => {
    const { kv } = ctx.resources;
    const result = await kv.list<{ id: number; name: string }>({
      prefix: ["users"],
    });

    expect(result)
      .toBeSuccessful()
      .toHaveLengthGreaterThanOrEqual(3);
  })
  .step("List with limit", async (ctx) => {
    const { kv } = ctx.resources;
    const result = await kv.list<{ id: number; name: string }>(
      { prefix: ["users"] },
      { limit: 2 },
    );

    expect(result)
      .toBeSuccessful()
      .toHaveLength(2);
  })
  .step("Get non-existent key", async (ctx) => {
    const { kv } = ctx.resources;
    const result = await kv.get(["nonexistent", "key"]);

    expect(result)
      .toBeSuccessful()
      .not.toHaveContent();
  })
  .step("Atomic operation - check and set", async (ctx) => {
    const { kv } = ctx.resources;
    const current = await kv.get<number>(["counter"]);

    const atomic = kv.atomic();
    atomic.check({ key: ["counter"], versionstamp: current.versionstamp });
    atomic.set(["counter"], 1);
    const result = await atomic.commit();
    expect(result).toBeSuccessful();
  })
  .step("Atomic operation - increment", async (ctx) => {
    const { kv } = ctx.resources;
    const current = await kv.get<number>(["counter"]);

    const atomic = kv.atomic();
    atomic.check({ key: ["counter"], versionstamp: current.versionstamp });
    atomic.set(["counter"], (current.value ?? 0) + 1);
    await atomic.commit();

    const updated = await kv.get<number>(["counter"]);
    expect(updated).toBeSuccessful().value(2);
  })
  .step("Delete key", async (ctx) => {
    const { kv } = ctx.resources;
    const result = await kv.delete(["test", "string"]);
    expect(result).toBeSuccessful();
  })
  .step("Verify deletion", async (ctx) => {
    const { kv } = ctx.resources;
    const result = await kv.get(["test", "string"]);

    expect(result).toBeSuccessful().not.toHaveContent();
  })
  .build();
