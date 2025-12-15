import { deadline } from "@std/async/deadline";
import type {
  ScenarioMetadata,
  SetupCleanup,
  StepContext,
  StepDefinition,
} from "@probitas/core";
import type { Reporter, ScenarioContext, StepResult } from "./types.ts";
import { toStepMetadata } from "./metadata.ts";
import { timeit } from "./utils/timeit.ts";
import { retry } from "./utils/retry.ts";
import { createStepContext } from "./context.ts";
import { mergeSignals } from "./utils/signal.ts";
import { Skip } from "./skip.ts";

type ResourceStep<T> = StepDefinition<T> & { kind: "resource" };
type SetupStep = StepDefinition<SetupCleanup> & { kind: "setup" };
type ExecutionStep<T> = StepDefinition<T> & { kind: "step" };

export class StepRunner {
  #reporter: Reporter;
  #scenarioMetadata: ScenarioMetadata;
  #scenarioCtx: ScenarioContext;

  constructor(
    reporter: Reporter,
    scenarioMetadata: ScenarioMetadata,
    scenarioCtx: ScenarioContext,
  ) {
    this.#reporter = reporter;
    this.#scenarioMetadata = scenarioMetadata;
    this.#scenarioCtx = scenarioCtx;
  }

  async run(
    step: StepDefinition,
    stack: AsyncDisposableStack,
  ): Promise<StepResult> {
    const ctx = createStepContext(this.#scenarioCtx);
    const stepMetadata = toStepMetadata(step);
    this.#reporter.onStepStart?.(this.#scenarioMetadata, stepMetadata);
    const timeout = step.timeout;
    const signal = mergeSignals(
      ctx.signal,
      AbortSignal.timeout(timeout),
    );
    const result = await timeit(() => {
      return retry(
        () => deadline(this.#run(ctx, step, stack), timeout, { signal }),
        {
          ...step.retry,
          signal,
        },
      );
    });
    const stepResult: StepResult = result.status === "passed"
      ? {
        status: "passed",
        value: result.value,
        duration: result.duration,
        metadata: stepMetadata,
      }
      : {
        status: result.error instanceof Skip ? "skipped" : "failed",
        error: result.error,
        duration: result.duration,
        metadata: stepMetadata,
      };
    this.#reporter.onStepEnd?.(
      this.#scenarioMetadata,
      stepMetadata,
      stepResult,
    );
    return stepResult;
  }

  async #run<T = unknown>(
    ctx: StepContext,
    step: StepDefinition<T>,
    stack: AsyncDisposableStack,
  ): Promise<T> {
    switch (step.kind) {
      case "resource": {
        return await this.#runResourceStep(ctx, step as ResourceStep<T>, stack);
      }
      case "setup": {
        return await this.#runSetupStep(ctx, step as SetupStep, stack) as T;
      }
      case "step": {
        return await this.#runExecutionStep(ctx, step as ExecutionStep<T>);
      }
    }
  }

  async #runResourceStep<T = unknown>(
    ctx: StepContext,
    step: ResourceStep<T>,
    stack: AsyncDisposableStack,
  ): Promise<T> {
    const resource = await step.fn(ctx);
    if (isDisposable(resource)) {
      stack.use(resource);
    }
    this.#scenarioCtx.resources[step.name] = resource;
    return resource;
  }

  async #runSetupStep(
    ctx: StepContext,
    step: SetupStep,
    stack: AsyncDisposableStack,
  ): Promise<undefined> {
    const cleanup = await step.fn(ctx);
    if (cleanup) {
      if (typeof cleanup === "function") {
        stack.defer(cleanup);
      } else if (isDisposable(cleanup)) {
        stack.use(cleanup);
      }
    }
  }

  async #runExecutionStep<T>(
    ctx: StepContext,
    step: ExecutionStep<T>,
  ): Promise<T> {
    const value = await step.fn(ctx);
    this.#scenarioCtx.results.push(value);
    return value;
  }
}

function isDisposable(x: unknown): x is Disposable | AsyncDisposable {
  return (
    x != null && typeof x === "object" &&
    (Symbol.asyncDispose in x || Symbol.dispose in x)
  );
}
