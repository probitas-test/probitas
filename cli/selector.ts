/**
 * Selector functions for filtering scenarios
 *
 * @module
 */

import type { ScenarioDefinition } from "../src/runner/types.ts";
import type { Selector, SelectorType } from "./types.ts";

/**
 * Parse a selector string into an array of Selector objects
 *
 * @param input - Selector string (e.g., "tag:api", "login", "!tag:slow", "tag:api,!tag:slow")
 * @returns Array of Selector objects
 *
 * @example
 * parseSelector("tag:api") // [{ type: "tag", value: /api/, negated: false }]
 * parseSelector("!tag:slow") // [{ type: "tag", value: /slow/, negated: true }]
 * parseSelector("tag:api,!tag:slow") // [{ type: "tag", value: /api/, negated: false }, { type: "tag", value: /slow/, negated: true }]
 */
export function parseSelector(input: string): Selector[] {
  const parts = input.split(",").map((s) => s.trim()).filter((s) =>
    s.length > 0
  );

  return parts.map((part) => {
    let negated = false;
    let remaining = part;

    // Check for negation prefix
    if (remaining.startsWith("!")) {
      negated = true;
      remaining = remaining.slice(1).trim();
    }

    if (remaining.includes(":")) {
      const colonIndex = remaining.indexOf(":");
      const type = remaining.slice(0, colonIndex) as SelectorType;
      const value = remaining.slice(colonIndex + 1);

      if (type !== "tag" && type !== "name") {
        throw new Error(
          `Invalid selector type: ${type}. Must be "tag" or "name".`,
        );
      }

      return {
        type,
        value: new RegExp(value, "i"), // Case-insensitive
        negated,
      };
    } else {
      // Default to "name" type
      return {
        type: "name" as SelectorType,
        value: new RegExp(remaining, "i"), // Case-insensitive
        negated,
      };
    }
  });
}

/**
 * Check if a scenario matches a single selector
 *
 * @param scenario - Scenario definition to check
 * @param selector - Selector to match against
 * @returns True if the scenario matches the selector
 */
export function matchesSelector(
  scenario: ScenarioDefinition,
  selector: Selector,
): boolean {
  const pattern = selector.value instanceof RegExp
    ? selector.value
    : new RegExp(selector.value);

  if (selector.type === "tag") {
    return scenario.options.tags.some((tag) => pattern.test(tag));
  } else if (selector.type === "name") {
    return pattern.test(scenario.name);
  }

  return false;
}

/**
 * Apply selectors to scenarios with AND/OR/NOT logic
 *
 * Logic:
 * - Multiple selector strings: OR condition
 * - Comma-separated selectors within a string: AND condition
 * - ! prefix: NOT condition (negation)
 *
 * @param scenarios - All scenarios to filter
 * @param selectorInputs - Array of selector strings (OR between strings, AND within strings)
 * @returns Filtered scenarios
 *
 * @example
 * // Select scenarios with "api" OR "db" tag
 * applySelectors(scenarios, ["tag:api", "tag:db"])
 *
 * // Select scenarios with "api" AND "critical" tag
 * applySelectors(scenarios, ["tag:api,tag:critical"])
 *
 * // Select "api" tag, excluding "slow" tag
 * applySelectors(scenarios, ["tag:api,!tag:slow"])
 *
 * // Exclude scenarios with "wip" in name
 * applySelectors(scenarios, ["!wip"])
 */
export function applySelectors(
  scenarios: ScenarioDefinition[],
  selectorInputs: readonly string[],
): ScenarioDefinition[] {
  if (selectorInputs.length === 0) {
    return scenarios;
  }

  return scenarios.filter((scenario) => {
    // OR between selector strings
    return selectorInputs.some((input) => {
      const selectors = parseSelector(input);
      // AND within each string
      return selectors.every((selector) => {
        const matches = matchesSelector(scenario, selector);
        // Apply negation
        return selector.negated ? !matches : matches;
      });
    });
  });
}
