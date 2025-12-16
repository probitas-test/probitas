import type { Reporter } from "./types.ts";
import type {
  ScenarioDefinition,
  StepContext,
  StepDefinition,
} from "@probitas/core";
import type { ScenarioContext } from "./types.ts";
import { createScenarioContext, createStepContext } from "./context.ts";

export class TestReporter implements Reporter {}

export function createTestScenario(
  overrides?: Partial<ScenarioDefinition>,
): ScenarioDefinition {
  return {
    name: "Test Scenario",
    tags: [],
    steps: [],
    ...overrides,
  };
}

export function createTestScenarioContext(
  scenario?: ScenarioDefinition,
  signal?: AbortSignal,
): ScenarioContext {
  return createScenarioContext(scenario ?? createTestScenario(), signal);
}

export function createTestStep(
  overrides?: Partial<StepDefinition>,
): StepDefinition {
  return {
    kind: "step",
    name: "Test Exec Step",
    fn: () => "result",
    timeout: 5000,
    retry: {
      maxAttempts: 1,
      backoff: "linear",
    },
    ...overrides,
  };
}

export function createTestStepContext(
  scenarioCtx?: ScenarioContext,
): StepContext {
  return createStepContext(scenarioCtx ?? createTestScenarioContext());
}
