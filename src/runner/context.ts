/**
 * Context creation functions for Runner layer
 *
 * Creates ScenarioContext and StepContext instances used during test execution.
 *
 * @module
 */

import type {
  ScenarioContext,
  ScenarioDefinition,
  StepContext,
} from "./types.ts";

/**
 * Create a scenario context for setup/teardown execution
 *
 * @param scenario The scenario definition
 * @param signal Abort signal for cancellation
 * @returns A new ScenarioContext
 *
 * @example
 * ```ts
 * const signal = new AbortController().signal;
 * const ctx = createScenarioContext(scenario, signal);
 * ```
 */
export function createScenarioContext(
  scenario: ScenarioDefinition,
  signal: AbortSignal,
): ScenarioContext {
  return {
    name: scenario.name,
    options: scenario.options,
    results: [],
    store: new Map(),
    signal,
  };
}

/**
 * Create a step context for step execution
 *
 * @template P - Type of the previous step result
 * @template A - Type of accumulated results array
 * @param props Context properties
 * @returns A new StepContext
 *
 * @example
 * ```ts
 * const ctx = createStepContext({
 *   index: 0,
 *   previous: undefined,
 *   results: [],
 *   store: new Map(),
 *   signal: abortSignal,
 * });
 * ```
 */
export function createStepContext<
  P = unknown,
  A extends readonly unknown[] = readonly [],
>(props: {
  readonly index: number;
  readonly previous: P;
  readonly results: A;
  readonly store: Map<string, unknown>;
  readonly signal: AbortSignal;
}): StepContext<P, A> {
  return {
    index: props.index,
    previous: props.previous,
    results: props.results,
    store: props.store,
    signal: props.signal,
  };
}
