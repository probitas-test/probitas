import { assertThrows } from "@std/assert";
import { expectRedisResult } from "./redis.ts";
import type {
  RedisArrayResult,
  RedisCountResult,
  RedisGetResult,
} from "@probitas/client-redis";

// Mock helpers
const mockRedisGetResult = (
  overrides: Partial<RedisGetResult> = {},
): RedisGetResult => ({
  type: "redis:get" as const,
  ok: true,
  value: "test-value",
  duration: 100,
  ...overrides,
});

const mockRedisCountResult = (
  overrides: Partial<RedisCountResult> = {},
): RedisCountResult => ({
  type: "redis:count" as const,
  ok: true,
  value: 5,
  duration: 100,
  ...overrides,
});

const mockRedisArrayResult = <T>(
  overrides: Partial<RedisArrayResult<T>> = {},
): RedisArrayResult<T> => ({
  type: "redis:array" as const,
  ok: true,
  value: [] as readonly T[],
  duration: 100,
  ...overrides,
});

Deno.test("expectRedisResult", async (t) => {
  await t.step("RedisGetResult", async (t) => {
    await t.step("toBeSuccessful", async (t) => {
      await t.step("passes when ok is true", () => {
        const result = mockRedisGetResult({ ok: true });
        expectRedisResult(result).toBeSuccessful();
      });

      await t.step("fails when ok is false", () => {
        const result = mockRedisGetResult({ ok: false });
        assertThrows(
          () => expectRedisResult(result).toBeSuccessful(),
          Error,
          "Expected ok result, but ok is false",
        );
      });
    });

    await t.step("toHaveData", async (t) => {
      await t.step("passes for matching data", () => {
        const result = mockRedisGetResult({ value: "test" });
        expectRedisResult(result).toHaveData("test");
      });

      await t.step("fails for non-matching data", () => {
        const result = mockRedisGetResult({ value: "test" });
        assertThrows(
          () => expectRedisResult(result).toHaveData("other"),
          Error,
          'Expected data "other", got "test"',
        );
      });
    });

    await t.step("toSatisfy", async (t) => {
      await t.step("passes when matcher succeeds", () => {
        const result = mockRedisGetResult({ value: "test" });
        expectRedisResult(result).toSatisfy((value) => {
          if (value !== "test") throw new Error("Expected test");
        });
      });

      await t.step("fails when matcher throws", () => {
        const result = mockRedisGetResult({ value: "other" });
        assertThrows(
          () =>
            expectRedisResult(result).toSatisfy((value) => {
              if (value !== "test") throw new Error("Expected test");
            }),
          Error,
          "Expected test",
        );
      });
    });

    await t.step("duration methods", () => {
      const result = mockRedisGetResult({ duration: 50 });
      expectRedisResult(result)
        .toHaveDurationLessThan(100)
        .toHaveDurationLessThanOrEqual(50)
        .toHaveDurationGreaterThan(25)
        .toHaveDurationGreaterThanOrEqual(50);
    });
  });

  await t.step("RedisCountResult", async (t) => {
    await t.step("toBeSuccessful", () => {
      const result = mockRedisCountResult({ ok: true });
      expectRedisResult(result).toBeSuccessful();
    });

    await t.step("toHaveData", () => {
      const result = mockRedisCountResult({ value: 5 });
      expectRedisResult(result).toHaveData(5);
    });

    await t.step("toHaveLength", async (t) => {
      await t.step("passes for matching count", () => {
        const result = mockRedisCountResult({ value: 5 });
        expectRedisResult(result).toHaveLength(5);
      });

      await t.step("fails for non-matching count", () => {
        const result = mockRedisCountResult({ value: 5 });
        assertThrows(
          () => expectRedisResult(result).toHaveLength(3),
          Error,
          "Expected 3 count, got 5",
        );
      });
    });

    await t.step("toHaveLengthGreaterThanOrEqual", async (t) => {
      await t.step("passes when count is greater", () => {
        const result = mockRedisCountResult({ value: 5 });
        expectRedisResult(result).toHaveLengthGreaterThanOrEqual(3);
      });

      await t.step("passes when count is equal", () => {
        const result = mockRedisCountResult({ value: 5 });
        expectRedisResult(result).toHaveLengthGreaterThanOrEqual(5);
      });

      await t.step("fails when count is less", () => {
        const result = mockRedisCountResult({ value: 2 });
        assertThrows(
          () => expectRedisResult(result).toHaveLengthGreaterThanOrEqual(5),
          Error,
          "Expected at least 5 count, got 2",
        );
      });
    });

    await t.step("toHaveLengthLessThanOrEqual", async (t) => {
      await t.step("passes when count is less", () => {
        const result = mockRedisCountResult({ value: 3 });
        expectRedisResult(result).toHaveLengthLessThanOrEqual(5);
      });

      await t.step("passes when count is equal", () => {
        const result = mockRedisCountResult({ value: 5 });
        expectRedisResult(result).toHaveLengthLessThanOrEqual(5);
      });

      await t.step("fails when count is greater", () => {
        const result = mockRedisCountResult({ value: 10 });
        assertThrows(
          () => expectRedisResult(result).toHaveLengthLessThanOrEqual(5),
          Error,
          "Expected at most 5 count, got 10",
        );
      });
    });

    await t.step("method chaining", () => {
      const result = mockRedisCountResult({ ok: true, value: 5, duration: 50 });
      expectRedisResult(result)
        .toBeSuccessful()
        .toHaveData(5)
        .toHaveLength(5)
        .toHaveLengthGreaterThanOrEqual(3)
        .toHaveDurationLessThan(100);
    });
  });

  await t.step("RedisArrayResult", async (t) => {
    await t.step("toBeSuccessful", () => {
      const result = mockRedisArrayResult({ ok: true });
      expectRedisResult(result).toBeSuccessful();
    });

    await t.step("toHaveContent", async (t) => {
      await t.step("passes when array is not empty", () => {
        const result = mockRedisArrayResult({ value: ["item1", "item2"] });
        expectRedisResult(result).toHaveContent();
      });

      await t.step("fails when array is empty", () => {
        const result = mockRedisArrayResult({ value: [] });
        assertThrows(
          () => expectRedisResult(result).toHaveContent(),
          Error,
          "Expected non-empty array, but array is empty",
        );
      });

      await t.step("negated - passes when array is empty", () => {
        const result = mockRedisArrayResult({ value: [] });
        expectRedisResult(result).not.toHaveContent();
      });
    });

    await t.step("toHaveLength", async (t) => {
      await t.step("passes for matching count", () => {
        const result = mockRedisArrayResult({ value: ["a", "b", "c"] });
        expectRedisResult(result).toHaveLength(3);
      });

      await t.step("fails for non-matching count", () => {
        const result = mockRedisArrayResult({ value: ["a", "b"] });
        assertThrows(
          () => expectRedisResult(result).toHaveLength(3),
          Error,
          "Expected 3 array count, got 2",
        );
      });
    });

    await t.step("toHaveLengthGreaterThanOrEqual", async (t) => {
      await t.step("passes when count is greater", () => {
        const result = mockRedisArrayResult({ value: ["a", "b", "c"] });
        expectRedisResult(result).toHaveLengthGreaterThanOrEqual(2);
      });

      await t.step("passes when count is equal", () => {
        const result = mockRedisArrayResult({ value: ["a", "b"] });
        expectRedisResult(result).toHaveLengthGreaterThanOrEqual(2);
      });

      await t.step("fails when count is less", () => {
        const result = mockRedisArrayResult({ value: ["a"] });
        assertThrows(
          () => expectRedisResult(result).toHaveLengthGreaterThanOrEqual(3),
          Error,
          "Expected at least 3 array count, got 1",
        );
      });
    });

    await t.step("toHaveLengthLessThanOrEqual", async (t) => {
      await t.step("passes when count is less", () => {
        const result = mockRedisArrayResult({ value: ["a"] });
        expectRedisResult(result).toHaveLengthLessThanOrEqual(3);
      });

      await t.step("passes when count is equal", () => {
        const result = mockRedisArrayResult({ value: ["a", "b", "c"] });
        expectRedisResult(result).toHaveLengthLessThanOrEqual(3);
      });

      await t.step("fails when count is greater", () => {
        const result = mockRedisArrayResult({ value: ["a", "b", "c", "d"] });
        assertThrows(
          () => expectRedisResult(result).toHaveLengthLessThanOrEqual(3),
          Error,
          "Expected at most 3 array count, got 4",
        );
      });
    });

    await t.step("toContain", async (t) => {
      await t.step("passes when item exists", () => {
        const result = mockRedisArrayResult({ value: ["a", "b", "c"] });
        expectRedisResult(result).toContain("b");
      });

      await t.step("fails when item does not exist", () => {
        const result = mockRedisArrayResult({ value: ["a", "b", "c"] });
        assertThrows(
          () => expectRedisResult(result).toContain("d"),
          Error,
          'Expected array to contain "d"',
        );
      });

      await t.step("negated - passes when item does not exist", () => {
        const result = mockRedisArrayResult({ value: ["a", "b", "c"] });
        expectRedisResult(result).not.toContain("d");
      });
    });

    await t.step("method chaining", () => {
      const result = mockRedisArrayResult({
        ok: true,
        value: ["a", "b", "c"],
        duration: 50,
      });
      expectRedisResult(result)
        .toBeSuccessful()
        .toHaveContent()
        .toHaveLength(3)
        .toContain("b")
        .toHaveDurationLessThan(100);
    });
  });
});
