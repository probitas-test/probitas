/**
 * Subprocess pool for parallel scenario execution
 *
 * @module
 */

import { TextLineStream } from "@std/streams";
import { getLogger } from "@logtape/logtape";
import type { ScenarioResult, StepResult } from "@probitas/runner";
import type { ScenarioMetadata, StepMetadata } from "@probitas/core";
import {
  deserializeError,
  deserializeScenarioResult,
  deserializeStepResult,
  type RunnerInput,
  type RunnerOutput,
  type ResultOutput,
  type RunInput,
} from "./templates/protocol.ts";
import { TemplateProcessor } from "./template_processor.ts";

const logger = getLogger(["probitas", "cli", "run", "subprocess-pool"]);

/**
 * Transform stream that appends newline to each chunk (inverse of TextLineStream)
 *
 * TextLineStream splits input by lines, this stream joins lines with newlines.
 */
class TextLineWriter extends TransformStream<string, string> {
  constructor() {
    super({
      transform(chunk, controller) {
        controller.enqueue(chunk + "\n");
      },
    });
  }
}

/**
 * Event callbacks for progress reporting
 *
 * These match the Reporter interface signatures using serializable Metadata types.
 */
export interface RunnerPoolEventCallbacks {
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
 * Pending task waiting for a runner
 */
interface PendingTask {
  readonly input: RunInput;
  readonly callbacks?: RunnerPoolEventCallbacks;
  readonly resolve: (result: ResultOutput["result"]) => void;
  readonly reject: (error: Error) => void;
}

/**
 * Runner wrapper with state tracking
 *
 * Design rationale:
 * - stdin/stdout are stored as Writer/Reader because getWriter()/getReader() lock the stream
 *   and can only be called once. We need to reuse them across multiple task executions.
 * - stdin uses TextLineWriter (inverse of TextLineStream) to automatically append newlines,
 *   maintaining symmetry with stdout's TextLineStream that splits by lines.
 * - Both are string-typed since we're exclusively sending/receiving line-delimited JSON.
 * - statusPromise is stored instead of the full process object to reduce coupling - we only
 *   need to wait for process exit during cleanup, not interact with the process otherwise.
 */
interface PoolRunner {
  readonly stdin: WritableStreamDefaultWriter<string>;
  readonly stdout: ReadableStreamDefaultReader<string>;
  readonly statusPromise: Promise<Deno.CommandStatus>;
  /** Current task ID being executed, or undefined if idle */
  currentTaskId?: string;
  /** Whether this subprocess is ready to accept tasks */
  ready: boolean;
  /** Promise that resolves when subprocess is ready */
  readyPromise: Promise<void>;
  /** Resolver for ready promise */
  resolveReady?: () => void;
}

/**
 * Pool of runners for executing scenarios in parallel
 *
 * Runners are created on-demand up to maxSize, then reused.
 * Each runner executes one scenario at a time in isolation.
 *
 * @example
 * ```ts
 * await using pool = new RunnerPool(4, ["--no-lock"]);
 *
 * const results = await Promise.all([
 *   pool.execute({ type: "run", taskId: "1", filePath: "a.ts", scenarioIndex: 0 }),
 *   pool.execute({ type: "run", taskId: "2", filePath: "b.ts", scenarioIndex: 0 }),
 * ]);
 * ```
 */
export class RunnerPool implements AsyncDisposable {
  readonly #maxSize: number;
  readonly #denoArgs: string[];
  readonly #runners: PoolRunner[] = [];
  readonly #pendingTasks: PendingTask[] = [];
  readonly #taskResolvers = new Map<
    string,
    {
      callbacks?: RunnerPoolEventCallbacks;
      resolve: (result: ResultOutput["result"]) => void;
      reject: (error: Error) => void;
    }
  >();

  #terminated = false;
  #templateProcessor: TemplateProcessor;
  #processedRunnerPath?: string; // Cached processed runner path

  /**
   * Create a new runner pool
   *
   * @param maxSize - Maximum number of concurrent runners (0 = unlimited)
   * @param denoArgs - Additional arguments to pass to deno run
   */
  constructor(maxSize: number = 0, denoArgs: string[] = []) {
    this.#maxSize = maxSize > 0 ? maxSize : navigator.hardwareConcurrency || 4;
    this.#denoArgs = denoArgs;
    this.#templateProcessor = new TemplateProcessor();
    logger.debug("RunnerPool created", {
      maxSize: this.#maxSize,
      denoArgs: this.#denoArgs,
    });
  }

