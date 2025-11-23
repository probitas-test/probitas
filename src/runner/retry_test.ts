import { assertEquals, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { FakeTime } from "@std/testing/time";
import { retry } from "./retry.ts";

describe("retry", () => {
  describe("configuration", () => {
    it("succeeds on first attempt", async () => {
      let attempts = 0;
      const result = await retry(() => {
        attempts++;
        return "success";
      });

      assertEquals(result, "success");
      assertEquals(attempts, 1);
    });
  });

  describe("transient failures", () => {
    it("succeeds on second attempt", async () => {
      using time = new FakeTime();
      let attempts = 0;

      const promise = retry(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error("Temporary failure");
        }
        return "success";
      }, { maxAttempts: 3 });

      // First attempt fails, wait 1s
      await time.tickAsync(1000);

      const result = await promise;
      assertEquals(result, "success");
      assertEquals(attempts, 2);
    });

    it("handles synchronous functions", async () => {
      using time = new FakeTime();
      let attempts = 0;

      const promise = retry(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error("Temporary failure");
        }
        return 42;
      }, { maxAttempts: 2 });

      await time.tickAsync(1000);

      const result = await promise;
      assertEquals(result, 42);
      assertEquals(attempts, 2);
    });

    it("handles async functions", async () => {
      using time = new FakeTime();
      let attempts = 0;

      const promise = retry(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error("Temporary failure");
        }
        return Promise.resolve("async success");
      }, { maxAttempts: 2 });

      await time.tickAsync(1000);

      const result = await promise;
      assertEquals(result, "async success");
      assertEquals(attempts, 2);
    });
  });

  describe("permanent failures", () => {
    it("throws error when all attempts fail", async () => {
      using time = new FakeTime();
      let attempts = 0;

      const promise = retry(() => {
        attempts++;
        throw new Error("Persistent failure");
      }, { maxAttempts: 3 });

      // First attempt fails, wait 1s
      await time.tickAsync(1000);
      // Second attempt fails, wait 2s
      await time.tickAsync(2000);

      await assertRejects(
        () => promise,
        Error,
        "Persistent failure",
      );

      assertEquals(attempts, 3);
    });
  });

  describe("delays", () => {
    it("linear backoff timing", async () => {
      using time = new FakeTime();
      let attempts = 0;

      const promise = retry(() => {
        attempts++;
        throw new Error("Always fails");
      }, { maxAttempts: 3, backoff: "linear" });

      // First attempt fails immediately
      assertEquals(attempts, 1);

      // Advance 1 second - triggers second attempt
      await time.tickAsync(1000);
      assertEquals(attempts, 2);

      // Advance 2 seconds - triggers third attempt
      await time.tickAsync(2000);
      assertEquals(attempts, 3);

      await assertRejects(
        () => promise,
        Error,
        "Always fails",
      );
    });

    it("exponential backoff timing", async () => {
      using time = new FakeTime();
      let attempts = 0;

      const promise = retry(() => {
        attempts++;
        throw new Error("Always fails");
      }, { maxAttempts: 4, backoff: "exponential" });

      // First attempt fails immediately
      assertEquals(attempts, 1);

      // Exponential: 2^0 * 1000 = 1s
      await time.tickAsync(1000);
      assertEquals(attempts, 2);

      // Exponential: 2^1 * 1000 = 2s
      await time.tickAsync(2000);
      assertEquals(attempts, 3);

      // Exponential: 2^2 * 1000 = 4s
      await time.tickAsync(4000);
      assertEquals(attempts, 4);

      await assertRejects(
        () => promise,
        Error,
        "Always fails",
      );
    });

    it("applies linear backoff when backoff not specified", async () => {
      using time = new FakeTime();
      let attempts = 0;

      const promise = retry(() => {
        attempts++;
        throw new Error("Always fails");
      }, { maxAttempts: 3 });

      // First attempt fails immediately
      assertEquals(attempts, 1);

      // Linear backoff: wait 1s
      await time.tickAsync(1000);
      assertEquals(attempts, 2);

      // Linear backoff: wait 2s
      await time.tickAsync(2000);
      assertEquals(attempts, 3);

      await assertRejects(
        () => promise,
        Error,
        "Always fails",
      );
    });
  });

  describe("limits", () => {
    it("default maxAttempts is 1 (no retry)", async () => {
      let attempts = 0;
      await assertRejects(async () => {
        await retry(() => {
          attempts++;
          throw new Error("Failure");
        });
      });

      assertEquals(attempts, 1);
    });
  });

  describe("error handling", () => {
    it("can be aborted via signal", async () => {
      using time = new FakeTime();
      const controller = new AbortController();
      let attempts = 0;

      const promise = retry(() => {
        attempts++;
        throw new Error("Always fails");
      }, { maxAttempts: 5, backoff: "linear", signal: controller.signal });

      // First attempt fails
      assertEquals(attempts, 1);

      // Abort during the delay before second attempt
      await time.tickAsync(500);
      controller.abort();

      await assertRejects(
        () => promise,
        Error, // AbortError from delay
      );

      // Should stop early due to abort (only 1 attempt completed)
      assertEquals(attempts, 1);
    });

    it("converts non-Error throws to Error", async () => {
      using time = new FakeTime();

      const promise = retry(() => {
        throw "string error";
      }, { maxAttempts: 2 });

      await time.tickAsync(1000);

      await assertRejects(
        () => promise,
        Error,
        "string error",
      );
    });

    it("preserves original Error instance", async () => {
      using time = new FakeTime();

      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "CustomError";
        }
      }

      const promise = retry(() => {
        throw new CustomError("Custom failure");
      }, { maxAttempts: 2 });

      await time.tickAsync(1000);

      let caughtError: Error | undefined;
      try {
        await promise;
      } catch (error) {
        caughtError = error as Error;
      }

      assertEquals(caughtError?.name, "CustomError");
      assertEquals(caughtError?.message, "Custom failure");
    });

    it("returns value immediately on success without delay", async () => {
      const startTime = Date.now();

      const result = await retry(() => {
        return "immediate success";
      }, { maxAttempts: 5, backoff: "exponential" });

      const duration = Date.now() - startTime;
      assertEquals(result, "immediate success");
      assertEquals(duration < 100, true);
    });
  });
});
