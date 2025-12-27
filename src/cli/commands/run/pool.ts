/**
 * Worker pool for parallel scenario execution
 *
 * @module
 */

import { getLogger } from "@logtape/logtape";
import type { ScenarioResult, StepResult } from "@probitas/runner";
import type { ScenarioMetadata, StepMetadata } from "@probitas/core";
import {
  deserializeError,
  deserializeScenarioResult,
  deserializeStepResult,
  type WorkerInput,
  type WorkerOutput,
  type WorkerResultOutput,
  type WorkerRunInput,
} from "./protocol.ts";

const logger = getLogger(["probitas", "cli", "run", "pool"]);

/**
 * Event callbacks for progress reporting
 *
 * These match the Reporter interface signatures using serializable Metadata types.
 */
export interface WorkerPoolEventCallbacks {
  onScenarioStart?(scenario: ScenarioMetadata): void | Promise<void>;
  onScenarioEnd?(
    scenario: ScenarioMetadata,
    result: ScenarioResult,
  ): void | Promise<void>;
  onStepStart?(
    scenario: ScenarioMetadata,
    step: StepMetadata,
  ): void | Promise<void>;
  onStepEnd?(
    scenario: ScenarioMetadata,
    step: StepMetadata,
    result: StepResult,
  ): void | Promise<void>;
}

/**
 * Pending task waiting for a worker
 */
interface PendingTask {
  readonly input: WorkerRunInput;
  readonly callbacks?: WorkerPoolEventCallbacks;
  readonly resolve: (result: WorkerResultOutput["result"]) => void;
  readonly reject: (error: Error) => void;
}

/**
 * Worker wrapper with state tracking
 */
interface PoolWorker {
  readonly worker: Worker;
  /** Current task ID being executed, or undefined if idle */
  currentTaskId?: string;
}

/**
 * Pool of workers for executing scenarios in parallel
 *
 * Workers are created on-demand up to maxSize, then reused.
 * Each worker executes one scenario at a time in isolation.
 *
 * @example
 * ```ts
 * const pool = new WorkerPool(4);
 *
 * const results = await Promise.all([
 *   pool.execute({ type: "run", taskId: "1", filePath: "a.ts", scenarioIndex: 0 }),
 *   pool.execute({ type: "run", taskId: "2", filePath: "b.ts", scenarioIndex: 0 }),
 * ]);
 *
 * await pool.terminate();
 * ```
 */
export class WorkerPool implements AsyncDisposable {
  readonly #maxSize: number;
  readonly #workers: PoolWorker[] = [];
  readonly #pendingTasks: PendingTask[] = [];
  readonly #taskResolvers = new Map<
    string,
    {
      callbacks?: WorkerPoolEventCallbacks;
      resolve: (result: WorkerResultOutput["result"]) => void;
      reject: (error: Error) => void;
    }
  >();

  #terminated = false;

