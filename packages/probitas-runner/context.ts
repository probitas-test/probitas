/**
 * Context creation functions for Runner layer
 *
 * Creates ScenarioContext and StepContext instances used during test execution.
 *
 * @module
 */

import type { ScenarioDefinition, StepContext } from "@probitas/core";
import type { ScenarioContext } from "./types.ts";

export function createScenarioContext(
  scenario: ScenarioDefinition,
  signal?: AbortSignal,
): ScenarioContext {
  return {
    name: scenario.name,
    tags: scenario.tags,
    results: [],
    store: new Map(),
    resources: {},
    signal,
  };
}

export function createStepContext(scenarioCtx: ScenarioContext): StepContext {
  const { results, store, resources, signal } = scenarioCtx;
  const previous = results.at(-1);
  const index = results.length + 1;
  return {
    index,
    previous,
    results,
    store,
    resources,
    signal,
  };
}
