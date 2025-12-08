/**
 * Test result reporting and formatting for Probitas.
 *
 * This package provides multiple reporter implementations for formatting and
 * displaying test execution results. All reporters implement the {@linkcode Reporter}
 * interface from `@probitas/runner` and can be passed to `ScenarioRunner.run()`.
 *
 * ## Links
 *
 * - [GitHub Repository](https://github.com/jsr-probitas/probitas)
 * - [@probitas/probitas](https://jsr.io/@probitas/probitas) - Main package (recommended for most users)
 *
 * ## Related Packages
 *
 * | Package | Description |
 * |---------|-------------|
 * | [@probitas/runner](https://jsr.io/@probitas/runner) | Uses reporters for output |
 * | [@probitas/cli](https://jsr.io/@probitas/cli) | CLI that uses these reporters |
 * | [@probitas/logger](https://jsr.io/@probitas/logger) | Logging used during execution |
 *
 * ## Available Reporters
 *
 * - {@linkcode ListReporter} - Detailed hierarchical output showing scenario and step names
 * - {@linkcode DotReporter} - Compact single-character output (`.` for pass, `F` for fail)
 * - {@linkcode TapReporter} - TAP (Test Anything Protocol) format for CI integration
 * - {@linkcode JsonReporter} - JSON output for machine-readable results
 *
 * ## Base Class
 *
 * - {@linkcode BaseReporter} - Abstract base class with common functionality:
 *   - Output stream management (defaults to stderr)
 *   - Serialized write operations for concurrent scenarios
 *   - Customizable color themes (use `noColor` option to disable)
 *
 * ## Theming
 *
 * - {@linkcode Theme} - Interface defining semantic color functions
 * - {@linkcode defaultTheme} - Default colored theme
 * - {@linkcode noColorTheme} - Theme without ANSI color codes
 *
 * ## Configuration Types
 *
 * - {@linkcode ReporterOptions} - Options for reporter initialization
 * - {@linkcode ThemeFunction} - Type for theme color functions
 *
 * @example Using ListReporter (default for CLI)
 * ```ts
 * import { ScenarioRunner } from "@probitas/runner";
 * import { ListReporter } from "@probitas/reporter";
 *
 * const runner = new ScenarioRunner();
 * const summary = await runner.run(scenarios, {
 *   reporter: new ListReporter(),
 * });
 *
 * // Output:
 * // ● User Registration
 * //   ✓ Create user (15ms)
 * //   ✓ Verify email (23ms)
 * // ● API Integration
 * //   ✓ Authenticate (45ms)
 * //   ✗ Fetch data (102ms)
 * //     Error: Connection timeout
 * ```
 *
 * @example Using DotReporter for minimal output
 * ```ts
 * import { DotReporter } from "@probitas/reporter";
 *
 * const summary = await runner.run(scenarios, {
 *   reporter: new DotReporter(),
 * });
 *
 * // Output:
 * // ....F..S..
 * // (. = passed, F = failed, S = skipped)
 * ```
 *
 * @example Using TapReporter for CI systems
 * ```ts
 * import { TapReporter } from "@probitas/reporter";
 *
 * const summary = await runner.run(scenarios, {
 *   reporter: new TapReporter(),
 * });
 *
 * // Output:
 * // TAP version 14
 * // 1..5
 * // ok 1 - User Registration
 * // ok 2 - API Integration
 * // not ok 3 - Payment Flow
 * //   ---
 * //   message: "Card declined"
 * //   ...
 * ```
 *
 * @example Using JsonReporter for programmatic analysis
 * ```ts
 * import { JsonReporter } from "@probitas/reporter";
 *
 * const summary = await runner.run(scenarios, {
 *   reporter: new JsonReporter(),
 * });
 *
 * // Output: JSON object with full run details
 * ```
 *
 * @example Configuring reporter options
 * ```ts
 * import { ListReporter } from "@probitas/reporter";
 *
 * const reporter = new ListReporter({
 *   output: Deno.stdout.writable,  // Write to stdout instead of stderr
 *   logLevel: "debug",             // Show all log messages
 *   noColor: Deno.noColor,         // Use Deno's NO_COLOR detection
 * });
 * ```
 *
 * @example Creating a custom reporter
 * ```ts
 * import { BaseReporter } from "@probitas/reporter";
 * import type { ScenarioDefinition, ScenarioResult } from "@probitas/reporter";
 *
 * class EmojiReporter extends BaseReporter {
 *   async onScenarioEnd(scenario: ScenarioDefinition, result: ScenarioResult) {
 *     const emoji = result.status === "passed" ? "🎉"
 *                 : result.status === "failed" ? "💥"
 *                 : "⏭️";
 *     await this.write(`${emoji} ${scenario.name}\n`);
 *   }
 * }
 * ```
 *
 * @module
 */

export * from "./tap_reporter.ts";
export * from "./list_reporter.ts";
export * from "./json_reporter.ts";
export * from "./dot_reporter.ts";
export * from "./theme.ts";

export type * from "./types.ts";
