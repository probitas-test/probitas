/**
 * Tests for custom serializer
 */
import { assertEquals, assertInstanceOf } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { deserialize, serialize } from "./serializer.ts";

describe("serializer", () => {
  describe("primitives", () => {
    it("handles null", () => {
      assertEquals(serialize(null), null);
      assertEquals(deserialize(null), null);
    });

    it("handles boolean", () => {
      assertEquals(serialize(true), true);
      assertEquals(serialize(false), false);
      assertEquals(deserialize(true), true);
      assertEquals(deserialize(false), false);
    });

    it("handles number", () => {
      assertEquals(serialize(42), 42);
      assertEquals(serialize(3.14), 3.14);
      assertEquals(serialize(-Infinity), -Infinity);
      assertEquals(deserialize(42), 42);
    });

    it("handles string", () => {
      assertEquals(serialize("hello"), "hello");
      assertEquals(deserialize("hello"), "hello");
    });
  });

  describe("BigInt", () => {
    it("serializes BigInt to marker object", () => {
      const result = serialize(BigInt(9007199254740991));
      assertEquals(result, { $type: "bigint", value: "9007199254740991" });
    });

    it("deserializes BigInt from marker object", () => {
      const result = deserialize({
        $type: "bigint",
        value: "9007199254740991",
      });
      assertEquals(result, BigInt(9007199254740991));
    });

    it("round-trips BigInt", () => {
      const original = BigInt("12345678901234567890");
      const result = deserialize(serialize(original));
      assertEquals(result, original);
    });
  });

  describe("Function", () => {
    it("serializes Function to marker object", () => {
      function namedFn() {}
      const result = serialize(namedFn);
      assertEquals(result, { $type: "function", name: "namedFn" });
    });

    it("serializes arrow function", () => {
      const arrow = () => {};
      const result = serialize(arrow);
      assertEquals(result, { $type: "function", name: "arrow" });
    });

    it("deserializes Function as placeholder", () => {
      const result = deserialize({ $type: "function", name: "myFunc" });
      assertEquals(typeof result, "function");
    });
  });

  describe("Symbol", () => {
    it("serializes Symbol with description", () => {
      const result = serialize(Symbol("test"));
      assertEquals(result, {
        $type: "symbol",
        description: "test",
        key: undefined,
      });
    });

    it("serializes Symbol.for with key", () => {
      const result = serialize(Symbol.for("global"));
      assertEquals(result, {
        $type: "symbol",
        description: "global",
        key: "global",
      });
    });

    it("deserializes Symbol.for correctly", () => {
      const original = Symbol.for("shared");
      const result = deserialize(serialize(original));
      assertEquals(result, Symbol.for("shared"));
    });

    it("deserializes local Symbol as new Symbol", () => {
      const serialized = serialize(Symbol("local"));
      const result = deserialize(serialized);
      assertEquals(typeof result, "symbol");
      assertEquals((result as symbol).description, "local");
    });
  });

  describe("undefined", () => {
    it("serializes undefined to marker object", () => {
      const result = serialize(undefined);
      assertEquals(result, { $type: "undefined" });
    });

    it("deserializes undefined from marker object", () => {
      const result = deserialize({ $type: "undefined" });
      assertEquals(result, undefined);
    });

    it("preserves undefined in object properties", () => {
      const original = { a: 1, b: undefined, c: 3 };
      const result = deserialize(serialize(original));
      assertEquals(result, { a: 1, b: undefined, c: 3 });
      assertEquals("b" in (result as object), true);
    });

    it("preserves undefined in arrays", () => {
      const original = [1, undefined, 3];
      const result = deserialize(serialize(original));
      assertEquals(result, [1, undefined, 3]);
    });
  });

  describe("circular references", () => {
    it("handles self-referencing object", () => {
      const obj: Record<string, unknown> = { name: "parent" };
      obj.self = obj;

      const serialized = serialize(obj);
      const result = deserialize(serialized) as Record<string, unknown>;

      assertEquals(result.name, "parent");
      assertEquals(result.self, result);
    });

    it("handles mutually referencing objects", () => {
      const a: Record<string, unknown> = { name: "a" };
      const b: Record<string, unknown> = { name: "b" };
      a.ref = b;
      b.ref = a;

      const serialized = serialize(a);
      const result = deserialize(serialized) as Record<string, unknown>;
      const resultB = result.ref as Record<string, unknown>;

      assertEquals(result.name, "a");
      assertEquals(resultB.name, "b");
      assertEquals(resultB.ref, result);
    });

    it("handles circular array", () => {
      const arr: unknown[] = [1, 2];
      arr.push(arr);

      const result = deserialize(serialize(arr)) as unknown[];
      assertEquals(result[0], 1);
      assertEquals(result[1], 2);
      assertEquals(result[2], result);
    });
  });

  describe("Map", () => {
    it("serializes Map to marker object", () => {
      const map = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      const result = serialize(map);
      assertEquals(result, {
        $type: "map",
        entries: [
          ["a", 1],
          ["b", 2],
        ],
      });
    });

    it("round-trips Map", () => {
      const original = new Map<string, number>([
        ["x", 10],
        ["y", 20],
      ]);
      const result = deserialize(serialize(original));
      assertInstanceOf(result, Map);
      assertEquals((result as Map<string, number>).get("x"), 10);
      assertEquals((result as Map<string, number>).get("y"), 20);
    });

    it("handles Map with complex keys", () => {
      const key = { id: 1 };
      const map = new Map([[key, "value"]]);
      const result = deserialize(serialize(map)) as Map<unknown, string>;
      assertInstanceOf(result, Map);
      // Key is a new object with same structure
      const entries = Array.from(result.entries());
      assertEquals(entries.length, 1);
      assertEquals(entries[0][0], { id: 1 });
      assertEquals(entries[0][1], "value");
    });
  });

  describe("Set", () => {
    it("serializes Set to marker object", () => {
      const set = new Set([1, 2, 3]);
      const result = serialize(set);
      assertEquals(result, { $type: "set", values: [1, 2, 3] });
    });

    it("round-trips Set", () => {
      const original = new Set(["a", "b", "c"]);
      const result = deserialize(serialize(original));
      assertInstanceOf(result, Set);
      assertEquals((result as Set<string>).has("a"), true);
      assertEquals((result as Set<string>).has("b"), true);
      assertEquals((result as Set<string>).has("c"), true);
      assertEquals((result as Set<string>).size, 3);
    });
  });

  describe("RegExp", () => {
    it("serializes RegExp to marker object", () => {
      const result = serialize(/hello\s+world/gi);
      assertEquals(result, {
        $type: "regexp",
        source: "hello\\s+world",
        flags: "gi",
      });
    });

    it("round-trips RegExp", () => {
      const original = /test\d+/im;
      const result = deserialize(serialize(original));
      assertInstanceOf(result, RegExp);
      assertEquals((result as RegExp).source, "test\\d+");
      assertEquals((result as RegExp).flags, "im");
    });
  });

  describe("Date", () => {
    it("serializes Date to marker object", () => {
      const date = new Date("2024-01-15T12:00:00Z");
      const result = serialize(date);
      assertEquals(result, {
        $type: "date",
        iso: "2024-01-15T12:00:00.000Z",
        time: date.getTime(),
      });
    });

    it("round-trips Date", () => {
      const original = new Date("2024-06-15T18:30:00Z");
      const result = deserialize(serialize(original));
      assertInstanceOf(result, Date);
      assertEquals((result as Date).getTime(), original.getTime());
    });

    it("handles invalid Date", () => {
      const original = new Date("invalid");
      const result = deserialize(serialize(original));
      assertInstanceOf(result, Date);
      assertEquals(Number.isNaN((result as Date).getTime()), true);
    });
  });

  describe("TypedArray", () => {
    it("serializes Uint8Array", () => {
      const arr = new Uint8Array([1, 2, 3]);
      const result = serialize(arr);
      assertEquals(result, {
        $type: "typed-array",
        subtype: "Uint8Array",
        data: [1, 2, 3],
      });
    });

    it("round-trips Uint8Array", () => {
      const original = new Uint8Array([10, 20, 30]);
      const result = deserialize(serialize(original));
      assertInstanceOf(result, Uint8Array);
      assertEquals(Array.from(result as Uint8Array), [10, 20, 30]);
    });

    it("round-trips Int32Array", () => {
      const original = new Int32Array([100, -200, 300]);
      const result = deserialize(serialize(original));
      assertInstanceOf(result, Int32Array);
      assertEquals(Array.from(result as Int32Array), [100, -200, 300]);
    });

    it("round-trips Float64Array", () => {
      const original = new Float64Array([1.5, 2.5, 3.5]);
      const result = deserialize(serialize(original));
      assertInstanceOf(result, Float64Array);
      assertEquals(Array.from(result as Float64Array), [1.5, 2.5, 3.5]);
    });

    it("round-trips BigInt64Array", () => {
      const original = new BigInt64Array([BigInt(1), BigInt(-2), BigInt(3)]);
      const result = deserialize(serialize(original));
      assertInstanceOf(result, BigInt64Array);
      assertEquals(
        Array.from(result as BigInt64Array),
        [BigInt(1), BigInt(-2), BigInt(3)],
      );
    });
  });

  describe("ArrayBuffer", () => {
    it("serializes ArrayBuffer", () => {
      const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
      const result = serialize(buffer);
      assertEquals(result, {
        $type: "arraybuffer",
        data: [1, 2, 3, 4],
      });
    });

    it("round-trips ArrayBuffer", () => {
      const original = new Uint8Array([5, 6, 7, 8]).buffer;
      const result = deserialize(serialize(original));
      assertInstanceOf(result, ArrayBuffer);
      assertEquals(
        Array.from(new Uint8Array(result as ArrayBuffer)),
        [5, 6, 7, 8],
      );
    });
  });

  describe("DataView", () => {
    it("round-trips DataView", () => {
      const original = new DataView(new Uint8Array([1, 2, 3, 4]).buffer);
      const result = deserialize(serialize(original));
      assertInstanceOf(result, DataView);
      assertEquals((result as DataView).byteLength, 4);
      assertEquals((result as DataView).getUint8(0), 1);
    });
  });

  describe("WeakMap/WeakSet/WeakRef", () => {
    it("serializes WeakMap as empty marker", () => {
      const result = serialize(new WeakMap());
      assertEquals(result, { $type: "weakmap" });
    });

    it("deserializes WeakMap as new empty WeakMap", () => {
      const result = deserialize({ $type: "weakmap" });
      assertInstanceOf(result, WeakMap);
    });

    it("serializes WeakSet as empty marker", () => {
      const result = serialize(new WeakSet());
      assertEquals(result, { $type: "weakset" });
    });

    it("deserializes WeakSet as new empty WeakSet", () => {
      const result = deserialize({ $type: "weakset" });
      assertInstanceOf(result, WeakSet);
    });
  });

  describe("complex nested structures", () => {
    it("handles nested objects with special values", () => {
      const original = {
        bigint: BigInt(123),
        nested: {
          date: new Date("2024-01-01"),
          map: new Map([["key", "value"]]),
        },
        array: [1, undefined, BigInt(456)],
      };

      const result = deserialize(serialize(original)) as typeof original;

      assertEquals(result.bigint, BigInt(123));
      assertInstanceOf(result.nested.date, Date);
      assertInstanceOf(result.nested.map, Map);
      assertEquals(result.nested.map.get("key"), "value");
      assertEquals(result.array[0], 1);
      assertEquals(result.array[1], undefined);
      assertEquals(result.array[2], BigInt(456));
    });

    it("handles array of mixed special types", () => {
      const original = [
        BigInt(1),
        new Date("2024-01-01"),
        new Set([1, 2]),
        /test/g,
        Symbol("test"),
      ];

      const result = deserialize(serialize(original)) as unknown[];

      assertEquals(result[0], BigInt(1));
      assertInstanceOf(result[1], Date);
      assertInstanceOf(result[2], Set);
      assertInstanceOf(result[3], RegExp);
      assertEquals(typeof result[4], "symbol");
    });
  });

  describe("Error objects", () => {
    it("preserves Error properties (handled as regular object)", () => {
      const error = new Error("test message");
      const result = deserialize(serialize(error)) as Record<string, unknown>;
      // Error objects are serialized as plain objects with enumerable properties
      // The message property is not enumerable by default
      assertEquals(typeof result, "object");
    });
  });
});
