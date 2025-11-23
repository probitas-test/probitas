/**
 * Step execution functions
 *
 * Handles execution of individual steps with timeout and retry support.
 *
 * @module
 */

import { retry } from "./retry.ts";
import { TimeoutError } from "./errors.ts";
import type { StepContext, StepDefinition } from "./types.ts";

/**
 * Execute a single step with timeout support
 *
 * Applies the step's timeout using AbortSignal.timeout and combines it with
 * any existing abort signal from the context.
 *
 * @template P - Type of the previous step result
 * @template A - Type of accumulated results array
 * @param step The step definition to execute
 * @param ctx The step context
 * @returns Promise resolving to the step function's return value
 * @throws TimeoutError if step exceeds timeout
 * @throws Any error thrown by the step function
 *
 * @example
 * ```ts
 * const result = await executeStep(step, ctx);
 * ```
 */
export async function executeStep<
  P = unknown,
  A extends readonly unknown[] = readonly unknown[],
>(
  step: StepDefinition,
  ctx: StepContext<P, A>,
): Promise<unknown> {
  const timeoutSignal = AbortSignal.timeout(step.options.timeout);
  const signal = AbortSignal.any([ctx.signal, timeoutSignal]);

  try {
    return await step.fn({ ...ctx, signal } as StepContext<P, A>);
  } catch (error) {
    // Convert AbortError from timeout to TimeoutError
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new TimeoutError(
        `Step "${step.name}" exceeded timeout of ${step.options.timeout}ms`,
        step.options.timeout,
      );
    }
    throw error;
  }
}

/**
 * Execute a step with retry support
 *
 * Combines timeout and retry logic: each attempt respects the timeout,
 * and retries follow the configured backoff strategy.
 *
 * @template P - Type of the previous step result
 * @template A - Type of accumulated results array
 * @param step The step definition to execute
 * @param ctx The step context
 * @returns Promise resolving to the step function's return value
 * @throws Any error thrown by the step function after all retries exhausted
 *
 * @example
 * ```ts
 * const result = await executeStepWithRetry(step, ctx);
 * ```
 */
export async function executeStepWithRetry<
  P = unknown,
  A extends readonly unknown[] = readonly unknown[],
>(
  step: StepDefinition,
  ctx: StepContext<P, A>,
): Promise<unknown> {
  return await retry(
    () => executeStep(step, ctx),
    {
      maxAttempts: step.options.retry.maxAttempts,
      backoff: step.options.retry.backoff,
      signal: ctx.signal,
    },
  );
}
