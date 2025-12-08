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
 * @param resources Initialized resources
 * @returns A new ScenarioContext
 *
 * @example
 * ```ts
 * const signal = new AbortController().signal;
 * const resources = {};
 * const ctx = createScenarioContext(scenario, signal, resources);
 * ```
 */
export function createScenarioContext(
  scenario: ScenarioDefinition,
  signal: AbortSignal,
  resources: Record<string, unknown>,
): ScenarioContext {
  return {
    name: scenario.name,
    options: scenario.options,
    results: [],
    store: new Map(),
    signal,
    resources,
  };
}

/**
 * Create a step context for step execution
 *
 * @template P - Type of the previous step result
 * @template A - Type of accumulated results array
 * @template Resources - Available resources
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
 *   resources: {},
 * });
 * ```
 */
export function createStepContext<
  P = unknown,
  A extends readonly unknown[] = readonly [],
  Resources extends Record<string, unknown> = Record<string, never>,
>(props: {
  readonly index: number;
  readonly previous: P;
  readonly results: A;
  readonly store: Map<string, unknown>;
  readonly signal: AbortSignal;
  readonly resources: Resources;
}): StepContext {
  return {
    index: props.index,
    previous: props.previous,
    results: props.results,
    store: props.store,
    signal: props.signal,
    resources: props.resources,
  };
}
