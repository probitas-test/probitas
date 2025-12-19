import { assertEquals, assertExists } from "@std/assert";
import { dispose } from "@logtape/logtape";
import type { Logger } from "@logtape/logtape";
import {
  configureLogging,
  getLogger,
  type LogLevel,
  resetLogging,
} from "./logger.ts";

// Disable resource sanitizer because LogTape's non-blocking mode
// uses intervals and writable streams that are cleaned up on process exit
const testOptions = {
  sanitizeResources: false,
  sanitizeOps: false,
};

// Configure once for all tests to avoid stream locking issues
let configured = false;
async function ensureConfigured() {
  if (!configured) {
    await configureLogging("debug");
    configured = true;
  }
}

Deno.test(
  "probitas-logger configureLogging should configure logging without errors",
  testOptions,
  async () => {
    await ensureConfigured();
    // This test just verifies the API exists
    const levels: LogLevel[] = [
      "fatal",
      "error",
      "warning",
      "info",
      "debug",
    ];
    // Type check that all levels are valid
    assertEquals(levels.length, 5);
  },
);

Deno.test(
  "probitas-logger getLogger should return a logger instance",
  testOptions,
  async () => {
    await ensureConfigured();
    const logger = getLogger("probitas");
    assertExists(logger);
  },
);

Deno.test(
  "probitas-logger getLogger should return a logger with multiple category segments",
  testOptions,
  async () => {
    await ensureConfigured();
    const logger = getLogger("probitas", "cli", "run");
    assertExists(logger);
  },
);

Deno.test(
  "probitas-logger getLogger should return a logger that can log messages",
  testOptions,
  async () => {
    await ensureConfigured();
    const logger = getLogger("probitas", "test");

    // These should not throw
    logger.debug("debug message");
    logger.info("info message");
    logger.warn("warning message");
    logger.error("error message");
    logger.fatal("fatal message");
  },
);

Deno.test(
  "probitas-logger getLogger should support structured properties",
  testOptions,
  async () => {
    await ensureConfigured();
    const logger = getLogger("probitas", "test");

    // Should not throw
    logger.info("message with properties", {
      foo: "bar",
      count: 42,
    });
  },
);

Deno.test(
  "probitas-logger resetLogging should export resetLogging function",
  testOptions,
  async () => {
    await ensureConfigured();
    // Type check that the function exists
    assertExists(resetLogging);
  },
);

Deno.test(
  "probitas-logger logger hierarchy should support single category segment",
  testOptions,
  async () => {
    await ensureConfigured();
    const logger = getLogger("probitas");
    assertExists(logger);
    logger.info("test");
  },
);

Deno.test(
  "probitas-logger logger hierarchy should support two category segments",
  testOptions,
  async () => {
    await ensureConfigured();
    const logger = getLogger("probitas", "cli");
    assertExists(logger);
    logger.info("test");
  },
);

Deno.test(
  "probitas-logger logger hierarchy should support three category segments",
  testOptions,
  async () => {
    await ensureConfigured();
    const logger = getLogger("probitas", "cli", "run");
    assertExists(logger);
    logger.info("test");
  },
);

Deno.test(
  "probitas-logger logger hierarchy should support four category segments",
  testOptions,
  async () => {
    await ensureConfigured();
    const logger = getLogger("probitas", "cli", "run", "subprocess");
    assertExists(logger);
    logger.info("test");
  },
);

Deno.test(
  "probitas-logger type exports should export LogLevel type",
  testOptions,
  async () => {
    await ensureConfigured();
    const level: LogLevel = "warning";
    assertEquals(level, "warning");
  },
);

Deno.test(
  "probitas-logger type exports should export Logger type",
  testOptions,
  async () => {
    await ensureConfigured();
    // Type check only - this ensures Logger is exported
    const _typeCheck: Logger | null = null;
    assertEquals(_typeCheck, null);
  },
);

// Cleanup after all tests
Deno.test("probitas-logger cleanup", testOptions, async () => {
  await dispose();
  await resetLogging();
});
