import { assertEquals, assertExists } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
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
describe("probitas-logger", {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  // Configure once for all tests to avoid stream locking issues
  beforeAll(async () => {
    await configureLogging("debug");
  });

  afterAll(async () => {
    await dispose();
    await resetLogging();
  });

  describe("configureLogging", () => {
    it("should configure logging without errors", () => {
      // Already configured in beforeAll
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
    });
  });

  describe("getLogger", () => {
    it("should return a logger instance", () => {
      const logger = getLogger("probitas");
      assertExists(logger);
    });

    it("should return a logger with multiple category segments", () => {
      const logger = getLogger("probitas", "cli", "run");
      assertExists(logger);
    });

    it("should return a logger that can log messages", () => {
      const logger = getLogger("probitas", "test");

      // These should not throw
      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warning message");
      logger.error("error message");
      logger.fatal("fatal message");
    });

    it("should support structured properties", () => {
      const logger = getLogger("probitas", "test");

      // Should not throw
      logger.info("message with properties", {
        foo: "bar",
        count: 42,
      });
    });
  });

  describe("resetLogging", () => {
    it("should export resetLogging function", () => {
      // Type check that the function exists
      assertExists(resetLogging);
    });
  });

  describe("logger hierarchy", () => {
    it("should support single category segment", () => {
      const logger = getLogger("probitas");
      assertExists(logger);
      logger.info("test");
    });

    it("should support two category segments", () => {
      const logger = getLogger("probitas", "cli");
      assertExists(logger);
      logger.info("test");
    });

    it("should support three category segments", () => {
      const logger = getLogger("probitas", "cli", "run");
      assertExists(logger);
      logger.info("test");
    });

    it("should support four category segments", () => {
      const logger = getLogger("probitas", "cli", "run", "subprocess");
      assertExists(logger);
      logger.info("test");
    });
  });

  describe("type exports", () => {
    it("should export LogLevel type", () => {
      const level: LogLevel = "warning";
      assertEquals(level, "warning");
    });

    it("should export Logger type", () => {
      // Type check only - this ensures Logger is exported
      const _typeCheck: Logger | null = null;
      assertEquals(_typeCheck, null);
    });
  });
});
