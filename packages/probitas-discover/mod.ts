/**
 * Scenario file discovery utilities for Probitas.
 *
 * This package provides utilities for discovering scenario files (`.probitas.ts`)
 * from file paths and directories. It supports glob patterns for flexible file
 * matching and is used internally by the CLI to find scenarios to execute.
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
 * | [@probitas/core](https://jsr.io/@probitas/core) | Load discovered files with `loadScenarios` |
 * | [@probitas/cli](https://jsr.io/@probitas/cli) | CLI that uses this discovery |
 *
 * ## Core Function
 *
 * - {@linkcode discoverScenarioFiles} - Discover scenario files from paths
 *
 * ## Configuration Types
 *
 * - {@linkcode DiscoverOptions} - Options for customizing discovery behavior
 * - {@linkcode DiscoverProgress} - Progress information during discovery
 *
 * ## Default Behavior
 *
 * By default, the discovery function:
 * - Searches for files matching `**\/*.probitas.ts` in directories
 * - Returns direct file paths as-is (no pattern matching)
 * - Returns absolute paths sorted alphabetically
 *
 * ## Permissions
 *
 * Requires `--allow-read` permission to read the file system.
 *
 * @example Basic usage
 * ```ts
 * import { discoverScenarioFiles } from "@probitas/discover";
 *
 * // Discover from current directory
 * const files = await discoverScenarioFiles(["."]);
 * console.log(files);
 * // ["/path/to/auth.probitas.ts", "/path/to/api.probitas.ts"]
 * ```
 *
 * @example Mixed files and directories
 * ```ts
 * import { discoverScenarioFiles } from "@probitas/discover";
 *
 * // Combine specific files with directory scanning
 * const files = await discoverScenarioFiles([
 *   "./critical.probitas.ts",  // Direct file
 *   "./tests/api/",            // Directory to scan
 *   "./tests/integration/",    // Another directory
 * ]);
 * ```
 *
 * @example Custom patterns
 * ```ts
 * import { discoverScenarioFiles } from "@probitas/discover";
 *
 * // Use custom include/exclude patterns
 * const files = await discoverScenarioFiles(["./tests"], {
 *   includes: ["**\/*.test.ts", "**\/*.spec.ts"],  // Custom patterns
 *   excludes: ["**\/_*.ts", "**\/helpers/**"],    // Skip files starting with _
 * });
 * ```
 *
 * @example Integration with loader
 * ```ts
 * import { discoverScenarioFiles } from "@probitas/discover";
 * import { loadScenarios } from "@probitas/core/loader";
 * import type { Reporter } from "@probitas/runner";
 * import { Runner } from "@probitas/runner";
 *
 * // Complete workflow: discover -> load -> run
 * const files = await discoverScenarioFiles(["./scenarios"]);
 * const scenarios = await loadScenarios(files);
 * const reporter: Reporter = {}; // Minimal reporter (all methods optional)
 * const runner = new Runner(reporter);
 * const summary = await runner.run(scenarios);
 * ```
 *
 * @module
 */

export * from "./discover.ts";
