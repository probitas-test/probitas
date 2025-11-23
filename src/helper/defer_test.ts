import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { FakeTime } from "@std/testing/time";
import { defer } from "probitas/helper/defer";

describe("defer", () => {
  describe("basic defer functionality", () => {
    it("synchronous cleanup execution", () => {
      const executionOrder: string[] = [];

      {
        using _cleanup = defer(() => {
          executionOrder.push("cleanup");
        });
        executionOrder.push("main");
      }

      assertEquals(executionOrder, ["main", "cleanup"]);
    });
  });

  describe("execution order (LIFO)", () => {
    it("multiple cleanups execute in reverse order", () => {
      const executionOrder: string[] = [];

      {
        using _cleanup1 = defer(() => executionOrder.push("cleanup1"));
        using _cleanup2 = defer(() => executionOrder.push("cleanup2"));
        using _cleanup3 = defer(() => executionOrder.push("cleanup3"));
        executionOrder.push("main");
      }

      assertEquals(executionOrder, [
        "main",
        "cleanup3",
        "cleanup2",
        "cleanup1",
      ]);
    });

    it("nested scopes with multiple defers", () => {
      const executionOrder: string[] = [];

      {
        using _outer = defer(() => executionOrder.push("outer cleanup"));
        executionOrder.push("outer start");

        {
          using _inner = defer(() => executionOrder.push("inner cleanup"));
          executionOrder.push("inner start");
        }

        executionOrder.push("outer end");
      }

      assertEquals(executionOrder, [
        "outer start",
        "inner start",
        "inner cleanup",
        "outer end",
        "outer cleanup",
      ]);
    });
  });

  describe("error handling", () => {
    it("cleanup executes even when error occurs", () => {
      const executionOrder: string[] = [];
      let errorThrown = false;

      try {
        using _cleanup = defer(() => {
          executionOrder.push("cleanup");
        });
        executionOrder.push("before error");
        throw new Error("Test error");
      } catch (_error) {
        errorThrown = true;
        executionOrder.push("error caught");
      }

      assertEquals(errorThrown, true);
      assertEquals(executionOrder, ["before error", "cleanup", "error caught"]);
    });

    it("async cleanup executes even when error occurs", async () => {
      using time = new FakeTime();
      const executionOrder: string[] = [];
      let errorThrown = false;

      const promise = (async () => {
        try {
          await using _cleanup = defer(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            executionOrder.push("async cleanup");
          });
          executionOrder.push("before error");
          throw new Error("Test error");
        } catch (_error) {
          errorThrown = true;
          executionOrder.push("error caught");
        }
      })();

      await time.tickAsync(10);
      await promise;

      assertEquals(errorThrown, true);
      assertEquals(executionOrder, [
        "before error",
        "async cleanup",
        "error caught",
      ]);
    });
  });

  describe("async support", () => {
    it("asynchronous cleanup execution", async () => {
      using time = new FakeTime();
      const executionOrder: string[] = [];

      const promise = (async () => {
        {
          await using _cleanup = defer(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            executionOrder.push("async cleanup");
          });
          executionOrder.push("main");
        }
      })();

      await time.tickAsync(10);
      await promise;

      assertEquals(executionOrder, ["main", "async cleanup"]);
    });

    it("async cleanup with return value preservation", async () => {
      using time = new FakeTime();

      async function getResult(): Promise<number> {
        await using _cleanup = defer(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        });
        return 42;
      }

      const promise = getResult();
      await time.tickAsync(10);
      const result = await promise;

      assertEquals(result, 42);
    });
  });

  describe("edge cases", () => {
    it("cleanup with return value preservation", () => {
      function getResult(): number {
        using _cleanup = defer(() => {
          // cleanup logic
        });
        return 42;
      }

      assertEquals(getResult(), 42);
    });

    it("cleanup can access outer scope variables", () => {
      const state = { cleaned: false };

      {
        using _cleanup = defer(() => {
          state.cleaned = true;
        });
        assertEquals(state.cleaned, false);
      }

      assertEquals(state.cleaned, true);
    });
  });
});
