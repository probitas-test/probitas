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
  });

  describe("edge cases", () => {
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
