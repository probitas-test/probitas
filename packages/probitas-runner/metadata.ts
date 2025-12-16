/**
 * Metadata conversion utilities
 *
 * Converts Definition types (containing functions) to Metadata types (serializable).
 *
 * @module
 */

import { omit } from "@std/collections/omit";
import type {
  ScenarioDefinition,
  ScenarioMetadata,
  StepDefinition,
  StepMetadata,
} from "@probitas/core";

/**
 * Convert ScenarioDefinition to serializable ScenarioMetadata
 *
 * Removes the `fn` property from each step to make the result JSON-serializable.
 */
export function toScenarioMetadata(
  scenario: ScenarioDefinition,
): ScenarioMetadata {
  const steps = scenario.steps.map((s) => omit(s, ["fn"]));
  return {
    ...omit(scenario, ["steps"]),
    steps,
  };
}

/**
 * Convert StepDefinition to serializable StepMetadata
 *
 * Removes the `fn` property to make the result JSON-serializable.
 */
export function toStepMetadata(step: StepDefinition): StepMetadata {
  return omit(step, ["fn"]);
}
