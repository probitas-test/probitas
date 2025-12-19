import { assertEquals, assertRejects } from "@std/assert";
import { FakeTime } from "@std/testing/time";
import { retry } from "./retry.ts";

Deno.test("retry configuration succeeds on first attempt", async () => {
  let attempts = 0;
  const result = await retry(() => {
    attempts++;
    return "success";
  });

  assertEquals(result, "success");
  assertEquals(attempts, 1);
});

Deno.test("retry transient failures succeeds on second attempt", async () => {
  using time = new FakeTime();
  let attempts = 0;

  const promise = retry(() => {
    attempts++;
    if (attempts < 2) {
      throw new Error("Temporary failure");
    }
    return Promise.resolve("success");
  }, { maxAttempts: 3 });

  // First attempt fails, wait 1s
  await time.tickAsync(1000);

  const result = await promise;
  assertEquals(result, "success");
  assertEquals(attempts, 2);
});

Deno.test("retry permanent failures throws error when all attempts fail", async () => {
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

Deno.test("retry delays linear backoff timing", async () => {
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

Deno.test("retry delays exponential backoff timing", async () => {
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

Deno.test("retry error handling can be aborted via signal", async () => {
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