  /**
   * Execute a scenario in a runner
   *
   * @param input - Run input with file path and scenario index
   * @param callbacks - Optional callbacks for progress events
   * @returns Scenario execution result
   */
  execute(
    input: RunInput,
    callbacks?: RunnerPoolEventCallbacks,
  ): Promise<ResultOutput["result"]> {
    if (this.#terminated) {
      throw new Error("RunnerPool has been terminated");
    }

    return new Promise((resolve, reject) => {
      const task: PendingTask = { input, callbacks, resolve, reject };

      // Try to find an idle runner
      const idleRunner = this.#runners.find(
        (r) => !r.currentTaskId && r.ready,
      );
      if (idleRunner) {
        this.#assignTask(idleRunner, task);
        return;
      }

      // Create new runner if under limit
      if (this.#runners.length < this.#maxSize) {
        void this.#createRunner().then((runner) => {
          this.#assignTask(runner, task);
        });
        return;
      }

      // Queue task for later
      logger.debug("Task queued, waiting for runner", {
        taskId: input.taskId,
      });
      this.#pendingTasks.push(task);
    });
  }

  /**
   * Create a new runner subprocess
   */
  async #createRunner(): Promise<PoolRunner> {
    logger.debug("Creating new runner", {
      runnerCount: this.#runners.length,
    });

    // Get processed runner path (templates processed on first call)
    if (!this.#processedRunnerPath) {
      this.#processedRunnerPath = await this.#templateProcessor
        .getEntryPointPath("runner.ts");
    }

    const args = [
      "run",
      "--allow-all", // Same permissions as Worker
      "--unstable-kv", // Enable Deno KV by default
      ...this.#denoArgs, // User-specified deno options
      this.#processedRunnerPath, // Processed runner.ts path
    ];

    logger.debug("Spawning runner subprocess", {
      command: "deno",
      args,
    });

    const command = new Deno.Command("deno", {
      args,
      stdin: "piped",
      stdout: "piped",
      stderr: "inherit", // stderr goes to parent process
    });

    const process = command.spawn();

    const stdin = process.stdin
      .pipeThrough(new TextLineWriter())
      .pipeThrough(new TextEncoderStream())
      .getWriter();
    const stdout = process.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
      .getReader();

    // Create ready promise with timeout
    let resolveReady: (() => void) | undefined;
    const readyPromise = Promise.race([
      new Promise<void>((resolve) => {
        resolveReady = resolve;
      }),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Runner ready timeout")), 5000)
      ),
    ]);

    const runner: PoolRunner = {
      stdin,
      stdout,
      statusPromise: process.status,
      ready: false,
      readyPromise,
      resolveReady,
    };

    this.#runners.push(runner);

    // Start message loop
    this.#startMessageLoop(runner);

    // Wait for ready message
    await readyPromise;

    logger.debug("Runner ready", {
      runnerCount: this.#runners.length,
    });

    return runner;
  }

  /**
   * Start message loop for runner
   */
  async #startMessageLoop(runner: PoolRunner): Promise<void> {
    try {
      while (true) {
        const { done, value } = await runner.stdout.read();

        if (done) {
          logger.debug("Runner stdout closed");
          break;
        }

        try {
          const output = JSON.parse(value) as RunnerOutput;
          this.#handleRunnerMessage(runner, output);
        } catch (error) {
          logger.error("Failed to parse runner output", { error, value });
        }
      }
    } catch (error) {
      logger.error("Runner message loop error", { error });
      this.#handleRunnerError(runner, error);
    }
  }

  /**
   * Handle message from runner
   */
  #handleRunnerMessage(
    runner: PoolRunner,
    output: RunnerOutput,
  ): void {
    switch (output.type) {
      case "ready":
        runner.ready = true;
        runner.resolveReady?.();
        break;

      case "result": {
        const resolver = this.#taskResolvers.get(output.taskId);
        if (resolver) {
          const result = deserializeScenarioResult(output.result);
          resolver.resolve(result);
          this.#taskResolvers.delete(output.taskId);
          this.#onTaskComplete(runner);
        }
        break;
      }

      case "error": {
        const resolver = this.#taskResolvers.get(output.taskId);
        if (resolver) {
          const error = deserializeError(output.error);
          resolver.reject(error);
          this.#taskResolvers.delete(output.taskId);
          this.#onTaskComplete(runner);
        }
        break;
      }

      case "scenario_start": {
        const resolver = this.#taskResolvers.get(output.taskId);
        void resolver?.callbacks?.onScenarioStart?.(output.scenario);
        break;
      }

      case "scenario_end": {
        const resolver = this.#taskResolvers.get(output.taskId);
        const result = deserializeScenarioResult(output.result);
        void resolver?.callbacks?.onScenarioEnd?.(output.scenario, result);
        break;
      }

      case "step_start": {
        const resolver = this.#taskResolvers.get(output.taskId);
        void resolver?.callbacks?.onStepStart?.(output.scenario, output.step);
        break;
      }

      case "step_end": {
        const resolver = this.#taskResolvers.get(output.taskId);
        const result = deserializeStepResult(output.result);
        void resolver?.callbacks?.onStepEnd?.(
          output.scenario,
          output.step,
          result,
        );
        break;
      }
    }
  }

  /**
   * Handle runner error
   */
  #handleRunnerError(runner: PoolRunner, error: unknown): void {
    logger.error("Runner crashed", { error });

    // Reject current task if any
    if (runner.currentTaskId) {
      const resolver = this.#taskResolvers.get(runner.currentTaskId);
      if (resolver) {
        resolver.reject(
          error instanceof Error ? error : new Error(String(error)),
        );
        this.#taskResolvers.delete(runner.currentTaskId);
      }
    }

    // Remove runner from pool
    const index = this.#runners.indexOf(runner);
    if (index !== -1) {
      this.#runners.splice(index, 1);
    }

    // Create replacement runner if there are pending tasks
    if (this.#pendingTasks.length > 0 && !this.#terminated) {
      void this.#createRunner().then((newRunner) => {
        const task = this.#pendingTasks.shift();
        if (task) {
          this.#assignTask(newRunner, task);
        }
      });
    }
  }

  /**
   * Assign a task to a runner
   */
  #assignTask(runner: PoolRunner, task: PendingTask): void {
    const { input, callbacks, resolve, reject } = task;

    runner.currentTaskId = input.taskId;
    this.#taskResolvers.set(input.taskId, { callbacks, resolve, reject });

    logger.debug("Assigning task to runner", {
      taskId: input.taskId,
      filePath: input.filePath,
      scenarioIndex: input.scenarioIndex,
    });

    // Send message to runner (TextLineWriter appends newline automatically)
    const json = JSON.stringify(input);
    void runner.stdin.write(json);
  }

  /**
   * Handle task completion - assign next task or mark idle
   */
  #onTaskComplete(runner: PoolRunner): void {
    runner.currentTaskId = undefined;

    // Assign next pending task if available
    const nextTask = this.#pendingTasks.shift();
    if (nextTask) {
      this.#assignTask(runner, nextTask);
      return;
    }

    logger.debug("Runner idle", {
      idleCount: this.#runners.filter((r) => !r.currentTaskId).length,
    });
  }

  /**
   * Terminate all runners and reject pending tasks
   */
  async [Symbol.asyncDispose](): Promise<void> {
    if (this.#terminated) {
      return;
    }

    this.#terminated = true;
    logger.debug("Terminating RunnerPool", {
      runnerCount: this.#runners.length,
      pendingTasks: this.#pendingTasks.length,
    });

    // Reject all pending tasks
    for (const task of this.#pendingTasks) {
      task.reject(new Error("RunnerPool terminated"));
    }
    this.#pendingTasks.length = 0;

    // Send terminate command to all runners
    const terminatePromises = this.#runners.map(async (runner) => {
      try {
        const terminate: RunnerInput = { type: "terminate" };
        const json = JSON.stringify(terminate);
        await runner.stdin.write(json);
        await runner.stdin.close();
      } catch (error) {
        logger.debug("Failed to send terminate command", { error });
      }
    });

    await Promise.all(terminatePromises);

    // Wait for all processes to exit
    const statusPromises = this.#runners.map((r) => r.statusPromise);
    await Promise.all(statusPromises);

    this.#runners.length = 0;

    // Clean up template processor
    await this.#templateProcessor.cleanup();

    logger.debug("RunnerPool terminated");
  }
}
