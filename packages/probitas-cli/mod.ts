/**
 * CLI module - Command-line interface for Probitas
 *
 * Provides a command-line tool for running and listing scenarios.
 *
 * This file serves as both the module exports and the CLI entry point.
 * Run with: deno run -A cli/mod.ts [command] [options]
 *
 * @module
 */

// CLI entry point when run directly
if (import.meta.main) {
  const { main } = await import("./main.ts");
  const exitCode = await main(Deno.args);
  Deno.exit(exitCode);
}
