/**
 * Unified logging interface for Probitas packages.
 *
 * This package provides a centralized logging system built on LogTape. It offers
 * consistent logging across all Probitas packages with configurable log levels,
 * pretty formatting, and hierarchical categories.
 *
 * ## Links
 *
 * - [GitHub Repository](https://github.com/jsr-probitas/probitas)
 * - [@probitas/probitas](https://jsr.io/@probitas/probitas) - Main package (recommended for most users)
 * - [LogTape](https://jsr.io/@logtape/logtape) - Underlying logging library
 *
 * ## Related Packages
 *
 * All Probitas packages use this logger internally:
 * [@probitas/runner](https://jsr.io/@probitas/runner),
 * [@probitas/reporter](https://jsr.io/@probitas/reporter),
 * [@probitas/discover](https://jsr.io/@probitas/discover),
 * [@probitas/cli](https://jsr.io/@probitas/cli)
 *
 * ## Core Functions
 *
 * - {@linkcode configureLogging} - Initialize the logging system with a log level
 * - {@linkcode getLogger} - Get a logger instance for a category
 * - {@linkcode resetLogging} - Reset logging configuration (for testing)
 *
 * ## Types
 *
 * - {@linkcode Logger} - Logger interface from LogTape
 * - {@linkcode LogLevel} - Available log levels
 *
 * ## Log Levels
 *
 * From least to most verbose:
 * - `"fatal"` - Critical errors that stop execution
 * - `"error"` - Errors that don't stop execution
 * - `"warning"` - Potential issues (default level)
 * - `"info"` - Informational messages about execution
 * - `"debug"` - Detailed debugging information
 *
 * ## Category Hierarchy
 *
 * Loggers use hierarchical categories following the package structure:
 * - `["probitas"]` - Root category for all Probitas logs
 * - `["probitas", "runner"]` - Runner package logs
 * - `["probitas", "cli", "run"]` - Specific command logs
 *
 * @example Basic configuration
 * ```ts
 * import { configureLogging, getLogger } from "@probitas/logger";
 *
 * // Configure logging at startup
 * await configureLogging("info");
 *
 * // Get a logger for your module
 * const logger = getLogger("probitas", "mymodule");
 *
 * logger.info("Application started");
 * logger.debug("Debug details", { config: { verbose: true } });
 * logger.error("Something went wrong", { error: new Error("test") });
 * ```
 *
 * @example Adjusting log level dynamically
 * ```ts
 * import { configureLogging } from "@probitas/logger";
 *
 * // Start with minimal logging
 * await configureLogging("warning");
 *
 * // Enable debug logs when troubleshooting
 * await configureLogging("debug");
 * ```
 *
 * @example Using in a Probitas package
 * ```ts
 * import { getLogger } from "@probitas/logger";
 *
 * // In @probitas/runner
 * const logger = getLogger("probitas", "runner");
 *
 * const scenario = { name: "my-scenario" };
 * logger.debug("Executing scenario", { name: scenario.name });
 * logger.info("Scenario completed", { status: "passed" });
 * ```
 *
 * @example Testing with logging reset
 * ```ts
 * import { configureLogging, resetLogging } from "@probitas/logger";
 *
 * Deno.test("my test", async () => {
 *   await configureLogging("fatal"); // Suppress logs during test
 *
 *   // ... test code ...
 *
 *   await resetLogging(); // Clean up
 * });
 * ```
 *
 * @module
 */

export * from "./logger.ts";
export type { Logger, LogLevel } from "@logtape/logtape";
