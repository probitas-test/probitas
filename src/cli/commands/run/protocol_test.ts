/**
 * Tests for worker communication protocol
 *
 * @module
 */

import { assertEquals, assertInstanceOf } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { deserializeError, serializeError } from "./protocol.ts";

describe("protocol", () => {
  describe("error serialization", () => {
    it("serializes and deserializes Error objects", () => {
      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at test.ts:1:1";

      const serialized = serializeError(error);
      const deserialized = deserializeError(serialized);

      assertEquals(deserialized.message, "Test error");
      assertEquals(deserialized.name, "Error");
      assertEquals(deserialized.stack, error.stack);
      assertInstanceOf(deserialized, Error);
    });

    it("serializes non-Error values as Error", () => {
      const serialized = serializeError("string error");
      const deserialized = deserializeError(serialized);

      assertEquals(deserialized.message, "string error");
      assertEquals(deserialized.name, "Error");
      assertInstanceOf(deserialized, Error);
    });

    it("serializes null and undefined", () => {
      const serializedNull = serializeError(null);
      const deserializedNull = deserializeError(serializedNull);
      assertEquals(deserializedNull.message, "null");

      const serializedUndefined = serializeError(undefined);
      const deserializedUndefined = deserializeError(serializedUndefined);
      assertEquals(deserializedUndefined.message, "undefined");
    });

    it("preserves custom error names", () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "CustomError";
        }
      }

      const error = new CustomError("Custom error");
      const serialized = serializeError(error);
      const deserialized = deserializeError(serialized);

      assertEquals(deserialized.message, "Custom error");
      assertEquals(deserialized.name, "CustomError");
      assertInstanceOf(deserialized, Error);
    });

    it("preserves stack traces", () => {
      const error = new Error("Error with stack");
      const originalStack = error.stack;

      const serialized = serializeError(error);
      const deserialized = deserializeError(serialized);

      assertEquals(deserialized.stack, originalStack);
    });
  });
});
