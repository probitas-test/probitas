/**
 * Command-line interface for Probitas.
 *
 * This package provides the `probitas` CLI tool for discovering, listing, and
 * running scenario-based tests. It serves as the primary user-facing interface
 * to the Probitas framework.
 *
 * ## Links
 *
 * - [GitHub Repository](https://github.com/jsr-probitas/probitas)
 * - [@probitas/probitas](https://jsr.io/@probitas/probitas) - Main package for writing scenarios
 *
 * ## Related Packages
 *
 * | Package | Description |
 * |---------|-------------|
 * | [@probitas/discover](https://jsr.io/@probitas/discover) | File discovery used by CLI |
 * | [@probitas/runner](https://jsr.io/@probitas/runner) | Test execution engine |
 * | [@probitas/reporter](https://jsr.io/@probitas/reporter) | Output formatters |
 * | [@probitas/core](https://jsr.io/@probitas/core) | Scenario loading and filtering |
 *
 * ## Installation
 *
 * ```bash
 * # Install globally from JSR
 * deno install -A jsr:@probitas/cli
 *
 * # Or run directly
 * deno run -A jsr:@probitas/cli run ./scenarios
 * ```
 *
 * ## Commands
 *
 * ### `probitas run [paths...] [options]`
 *
 * Execute scenario files and report results.
 *
 * **Options:**
 * - `--select, -s <pattern>` - Filter scenarios by selector (can repeat)
 * - `--reporter, -r <type>` - Output format: list, dot, tap, json (default: list)
 * - `--concurrency, -c <n>` - Max parallel scenarios (0 = unlimited)
 * - `--max-failures, -f <n>` - Stop after N failures (0 = continue all)
 * - `--log-level, -l <level>` - Log verbosity: fatal, warning, info, debug
 *
 * ### `probitas list [paths...] [options]`
 *
 * List discovered scenarios without running them.
 *
 * **Options:**
 * - `--select, -s <pattern>` - Filter scenarios by selector
 * - `--format <type>` - Output format: names, json (default: names)
 *
 * ### `probitas init [name]`
 *
 * Initialize a new scenario file from template.
 *
 * ## Selectors
 *
 * Selectors filter scenarios by name or tags:
 * - `login` - Match scenarios with "login" in name
 * - `tag:api` - Match scenarios tagged with "api"
 * - `!tag:slow` - Exclude scenarios tagged with "slow"
 * - `tag:api,tag:critical` - Match both tags (AND)
 * - Multiple `-s` flags combine with OR logic
 *
 * ## Exit Codes
 *
 * - `0` - Success (all scenarios passed)
 * - `1` - Failure (one or more scenarios failed)
 * - `2` - Usage error (invalid arguments)
 *
 * @example Running scenarios
 * ```bash
 * # Run all scenarios in current directory
 * probitas run
 *
 * # Run specific files
 * probitas run auth.probitas.ts api.probitas.ts
 *
 * # Run with selector
 * probitas run -s "tag:api" -s "tag:integration"
 *
 * # Run with specific reporter
 * probitas run -r dot --concurrency 4
 * ```
 *
 * @example Listing scenarios
 * ```bash
 * # List all scenarios
 * probitas list
 *
 * # List as JSON
 * probitas list --format json
 *
 * # List filtered scenarios
 * probitas list -s "tag:critical"
 * ```
 *
 * @example Creating a new scenario
 * ```bash
 * # Create my-feature.probitas.ts from template
 * probitas init my-feature
 * ```
 *
 * ## Permissions Required
 *
 * - `--allow-read` - Read scenario files and config
 * - `--allow-write` - Create files with `init` command
 * - `--allow-env` - Read environment variables (NO_COLOR, etc.)
 * - `--allow-net` - If scenarios make network requests
 *
 * ## Environment Variables
 *
 * - `NO_COLOR` - Disable colored output when set
 *
 * @module
 */

// CLI entry point when run directly
if (import.meta.main) {
  const { main } = await import("./main.ts");
  const exitCode = await main(Deno.args);
  Deno.exit(exitCode);
}
