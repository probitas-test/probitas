/**
 * Tests for subprocess template utilities
 *
 * @module
 */

import { assertEquals, assertInstanceOf, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  createOutputValidator,
  deserializeError,
  parseIpcPort,
  serializeError,
} from "./utils.ts";

describe("utils", () => {
  describe("serializeError", () => {
    it("serializes Error objects", () => {
      const error = new Error("test message");
      const serialized = serializeError(error);

      assertEquals(serialized.name, "Error");
      assertEquals(serialized.message, "test message");
      assertEquals(typeof serialized.stack, "string");
    });

    it("serializes custom error types", () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "CustomError";
        }
      }
      const error = new CustomError("custom message");
      const serialized = serializeError(error);

      assertEquals(serialized.name, "CustomError");
      assertEquals(serialized.message, "custom message");
    });

    it("converts non-Error values to Error", () => {
      const serialized = serializeError("string error");

      assertEquals(serialized.name, "Error");
      assertEquals(serialized.message, "string error");
    });

    it("handles null and undefined", () => {
      assertEquals(serializeError(null).message, "null");
      assertEquals(serializeError(undefined).message, "undefined");
    });

    it("handles objects", () => {
      const serialized = serializeError({ code: 42 });

      assertEquals(serialized.message, "[object Object]");
    });
  });

  describe("deserializeError", () => {
    it("restores Error from serialized object", () => {
      const original = new Error("test message");
      const serialized = serializeError(original);
      const restored = deserializeError(serialized);

      assertInstanceOf(restored, Error);
      assertEquals(restored.message, "test message");
    });

    it("preserves error name", () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "CustomError";
        }
      }
      const original = new CustomError("custom message");
      const serialized = serializeError(original);
      const restored = deserializeError(serialized);

      assertEquals(restored.name, "CustomError");
    });

    it("round-trips error correctly", () => {
      const original = new TypeError("type error");
      const restored = deserializeError(serializeError(original));

      assertEquals(restored.name, "TypeError");
      assertEquals(restored.message, "type error");
    });
  });

  describe("parseIpcPort", () => {
    it("parses valid port", () => {
      const port = parseIpcPort(["--ipc-port", "8080"]);
      assertEquals(port, 8080);
    });

    it("parses port with other arguments", () => {
      const port = parseIpcPort([
        "--foo",
        "bar",
        "--ipc-port",
        "3000",
        "--baz",
      ]);
      assertEquals(port, 3000);
    });

    it("throws when --ipc-port is missing", () => {
      assertThrows(
        () => parseIpcPort(["--other", "arg"]),
        Error,
        "Missing required --ipc-port argument",
      );
    });

    it("throws when --ipc-port has no value", () => {
      assertThrows(
        () => parseIpcPort(["--ipc-port"]),
        Error,
        "Missing required --ipc-port argument",
      );
    });

    it("throws for invalid port value", () => {
      assertThrows(
        () => parseIpcPort(["--ipc-port", "invalid"]),
        Error,
        "Invalid --ipc-port value: invalid",
      );
    });

    it("throws for zero port", () => {
      assertThrows(
        () => parseIpcPort(["--ipc-port", "0"]),
        Error,
        "Invalid --ipc-port value: 0",
      );
    });

    it("throws for negative port", () => {
      assertThrows(
        () => parseIpcPort(["--ipc-port", "-1"]),
        Error,
        "Invalid --ipc-port value: -1",
      );
    });

    it("throws for port above 65535", () => {
      assertThrows(
        () => parseIpcPort(["--ipc-port", "65536"]),
        Error,
        "Invalid --ipc-port value: 65536",
      );
    });

    it("accepts maximum valid port", () => {
      const port = parseIpcPort(["--ipc-port", "65535"]);
      assertEquals(port, 65535);
    });

    it("accepts minimum valid port", () => {
      const port = parseIpcPort(["--ipc-port", "1"]);
      assertEquals(port, 1);
    });
  });

  describe("createOutputValidator", () => {
    type TestOutput =
      | { type: "result"; data: string }
      | { type: "error"; message: string };

    const isTestOutput = createOutputValidator<TestOutput>(["result", "error"]);

    it("returns true for valid type", () => {
      assertEquals(isTestOutput({ type: "result", data: "test" }), true);
      assertEquals(isTestOutput({ type: "error", message: "fail" }), true);
    });

    it("returns false for invalid type", () => {
      assertEquals(isTestOutput({ type: "unknown" }), false);
    });

    it("returns false for null", () => {
      assertEquals(isTestOutput(null), false);
    });

    it("returns false for undefined", () => {
      assertEquals(isTestOutput(undefined), false);
    });

    it("returns false for primitives", () => {
      assertEquals(isTestOutput("string"), false);
      assertEquals(isTestOutput(123), false);
      assertEquals(isTestOutput(true), false);
    });

    it("returns false for object without type", () => {
      assertEquals(isTestOutput({ data: "test" }), false);
    });

    it("returns false for non-string type", () => {
      assertEquals(isTestOutput({ type: 123 }), false);
      assertEquals(isTestOutput({ type: null }), false);
    });

    it("returns false for array", () => {
      assertEquals(isTestOutput([]), false);
      assertEquals(isTestOutput([{ type: "result" }]), false);
    });

    it("works with single valid type", () => {
      const isSingleType = createOutputValidator<{ type: "only" }>(["only"]);
      assertEquals(isSingleType({ type: "only" }), true);
      assertEquals(isSingleType({ type: "other" }), false);
    });

    it("works with many valid types", () => {
      const isManyTypes = createOutputValidator<{ type: string }>([
        "a",
        "b",
        "c",
        "d",
        "e",
      ]);
      assertEquals(isManyTypes({ type: "a" }), true);
      assertEquals(isManyTypes({ type: "e" }), true);
      assertEquals(isManyTypes({ type: "f" }), false);
    });
  });
});
