/**
 * Tests for CBOR-based serializer (streaming API)
 */
import { assertEquals, assertInstanceOf } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  CborSequenceDecoderStream,
  CborSequenceEncoderStream,
} from "@std/cbor";
import { fromCborStreamOutput, toCborStreamInput } from "./serializer.ts";

/**
 * Helper to round-trip a value through streaming encode/decode
 */
async function roundTrip<T>(value: T): Promise<unknown> {
  // Convert to CborStreamInput
  const cborInput = toCborStreamInput(value);

  // Create encoder and decoder streams
  const encoder = new CborSequenceEncoderStream();
  const decoder = new CborSequenceDecoderStream();

  // Pipe encoder output to decoder input
  const encodedStream = encoder.readable.pipeThrough(decoder);

  // Write the input to the encoder
  const writer = encoder.writable.getWriter();
  await writer.write(cborInput);
  await writer.close();

  // Read the decoded output
  const reader = encodedStream.getReader();
  const result = await reader.read();
  if (result.done) {
    throw new Error("No output from decoder");
  }

  // Convert CborStreamOutput back to JavaScript value
  return await fromCborStreamOutput(result.value);
}

describe("serializer (CBOR streaming)", () => {
  describe("primitives", () => {
    it("handles null", async () => {
      assertEquals(await roundTrip(null), null);
    });

    it("handles undefined", async () => {
      assertEquals(await roundTrip(undefined), undefined);
    });

    it("handles boolean", async () => {
      assertEquals(await roundTrip(true), true);
      assertEquals(await roundTrip(false), false);
    });

    it("handles number", async () => {
      assertEquals(await roundTrip(42), 42);
      assertEquals(await roundTrip(3.14), 3.14);
      assertEquals(await roundTrip(-100), -100);
    });

    it("handles string", async () => {
      assertEquals(await roundTrip("hello"), "hello");
      assertEquals(await roundTrip(""), "");
      assertEquals(await roundTrip("日本語"), "日本語");
    });
  });

  describe("BigInt", () => {
    it("converts small BigInt to number (CBOR behavior)", async () => {
      // CBOR decodes small bigints as numbers
      assertEquals(await roundTrip(BigInt(123)), 123);
    });

    it("round-trips large BigInt", async () => {
      // CBOR preserves bigint for values that don't fit in number
      const large = BigInt("12345678901234567890");
      assertEquals(await roundTrip(large), large);
    });

    it("converts small negative BigInt to number (CBOR behavior)", async () => {
      // CBOR decodes small bigints as numbers
      assertEquals(await roundTrip(BigInt(-999)), -999);
    });
  });

  describe("Function", () => {
    it("serializes and deserializes named function", async () => {
      function namedFn() {}
      const result = await roundTrip(namedFn);
      assertEquals(typeof result, "function");
    });

    it("serializes arrow function", async () => {
      const arrow = () => {};
      const result = await roundTrip(arrow);
      assertEquals(typeof result, "function");
    });

    it("deserializes as placeholder function", async () => {
      function myFunc() {}
      const result = (await roundTrip(myFunc)) as () => void;
      assertEquals(typeof result, "function");
      // Placeholder function does nothing
      assertEquals(result(), undefined);
    });
  });

  describe("Symbol", () => {
    it("round-trips Symbol with description", async () => {
      const result = await roundTrip(Symbol("test"));
      assertEquals(typeof result, "symbol");
      assertEquals((result as symbol).description, "test");
    });

    it("round-trips Symbol.for correctly", async () => {
      const original = Symbol.for("shared");
      const result = await roundTrip(original);
      assertEquals(result, Symbol.for("shared"));
    });

    it("creates new Symbol for local symbols", async () => {
      const original = Symbol("local");
      const result = await roundTrip(original);
      assertEquals(typeof result, "symbol");
      assertEquals((result as symbol).description, "local");
      // Local symbols are NOT equal (they're recreated)
    });
  });

  describe("Date", () => {
    it("round-trips Date", async () => {
      const original = new Date("2024-06-15T18:30:00Z");
      const result = await roundTrip(original);
      assertInstanceOf(result, Date);
      assertEquals((result as Date).getTime(), original.getTime());
    });

    it("round-trips epoch Date", async () => {
      const original = new Date(0);
      const result = await roundTrip(original);
      assertInstanceOf(result, Date);
      assertEquals((result as Date).getTime(), 0);
    });
  });

  describe("circular references", () => {
    it("handles self-referencing object", async () => {
      const obj: Record<string, unknown> = { name: "parent" };
      obj.self = obj;

      const result = (await roundTrip(obj)) as Record<string, unknown>;

      assertEquals(result.name, "parent");
      assertEquals(result.self, result);
    });

    it("handles mutually referencing objects", async () => {
      const a: Record<string, unknown> = { name: "a" };
      const b: Record<string, unknown> = { name: "b" };
      a.ref = b;
      b.ref = a;

      const result = (await roundTrip(a)) as Record<string, unknown>;
      const resultB = result.ref as Record<string, unknown>;

      assertEquals(result.name, "a");
      assertEquals(resultB.name, "b");
      assertEquals(resultB.ref, result);
    });

    it("handles circular array", async () => {
      const arr: unknown[] = [1, 2];
      arr.push(arr);

      const result = (await roundTrip(arr)) as unknown[];
      assertEquals(result[0], 1);
      assertEquals(result[1], 2);
      assertEquals(result[2], result);
    });
  });

  describe("Map", () => {
    it("round-trips Map with string keys", async () => {
      const original = new Map<string, number>([
        ["x", 10],
        ["y", 20],
      ]);
      const result = await roundTrip(original);
      assertInstanceOf(result, Map);
      assertEquals((result as Map<string, number>).get("x"), 10);
      assertEquals((result as Map<string, number>).get("y"), 20);
    });

    it("round-trips Map with complex values", async () => {
      const original = new Map([
        ["nested", { a: 1, b: 2 }],
        ["array", [1, 2, 3]],
      ]);
      const result = (await roundTrip(original)) as Map<string, unknown>;
      assertInstanceOf(result, Map);
      assertEquals(result.get("nested"), { a: 1, b: 2 });
      assertEquals(result.get("array"), [1, 2, 3]);
    });

    it("round-trips Map with non-string keys", async () => {
      const original = new Map<unknown, string>([
        [1, "one"],
        [{ key: "obj" }, "object-key"],
      ]);
      const result = (await roundTrip(original)) as Map<unknown, string>;
      assertInstanceOf(result, Map);
      assertEquals(result.get(1), "one");
      // Object keys become new objects, so we check by iteration
      const entries = Array.from(result.entries());
      assertEquals(entries.length, 2);
      assertEquals(entries[1][1], "object-key");
    });
  });

  describe("Set", () => {
    it("round-trips Set with primitives", async () => {
      const original = new Set([1, 2, 3]);
      const result = await roundTrip(original);
      assertInstanceOf(result, Set);
      assertEquals((result as Set<number>).has(1), true);
      assertEquals((result as Set<number>).has(2), true);
      assertEquals((result as Set<number>).has(3), true);
      assertEquals((result as Set<number>).size, 3);
    });

    it("round-trips Set with strings", async () => {
      const original = new Set(["a", "b", "c"]);
      const result = await roundTrip(original);
      assertInstanceOf(result, Set);
      assertEquals((result as Set<string>).has("a"), true);
      assertEquals((result as Set<string>).size, 3);
    });
  });

  describe("RegExp", () => {
    it("round-trips simple RegExp", async () => {
      const original = /test\d+/im;
      const result = await roundTrip(original);
      assertInstanceOf(result, RegExp);
      assertEquals((result as RegExp).source, "test\\d+");
      assertEquals((result as RegExp).flags, "im");
    });

    it("round-trips RegExp with special characters", async () => {
      const original = /hello\s+world/gi;
      const result = await roundTrip(original);
      assertInstanceOf(result, RegExp);
      assertEquals((result as RegExp).source, "hello\\s+world");
      assertEquals((result as RegExp).flags, "gi");
    });
  });

  describe("Error", () => {
    it("round-trips Error with message", async () => {
      const original = new Error("test message");
      const result = await roundTrip(original);
      assertInstanceOf(result, Error);
      assertEquals((result as Error).message, "test message");
      assertEquals((result as Error).name, "Error");
    });

    it("preserves custom error properties", async () => {
      const original = Object.assign(new Error("test"), {
        code: "ERR_TEST",
        details: { foo: "bar" },
      });
      const result = (await roundTrip(original)) as Error & {
        code: string;
        details: { foo: string };
      };
      assertInstanceOf(result, Error);
      assertEquals(result.message, "test");
      assertEquals(result.code, "ERR_TEST");
      assertEquals(result.details, { foo: "bar" });
    });
  });

  describe("TypedArray", () => {
    it("round-trips Uint8Array", async () => {
      const original = new Uint8Array([10, 20, 30]);
      const result = await roundTrip(original);
      assertInstanceOf(result, Uint8Array);
      assertEquals(Array.from(result as Uint8Array), [10, 20, 30]);
    });

    it("round-trips Int32Array", async () => {
      const original = new Int32Array([100, -200, 300]);
      const result = await roundTrip(original);
      assertInstanceOf(result, Int32Array);
      assertEquals(Array.from(result as Int32Array), [100, -200, 300]);
    });

    it("round-trips Float64Array", async () => {
      const original = new Float64Array([1.5, 2.5, 3.5]);
      const result = await roundTrip(original);
      assertInstanceOf(result, Float64Array);
      assertEquals(Array.from(result as Float64Array), [1.5, 2.5, 3.5]);
    });

    it("round-trips BigInt64Array", async () => {
      const original = new BigInt64Array([BigInt(1), BigInt(-2), BigInt(3)]);
      const result = await roundTrip(original);
      assertInstanceOf(result, BigInt64Array);
      assertEquals(
        Array.from(result as BigInt64Array),
        [BigInt(1), BigInt(-2), BigInt(3)],
      );
    });
  });

  describe("ArrayBuffer", () => {
    it("round-trips ArrayBuffer", async () => {
      const original = new Uint8Array([5, 6, 7, 8]).buffer;
      const result = await roundTrip(original);
      assertInstanceOf(result, ArrayBuffer);
      assertEquals(
        Array.from(new Uint8Array(result as ArrayBuffer)),
        [5, 6, 7, 8],
      );
    });
  });

  describe("DataView", () => {
    it("round-trips DataView", async () => {
      const original = new DataView(new Uint8Array([1, 2, 3, 4]).buffer);
      const result = await roundTrip(original);
      assertInstanceOf(result, DataView);
      assertEquals((result as DataView).byteLength, 4);
      assertEquals((result as DataView).getUint8(0), 1);
    });
  });

  describe("WeakMap/WeakSet/WeakRef", () => {
    it("round-trips WeakMap as new empty WeakMap", async () => {
      const result = await roundTrip(new WeakMap());
      assertInstanceOf(result, WeakMap);
    });

    it("round-trips WeakSet as new empty WeakSet", async () => {
      const result = await roundTrip(new WeakSet());
      assertInstanceOf(result, WeakSet);
    });
  });

  describe("complex nested structures", () => {
    it("handles nested objects with special values", async () => {
      const original = {
        bigint: BigInt(123),
        nested: {
          date: new Date("2024-01-01"),
          map: new Map([["key", "value"]]),
        },
        array: [1, undefined, BigInt(456)],
      };

      const result = (await roundTrip(original)) as {
        bigint: number;
        nested: { date: Date; map: Map<string, string> };
        array: [number, undefined, number];
      };

      // Small bigints are converted to numbers by CBOR
      assertEquals(result.bigint, 123);
      assertInstanceOf(result.nested.date, Date);
      assertInstanceOf(result.nested.map, Map);
      assertEquals(result.nested.map.get("key"), "value");
      assertEquals(result.array[0], 1);
      assertEquals(result.array[1], undefined);
      assertEquals(result.array[2], 456);
    });

    it("handles array of mixed special types", async () => {
      const original = [
        BigInt(1),
        new Date("2024-01-01"),
        new Set([1, 2]),
        /test/g,
      ];

      const result = (await roundTrip(original)) as unknown[];

      // Small bigints are converted to numbers by CBOR
      assertEquals(result[0], 1);
      assertInstanceOf(result[1], Date);
      assertInstanceOf(result[2], Set);
      assertInstanceOf(result[3], RegExp);
    });

    it("preserves undefined in object properties", async () => {
      const original = { a: 1, b: undefined, c: 3 };
      const result = (await roundTrip(original)) as typeof original;
      assertEquals(result, { a: 1, b: undefined, c: 3 });
      assertEquals("b" in result, true);
    });

    it("preserves undefined in arrays", async () => {
      const original = [1, undefined, 3];
      const result = await roundTrip(original);
      assertEquals(result, [1, undefined, 3]);
    });
  });

  describe("toCborStreamInput output type", () => {
    it("returns CborStreamInput for objects", () => {
      const result = toCborStreamInput({ foo: "bar" });
      // Should be a plain object (Record<string, CborStreamInput>)
      assertEquals(typeof result, "object");
      assertEquals(result !== null, true);
    });

    it("returns primitives directly", () => {
      assertEquals(toCborStreamInput(42), 42);
      assertEquals(toCborStreamInput("hello"), "hello");
      assertEquals(toCborStreamInput(null), null);
      assertEquals(toCborStreamInput(undefined), undefined);
    });
  });
});