  /**
   * Create a new worker pool
   *
   * @param maxSize - Maximum number of concurrent workers (0 = unlimited)
   */
  constructor(maxSize: number = 0) {
    this.#maxSize = maxSize > 0 ? maxSize : navigator.hardwareConcurrency || 4;
    logger.debug("WorkerPool created", { maxSize: this.#maxSize });
  }

  /**
   * Execute a scenario in a worker
   *
   * @param input - Run input with file path and scenario index
   * @param callbacks - Optional callbacks for progress events
   * @returns Scenario execution result
   */
  execute(
    input: WorkerRunInput,
    callbacks?: WorkerPoolEventCallbacks,
  ): Promise<WorkerResultOutput["result"]> {
    if (this.#terminated) {
      throw new Error("WorkerPool has been terminated");
    }

    return new Promise((resolve, reject) => {
      const task: PendingTask = { input, callbacks, resolve, reject };

      // Try to find an idle worker
      const idleWorker = this.#workers.find((w) => !w.currentTaskId);
      if (idleWorker) {
        this.#assignTask(idleWorker, task);
        return;
      }

      // Create new worker if under limit
      if (this.#workers.length < this.#maxSize) {
        const poolWorker = this.#createWorker();
        this.#assignTask(poolWorker, task);
        return;
      }

      // Queue task for later
      logger.debug("Task queued, waiting for worker", { taskId: input.taskId });
      this.#pendingTasks.push(task);
    });
  }

  /**
   * Create a new worker
   */
  #createWorker(): PoolWorker {
    logger.debug("Creating new worker", { workerCount: this.#workers.length });

    const workerUrl = new URL("./worker.ts", import.meta.url);
    const worker = new Worker(workerUrl, {
      type: "module",
    });

    const poolWorker: PoolWorker = { worker };
    this.#workers.push(poolWorker);

    worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
      this.#handleWorkerMessage(poolWorker, event.data);
    };

    worker.onerror = (event) => {
      logger.error("Worker error", { error: event.message });
      this.#handleWorkerError(poolWorker, new Error(event.message));
    };

    return poolWorker;
  }

  /**
   * Assign a task to a worker
   */
  #assignTask(poolWorker: PoolWorker, task: PendingTask): void {
    const { input, callbacks, resolve, reject } = task;

    poolWorker.currentTaskId = input.taskId;
    this.#taskResolvers.set(input.taskId, { callbacks, resolve, reject });

    logger.debug("Assigning task to worker", {
      taskId: input.taskId,
      filePath: input.filePath,
      scenarioIndex: input.scenarioIndex,
    });

    const message: WorkerInput = input;
    poolWorker.worker.postMessage(message);
  }

  /**
   * Handle message from worker
   */
  #handleWorkerMessage(poolWorker: PoolWorker, output: WorkerOutput): void {
    switch (output.type) {
      case "ready":
        logger.debug("Worker ready");
        break;

      case "result": {
        const resolver = this.#taskResolvers.get(output.taskId);
        if (resolver) {
          this.#taskResolvers.delete(output.taskId);
          resolver.resolve(deserializeScenarioResult(output.result));
        }
        this.#onTaskComplete(poolWorker);
        break;
      }

      case "error": {
        const resolver = this.#taskResolvers.get(output.taskId);
        if (resolver) {
          this.#taskResolvers.delete(output.taskId);
          const error = deserializeError(output.error);
          resolver.reject(error);
        }
        this.#onTaskComplete(poolWorker);
        break;
      }

      case "scenario_start": {
        const resolver = this.#taskResolvers.get(output.taskId);
        resolver?.callbacks?.onScenarioStart?.(output.scenario);
        break;
      }

      case "scenario_end": {
        const resolver = this.#taskResolvers.get(output.taskId);
        resolver?.callbacks?.onScenarioEnd?.(
          output.scenario,
          deserializeScenarioResult(output.result),
        );
        break;
      }

      case "step_start": {
        const resolver = this.#taskResolvers.get(output.taskId);
        resolver?.callbacks?.onStepStart?.(output.scenario, output.step);
        break;
      }

      case "step_end": {
        const resolver = this.#taskResolvers.get(output.taskId);
        resolver?.callbacks?.onStepEnd?.(
          output.scenario,
          output.step,
          deserializeStepResult(output.result),
        );
        break;
      }
    }
  }

  /**
   * Handle worker error
   */
  #handleWorkerError(poolWorker: PoolWorker, error: Error): void {
    const taskId = poolWorker.currentTaskId;
    if (taskId) {
      const resolver = this.#taskResolvers.get(taskId);
      if (resolver) {
        this.#taskResolvers.delete(taskId);
        resolver.reject(error);
      }
    }
    this.#onTaskComplete(poolWorker);
  }

  /**
   * Handle task completion - assign next pending task or mark worker idle
   */
  #onTaskComplete(poolWorker: PoolWorker): void {
    poolWorker.currentTaskId = undefined;

    // Assign next pending task if any
    const nextTask = this.#pendingTasks.shift();
    if (nextTask) {
      this.#assignTask(poolWorker, nextTask);
    }
  }

  /**
   * Terminate all workers
   */
  terminate(): void {
    if (this.#terminated) return;
    this.#terminated = true;

    logger.debug("Terminating worker pool", {
      workerCount: this.#workers.length,
    });

    // Reject all pending tasks
    for (const task of this.#pendingTasks) {
      task.reject(new Error("WorkerPool terminated"));
    }
    this.#pendingTasks.length = 0;

    // Terminate all workers
    for (const { worker } of this.#workers) {
      worker.postMessage({ type: "terminate" } satisfies WorkerInput);
      worker.terminate();
    }
    this.#workers.length = 0;
  }

  /**
   * AsyncDisposable implementation
   */
  [Symbol.asyncDispose](): Promise<void> {
    this.terminate();
    return Promise.resolve();
  }
}
