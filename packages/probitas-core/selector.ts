/**
 * Selector functions for filtering scenarios
 *
 * @module
 */

import { getLogger } from "@probitas/logger";
import type { ScenarioDefinition } from "./types.ts";

const logger = getLogger("probitas", "scenario", "selector");

/**
 * Type of selector for filtering scenarios.
 *
 * - `"tag"`: Match against scenario tags
 * - `"name"`: Match against scenario name
 */
export type SelectorType = "tag" | "name";

/**
 * Parsed selector for filtering scenarios.
 *
 * Created by {@linkcode parseSelector}. Used by {@linkcode matchesSelector}
 * and {@linkcode applySelectors} to filter scenarios.
 *
 * @example
 * ```ts
 * // Result of parseSelector("tag:api")
 * const selector: Selector = {
 *   type: "tag",
 *   value: /api/i,
 *   negated: false
 * };
 * ```
 */
export interface Selector {
  /** Type of match: "tag" for tags, "name" for scenario name */
  readonly type: SelectorType;

  /** Regular expression pattern for matching (case-insensitive) */
  readonly value: RegExp;

  /** If true, selector matches scenarios that do NOT match the pattern */
  readonly negated: boolean;
}

/**
 * Parse a selector string into an array of Selector objects.
 *
 * Selector syntax:
 * - `tag:pattern` - Match scenarios with a tag matching the pattern
 * - `name:pattern` - Match scenarios with a name matching the pattern
 * - `pattern` - Shorthand for `name:pattern`
 * - `!selector` - Negate the selector (exclude matches)
 * - `sel1,sel2` - Combine selectors with AND logic
 *
 * @param input - Selector string to parse
 * @returns Array of parsed Selector objects (comma-separated = multiple selectors)
 * @throws {Error} If selector type is invalid (must be "tag" or "name")
 *
 * @example Basic selectors
 * ```ts
 * parseSelector("tag:api");
 * // → [{ type: "tag", value: /api/i, negated: false }]
 *
 * parseSelector("login");  // Shorthand for name:login
 * // → [{ type: "name", value: /login/i, negated: false }]
 * ```
 *
 * @example Negation
 * ```ts
 * parseSelector("!tag:slow");
 * // → [{ type: "tag", value: /slow/i, negated: true }]
 * ```
 *
 * @example Combined selectors (AND logic)
 * ```ts
 * parseSelector("tag:api,!tag:slow");
 * // → [
 * //     { type: "tag", value: /api/i, negated: false },
 * //     { type: "tag", value: /slow/i, negated: true }
 * //   ]
 * ```
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
 * Check if a scenario matches a single selector.
 *
 * Tests whether the scenario's name or tags match the selector's pattern.
 * Does not apply negation - returns the raw match result.
 *
 * @param scenario - Scenario definition to test
 * @param selector - Selector containing the pattern to match
 * @returns `true` if the scenario matches the pattern (before negation)
 *
 * @example
 * ```ts
 * const scenario = { name: "Login Test", options: { tags: ["auth"] } };
 *
 * matchesSelector(scenario, { type: "tag", value: /auth/i, negated: false });
 * // → true
 *
 * matchesSelector(scenario, { type: "name", value: /login/i, negated: false });
 * // → true
 *
 * matchesSelector(scenario, { type: "tag", value: /api/i, negated: false });
 * // → false
 * ```
 */
export function matchesSelector(
  scenario: ScenarioDefinition,
  selector: Selector,
): boolean {
  if (selector.type === "tag") {
    return scenario.tags.some((tag) => selector.value.test(tag));
  } else if (selector.type === "name") {
    return selector.value.test(scenario.name);
  }

  return false;
}

/**
 * Filter scenarios using selector strings with AND/OR/NOT logic.
 *
 * This is the main entry point for scenario filtering. It combines
 * multiple selector strings with the following logic:
 *
 * - **Multiple strings**: OR condition (match any)
 * - **Comma-separated in string**: AND condition (match all)
 * - **`!` prefix**: NOT condition (exclude matches)
 *
 * @param scenarios - Array of scenarios to filter
 * @param selectorInputs - Selector strings from CLI `-s` flags
 * @returns Filtered scenarios matching the selector criteria
 *
 * @remarks
 * If no selectors are provided, all scenarios are returned unchanged.
 *
 * @example OR logic - match any selector string
 * ```ts
 * // Scenarios with "api" tag OR "db" tag
 * applySelectors(scenarios, ["tag:api", "tag:db"]);
 * ```
 *
 * @example AND logic - match all within comma-separated
 * ```ts
 * // Scenarios with BOTH "api" AND "critical" tags
 * applySelectors(scenarios, ["tag:api,tag:critical"]);
 * ```
 *
 * @example Combined AND/OR/NOT
 * ```ts
 * // (api AND critical) OR (db AND !slow)
 * applySelectors(scenarios, [
 *   "tag:api,tag:critical",
 *   "tag:db,!tag:slow"
 * ]);
 * ```
 *
 * @example Exclude by name pattern
 * ```ts
 * // All scenarios except those with "wip" in name
 * applySelectors(scenarios, ["!wip"]);
 * ```
 */
export function applySelectors(
  scenarios: ScenarioDefinition[],
  selectorInputs: readonly string[],
): ScenarioDefinition[] {
  if (selectorInputs.length === 0) {
    logger.debug("No selectors to apply, returning all scenarios");
    return scenarios;
  }

  logger.debug("Applying selectors", {
    selectorCount: selectorInputs.length,
    selectors: selectorInputs,
    scenarioCount: scenarios.length,
  });

  const filtered = scenarios.filter((scenario) => {
    logger.debug("Evaluating scenario against selectors", {
      scenario: scenario.name,
      tags: scenario.tags,
    });

    // OR between selector strings
    const matched = selectorInputs.some((input) => {
      const selectors = parseSelector(input);
      logger.debug("Parsed selector input", {
        input,
        selectors: selectors.map((s) => ({
          type: s.type,
          pattern: s.value.source,
          negated: s.negated,
        })),
      });

      // AND within each string
      const result = selectors.every((selector) => {
        const matches = matchesSelector(scenario, selector);
        const finalResult = selector.negated ? !matches : matches;

        logger.debug("Selector match result", {
          scenario: scenario.name,
          selectorType: selector.type,
          selectorPattern: selector.value.source,
          negated: selector.negated,
          rawMatch: matches,
          finalResult,
        });

        return finalResult;
      });

      if (result) {
        logger.debug("Scenario matched selector (AND condition satisfied)", {
          scenario: scenario.name,
          selector: input,
        });
      } else {
        logger.debug("Scenario did not match selector (AND condition failed)", {
          scenario: scenario.name,
          selector: input,
        });
      }

      return result;
    });

    if (!matched) {
      logger.debug("Scenario filtered out (no selector matched)", {
        scenario: scenario.name,
        tags: scenario.tags,
      });
    } else {
      logger.debug("Scenario included (at least one selector matched)", {
        scenario: scenario.name,
      });
    }

    return matched;
  });

  logger.debug("Selector filtering completed", {
    originalCount: scenarios.length,
    filteredCount: filtered.length,
    filtered: filtered.map((s) => s.name),
  });

  return filtered;
}
