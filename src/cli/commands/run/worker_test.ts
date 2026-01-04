/**
 * Tests for worker implementation
 *
 * Tests the Worker that executes scenarios in isolation.
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { sandbox } from "@lambdalisue/sandbox";
import outdent from "@cspotcode/outdent";
import type { WorkerInput, WorkerOutput } from "./protocol.ts";

describe("worker", () => {
  describe("basic execution", () => {
    it("executes a simple scenario successfully", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("test.probitas.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Test Scenario",
            tags: [],
            steps: [
              {
                kind: "step",
                name: "Test Step",
                fn: () => ({ result: "success" }),
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" }
              }
            ],
            origin: { path: "${scenarioPath}" }
          };
        `,
      );

      const workerUrl = new URL("./worker.ts", import.meta.url);
      const worker = new Worker(workerUrl, { type: "module" });

      try {
        // Wait for ready signal
        await new Promise<void>((resolve) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            if (event.data.type === "ready") {
              resolve();
            }
          };
        });

        // Collect all messages
        const messages: WorkerOutput[] = [];
        const resultPromise = new Promise<void>((resolve, reject) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            messages.push(event.data);
            if (
              event.data.type === "result" || event.data.type === "error"
            ) {
              resolve();
            }
          };
          worker.onerror = (event) => {
            reject(new Error(event.message));
          };
        });

        // Send run message
        const message: WorkerInput = {
          type: "run",
          filePaths: [scenarioPath],
          selectors: [],
          maxConcurrency: 0,
          maxFailures: 0,
          timeout: 0,
          logLevel: "fatal",
        };
        worker.postMessage(message);

        // Wait for result
        await resultPromise;

        // Verify messages
        const runStart = messages.find((m) => m.type === "run_start");
        const scenarioStart = messages.find((m) => m.type === "scenario_start");
        const stepStart = messages.find((m) => m.type === "step_start");
        const stepEnd = messages.find((m) => m.type === "step_end");
        const scenarioEnd = messages.find((m) => m.type === "scenario_end");
        const runEnd = messages.find((m) => m.type === "run_end");
        const result = messages.find((m) => m.type === "result");

        assertEquals(!!runStart, true);
        assertEquals(!!scenarioStart, true);
        assertEquals(!!stepStart, true);
        assertEquals(!!stepEnd, true);
        assertEquals(!!scenarioEnd, true);
        assertEquals(!!runEnd, true);
        assertEquals(!!result, true);

        if (result?.type === "result") {
          assertEquals(result.result.passed, 1);
          assertEquals(result.result.failed, 0);
          assertEquals(result.result.total, 1);
        }
      } finally {
        worker.terminate();
      }
    });

    it("handles scenario failures", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("test.probitas.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Failing Scenario",
            tags: [],
            steps: [
              {
                kind: "step",
                name: "Failing Step",
                fn: () => { throw new Error("Test error"); },
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" }
              }
            ],
            origin: { path: "${scenarioPath}" }
          };
        `,
      );

      const workerUrl = new URL("./worker.ts", import.meta.url);
      const worker = new Worker(workerUrl, { type: "module" });

      try {
        await new Promise<void>((resolve) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            if (event.data.type === "ready") {
              resolve();
            }
          };
        });

        const messages: WorkerOutput[] = [];
        const resultPromise = new Promise<void>((resolve, reject) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            messages.push(event.data);
            if (
              event.data.type === "result" || event.data.type === "error"
            ) {
              resolve();
            }
          };
          worker.onerror = (event) => {
            reject(new Error(event.message));
          };
        });

        const message: WorkerInput = {
          type: "run",
          filePaths: [scenarioPath],
          selectors: [],
          maxConcurrency: 0,
          maxFailures: 0,
          timeout: 0,
          logLevel: "fatal",
        };
        worker.postMessage(message);

        await resultPromise;

        const result = messages.find((m) => m.type === "result");
        assertEquals(!!result, true);

        if (result?.type === "result") {
          assertEquals(result.result.passed, 0);
          assertEquals(result.result.failed, 1);
          assertEquals(result.result.total, 1);
        }
      } finally {
        worker.terminate();
      }
    });
  });

  describe("abort handling", () => {
    it("gracefully aborts execution when abort message is sent", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("test.probitas.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Long Running Scenario",
            tags: [],
            steps: [
              {
                kind: "step",
                name: "Long Step",
                fn: async (ctx) => {
                  for (let i = 0; i < 100; i++) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    if (ctx.signal?.aborted) {
                      throw new Error("Aborted");
                    }
                  }
                  return { result: "success" };
                },
                timeout: 15000,
                retry: { maxAttempts: 1, backoff: "linear" }
              }
            ],
            origin: { path: "${scenarioPath}" }
          };
        `,
      );

      const workerUrl = new URL("./worker.ts", import.meta.url);
      const worker = new Worker(workerUrl, { type: "module" });

      try {
        await new Promise<void>((resolve) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            if (event.data.type === "ready") {
              resolve();
            }
          };
        });

        const messages: WorkerOutput[] = [];
        const resultPromise = new Promise<void>((resolve, reject) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            messages.push(event.data);
            if (
              event.data.type === "result" || event.data.type === "error"
            ) {
              resolve();
            }
          };
          worker.onerror = (event) => {
            reject(new Error(event.message));
          };
        });

        const message: WorkerInput = {
          type: "run",
          filePaths: [scenarioPath],
          selectors: [],
          maxConcurrency: 0,
          maxFailures: 0,
          timeout: 0,
          logLevel: "fatal",
        };
        worker.postMessage(message);

        // Send abort after a short delay
        setTimeout(() => {
          worker.postMessage({ type: "abort" } satisfies WorkerInput);
        }, 200);

        await resultPromise;

        const result = messages.find((m) => m.type === "result");
        assertEquals(!!result, true);

        if (result?.type === "result") {
          // Scenario should fail due to abort
          assertEquals(result.result.failed, 1);
        }
      } finally {
        worker.terminate();
      }
    });
  });

  describe("timeout handling", () => {
    it("respects timeout configuration", async () => {
      await using sbox = await sandbox();

      const scenarioPath = sbox.resolve("test.probitas.ts");
      await Deno.writeTextFile(
        scenarioPath,
        outdent`
          export default {
            name: "Timeout Test",
            tags: [],
            steps: [
              {
                kind: "step",
                name: "Long Step",
                fn: async () => {
                  await new Promise((resolve) => setTimeout(resolve, 10000));
                  return { result: "success" };
                },
                timeout: 15000,
                retry: { maxAttempts: 1, backoff: "linear" }
              }
            ],
            origin: { path: "${scenarioPath}" }
          };
        `,
      );

      const workerUrl = new URL("./worker.ts", import.meta.url);
      const worker = new Worker(workerUrl, { type: "module" });

      try {
        await new Promise<void>((resolve) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            if (event.data.type === "ready") {
              resolve();
            }
          };
        });

        const messages: WorkerOutput[] = [];
        const resultPromise = new Promise<void>((resolve, reject) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            messages.push(event.data);
            if (
              event.data.type === "result" || event.data.type === "error"
            ) {
              resolve();
            }
          };
          worker.onerror = (event) => {
            reject(new Error(event.message));
          };
        });

        const message: WorkerInput = {
          type: "run",
          filePaths: [scenarioPath],
          selectors: [],
          maxConcurrency: 0,
          maxFailures: 0,
          timeout: 100, // 100ms timeout - should abort
          logLevel: "fatal",
        };
        worker.postMessage(message);

        await resultPromise;

        const result = messages.find((m) => m.type === "result");
        assertEquals(!!result, true);

        if (result?.type === "result") {
          // Should fail due to timeout
          assertEquals(result.result.failed, 1);
        }
      } finally {
        worker.terminate();
      }
    });
  });

  describe("multiple scenarios", () => {
    it("executes scenarios from multiple files", async () => {
      await using sbox = await sandbox();

      const scenarioPath1 = sbox.resolve("test1.probitas.ts");
      const scenarioPath2 = sbox.resolve("test2.probitas.ts");

      await Deno.writeTextFile(
        scenarioPath1,
        outdent`
          export default {
            name: "File 1 Scenario",
            tags: ["file1"],
            steps: [
              {
                kind: "step",
                name: "Step 1",
                fn: () => ({ result: "file1" }),
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" }
              }
            ],
            origin: { path: "${scenarioPath1}" }
          };
        `,
      );

      await Deno.writeTextFile(
        scenarioPath2,
        outdent`
          export default {
            name: "File 2 Scenario",
            tags: ["file2"],
            steps: [
              {
                kind: "step",
                name: "Step 2",
                fn: () => ({ result: "file2" }),
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" }
              }
            ],
            origin: { path: "${scenarioPath2}" }
          };
        `,
      );

      const workerUrl = new URL("./worker.ts", import.meta.url);
      const worker = new Worker(workerUrl, { type: "module" });

      try {
        await new Promise<void>((resolve) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            if (event.data.type === "ready") {
              resolve();
            }
          };
        });

        const messages: WorkerOutput[] = [];
        const resultPromise = new Promise<void>((resolve, reject) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            messages.push(event.data);
            if (
              event.data.type === "result" || event.data.type === "error"
            ) {
              resolve();
            }
          };
          worker.onerror = (event) => {
            reject(new Error(event.message));
          };
        });

        const message: WorkerInput = {
          type: "run",
          filePaths: [scenarioPath1, scenarioPath2],
          selectors: [],
          maxConcurrency: 0,
          maxFailures: 0,
          timeout: 0,
          logLevel: "fatal",
        };
        worker.postMessage(message);

        await resultPromise;

        const result = messages.find((m) => m.type === "result");
        assertEquals(!!result, true);

        if (result?.type === "result") {
          assertEquals(result.result.passed, 2);
          assertEquals(result.result.failed, 0);
          assertEquals(result.result.total, 2);
        }
      } finally {
        worker.terminate();
      }
    });
  });

  describe("selector filtering", () => {
    it("filters scenarios by tag selector", async () => {
      await using sbox = await sandbox();

      const includedPath = sbox.resolve("included.probitas.ts");
      const excludedPath = sbox.resolve("excluded.probitas.ts");

      await Deno.writeTextFile(
        includedPath,
        outdent`
          export default {
            name: "Included Scenario",
            tags: ["include-me"],
            steps: [
              {
                kind: "step",
                name: "Step 1",
                fn: () => ({ result: "included" }),
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" }
              }
            ],
            origin: { path: "${includedPath}" }
          };
        `,
      );

      await Deno.writeTextFile(
        excludedPath,
        outdent`
          export default {
            name: "Excluded Scenario",
            tags: ["exclude-me"],
            steps: [
              {
                kind: "step",
                name: "Step 2",
                fn: () => ({ result: "excluded" }),
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" }
              }
            ],
            origin: { path: "${excludedPath}" }
          };
        `,
      );

      const workerUrl = new URL("./worker.ts", import.meta.url);
      const worker = new Worker(workerUrl, { type: "module" });

      try {
        await new Promise<void>((resolve) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            if (event.data.type === "ready") {
              resolve();
            }
          };
        });

        const messages: WorkerOutput[] = [];
        const resultPromise = new Promise<void>((resolve, reject) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            messages.push(event.data);
            if (
              event.data.type === "result" || event.data.type === "error"
            ) {
              resolve();
            }
          };
          worker.onerror = (event) => {
            reject(new Error(event.message));
          };
        });

        const message: WorkerInput = {
          type: "run",
          filePaths: [includedPath, excludedPath],
          selectors: ["tag:include-me"],
          maxConcurrency: 0,
          maxFailures: 0,
          timeout: 0,
          logLevel: "fatal",
        };
        worker.postMessage(message);

        await resultPromise;

        const result = messages.find((m) => m.type === "result");
        assertEquals(!!result, true);

        if (result?.type === "result") {
          // Only the scenario with "include-me" tag should run
          assertEquals(result.result.passed, 1);
          assertEquals(result.result.failed, 0);
          assertEquals(result.result.total, 1);
        }

        // Verify the correct scenario was executed
        const scenarioStarts = messages.filter((m) =>
          m.type === "scenario_start"
        );
        assertEquals(scenarioStarts.length, 1);
        if (scenarioStarts[0]?.type === "scenario_start") {
          assertEquals(scenarioStarts[0].scenario.name, "Included Scenario");
        }
      } finally {
        worker.terminate();
      }
    });
  });

  describe("maxFailures handling", () => {
    it("stops execution after reaching maxFailures limit", async () => {
      await using sbox = await sandbox();

      const failPath1 = sbox.resolve("fail1.probitas.ts");
      const failPath2 = sbox.resolve("fail2.probitas.ts");
      const failPath3 = sbox.resolve("fail3.probitas.ts");

      await Deno.writeTextFile(
        failPath1,
        outdent`
          export default {
            name: "Fail 1",
            tags: [],
            steps: [
              {
                kind: "step",
                name: "Failing Step 1",
                fn: () => { throw new Error("Fail 1"); },
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" }
              }
            ],
            origin: { path: "${failPath1}" }
          };
        `,
      );

      await Deno.writeTextFile(
        failPath2,
        outdent`
          export default {
            name: "Fail 2",
            tags: [],
            steps: [
              {
                kind: "step",
                name: "Failing Step 2",
                fn: () => { throw new Error("Fail 2"); },
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" }
              }
            ],
            origin: { path: "${failPath2}" }
          };
        `,
      );

      await Deno.writeTextFile(
        failPath3,
        outdent`
          export default {
            name: "Fail 3",
            tags: [],
            steps: [
              {
                kind: "step",
                name: "Failing Step 3",
                fn: () => { throw new Error("Fail 3"); },
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" }
              }
            ],
            origin: { path: "${failPath3}" }
          };
        `,
      );

      const workerUrl = new URL("./worker.ts", import.meta.url);
      const worker = new Worker(workerUrl, { type: "module" });

      try {
        await new Promise<void>((resolve) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            if (event.data.type === "ready") {
              resolve();
            }
          };
        });

        const messages: WorkerOutput[] = [];
        const resultPromise = new Promise<void>((resolve, reject) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            messages.push(event.data);
            if (
              event.data.type === "result" || event.data.type === "error"
            ) {
              resolve();
            }
          };
          worker.onerror = (event) => {
            reject(new Error(event.message));
          };
        });

        const message: WorkerInput = {
          type: "run",
          filePaths: [failPath1, failPath2, failPath3],
          selectors: [],
          maxConcurrency: 1, // Sequential to ensure predictable order
          maxFailures: 2, // Stop after 2 failures
          timeout: 0,
          logLevel: "fatal",
        };
        worker.postMessage(message);

        await resultPromise;

        const result = messages.find((m) => m.type === "result");
        assertEquals(!!result, true);

        if (result?.type === "result") {
          // Should stop after 2 failures, not run all 3
          assertEquals(result.result.failed, 2);
          assertEquals(result.result.total, 3);
          // The third scenario should be skipped
          assertEquals(result.result.skipped, 1);
        }
      } finally {
        worker.terminate();
      }
    });
  });

  describe("concurrency control", () => {
    it("respects maxConcurrency limit", async () => {
      await using sbox = await sandbox();

      // Create scenarios that track execution timing
      const scenarioPath1 = sbox.resolve("scenario1.probitas.ts");
      const scenarioPath2 = sbox.resolve("scenario2.probitas.ts");

      await Deno.writeTextFile(
        scenarioPath1,
        outdent`
          export default {
            name: "Scenario 1",
            tags: [],
            steps: [
              {
                kind: "step",
                name: "Step 1",
                fn: async () => {
                  await new Promise(r => setTimeout(r, 50));
                  return { result: "done1" };
                },
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" }
              }
            ],
            origin: { path: "${scenarioPath1}" }
          };
        `,
      );

      await Deno.writeTextFile(
        scenarioPath2,
        outdent`
          export default {
            name: "Scenario 2",
            tags: [],
            steps: [
              {
                kind: "step",
                name: "Step 2",
                fn: async () => {
                  await new Promise(r => setTimeout(r, 50));
                  return { result: "done2" };
                },
                timeout: 5000,
                retry: { maxAttempts: 1, backoff: "linear" }
              }
            ],
            origin: { path: "${scenarioPath2}" }
          };
        `,
      );

      const workerUrl = new URL("./worker.ts", import.meta.url);
      const worker = new Worker(workerUrl, { type: "module" });

      try {
        await new Promise<void>((resolve) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            if (event.data.type === "ready") {
              resolve();
            }
          };
        });

        const messages: WorkerOutput[] = [];
        const resultPromise = new Promise<void>((resolve, reject) => {
          worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
            messages.push(event.data);
            if (
              event.data.type === "result" || event.data.type === "error"
            ) {
              resolve();
            }
          };
          worker.onerror = (event) => {
            reject(new Error(event.message));
          };
        });

        const message: WorkerInput = {
          type: "run",
          filePaths: [scenarioPath1, scenarioPath2],
          selectors: [],
          maxConcurrency: 1, // Force sequential execution
          maxFailures: 0,
          timeout: 0,
          logLevel: "fatal",
        };
        worker.postMessage(message);

        await resultPromise;

        const result = messages.find((m) => m.type === "result");
        assertEquals(!!result, true);

        if (result?.type === "result") {
          assertEquals(result.result.passed, 2);
          assertEquals(result.result.failed, 0);
          assertEquals(result.result.total, 2);
        }

        // Verify scenarios ran sequentially by checking message order
        const scenarioStarts = messages.filter((m) =>
          m.type === "scenario_start"
        );
        const scenarioEnds = messages.filter((m) => m.type === "scenario_end");
        assertEquals(scenarioStarts.length, 2);
        assertEquals(scenarioEnds.length, 2);

        // With maxConcurrency=1, first scenario should end before second starts.
        // Note: We verify via message order, which is a reasonable proxy for
        // execution order in a single-threaded worker where messages are sent
        // synchronously from reporter callbacks.
        const startIndices = scenarioStarts.map((_, i) =>
          messages.findIndex((m) => m === scenarioStarts[i])
        );
        const endIndices = scenarioEnds.map((_, i) =>
          messages.findIndex((m) => m === scenarioEnds[i])
        );

        // First end should come before second start for sequential execution
        assertEquals(
          endIndices[0] < startIndices[1],
          true,
          "Expected sequential execution: first scenario should end before second starts",
        );
      } finally {
        worker.terminate();
      }
    });
  });
});
