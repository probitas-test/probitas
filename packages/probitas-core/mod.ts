/**
 * Core scenario definition types and utilities.
 *
 * This package provides the fundamental type definitions that represent scenario
 * structures, along with utilities for loading scenario files and filtering
 * scenarios using selectors. It serves as the foundation layer that other
 * Probitas packages build upon.
 *
 * ## Links
 *
 * - [GitHub Repository](https://github.com/probitas-test/probitas)
 * - [@probitas/probitas](https://jsr.io/@probitas/probitas) - Main package (recommended for most users)
 *
 * ## Related Packages
 *
 * | Package | Description |
 * |---------|-------------|
 * | [@probitas/builder](https://jsr.io/@probitas/builder) | Uses these types to build scenarios |
 * | [@probitas/runner](https://jsr.io/@probitas/runner) | Executes scenario definitions |
 * | [@probitas/discover](https://jsr.io/@probitas/discover) | Discovers scenario files to load |
 *
 * ## Type Definitions
 *
 * The type system is designed around immutable data structures:
 *
 * - {@linkcode ScenarioDefinition} - Complete scenario with name, options, and entries
 * - {@linkcode StepDefinition} - Individual step with function, options, and source
 * - {@linkcode SetupDefinition} - Setup hook with cleanup function support
 * - {@linkcode ResourceDefinition} - Named resource with fn function
 * - {@linkcode StepContext} - Context object passed to all functions
 * - {@linkcode Entry} - Discriminated union of step, setup, or resource
 *
 * ## Options Types
 *
 * - {@linkcode ScenarioOptions} - Scenario-level configuration (tags, default step options)
 * - {@linkcode StepOptions} - Step execution settings (timeout, retry strategy)
 * - Import `Origin` from `@probitas/core/origin` for file and line information
 *
 * ## Function Types
 *
 * - {@linkcode StepFunction} - Signature for step execution functions
 * - {@linkcode SetupFunction} - Signature for setup hooks (returns cleanup)
 * - {@linkcode ResourceFunction} - Signature for resource creation functions
 * - {@linkcode SetupCleanup} - Return type of setup functions
 *
 * ## Loader Utilities
 *
 * - {@linkcode loadScenarios} - Load scenario definitions from file paths
 * - {@linkcode LoadScenariosOptions} - Options for the loader
 *
 * ## Selector Utilities
 *
 * Selectors provide powerful filtering capabilities:
 *
 * - {@linkcode applySelectors} - Filter scenarios using selector strings
 * - {@linkcode parseSelector} - Parse selector string into Selector objects
 * - {@linkcode matchesSelector} - Check if a scenario matches a single selector
 * - {@linkcode Selector} - Parsed selector object
 * - {@linkcode SelectorType} - Type of selector ("tag" or "name")
 *
 * @example Loading scenarios from files
 * ```ts
 * import { loadScenarios } from "@probitas/core/loader";
 *
 * const scenarios = await loadScenarios([
 *   "/path/to/auth.probitas.ts",
 *   "/path/to/api.probitas.ts",
 * ]);
 * console.log(`Loaded ${scenarios.length} scenarios`);
 * ```
 *
 * @example Filtering scenarios with selectors
 * ```ts
 * import { applySelectors } from "@probitas/core/selector";
 * import type { ScenarioDefinition } from "@probitas/core";
 *
 * const scenarios: ScenarioDefinition[] = [];
 *
 * // Filter by tag (OR logic between strings)
 * const apiOrDb = applySelectors(scenarios, ["tag:api", "tag:db"]);
 *
 * // Filter by multiple conditions (AND logic within string)
 * const criticalApi = applySelectors(scenarios, ["tag:api,tag:critical"]);
 *
 * // Exclude scenarios with specific tag
 * const notSlow = applySelectors(scenarios, ["!tag:slow"]);
 *
 * // Filter by name pattern (regex supported)
 * const loginTests = applySelectors(scenarios, ["name:login"]);
 * ```
 *
 * @example Working with scenario definitions
 * ```ts
 * import type { ScenarioDefinition } from "@probitas/core";
 *
 * function inspectScenario(scenario: ScenarioDefinition) {
 *   console.log(`Scenario: ${scenario.name}`);
 *   console.log(`Tags: ${scenario.tags.join(", ")}`);
 *   console.log(`Steps: ${scenario.steps.length}`);
 *
 *   for (const step of scenario.steps) {
 *     if (step.kind === "step") {
 *       console.log(`  Step: ${step.name}`);
 *     } else if (step.kind === "resource") {
 *       console.log(`  Resource: ${step.name}`);
 *     } else {
 *       console.log(`  Setup hook`);
 *     }
 *   }
 * }
 * ```
 *
 * @module
 */

export type * from "./types.ts";
