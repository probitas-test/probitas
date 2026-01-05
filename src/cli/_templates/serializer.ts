/**
 * CBOR-based serializer for IPC communication
 *
 * Uses CBOR (Concise Binary Object Representation) for serialization,
 * with tagged values for custom types that CBOR doesn't natively support.
 *
 * CBOR natively supports:
 * - null, undefined, boolean, number, bigint, string
 * - Uint8Array (as byte string)
 * - Date (via tag 0/1, automatically handled)
 * - Arrays
 * - Plain objects (as CBOR maps with string keys)
 *
 * Custom types are encoded using tagged values (tag 256+):
 * - Symbol, Function, RegExp, Set, Map, Error
 * - Circular references
 * - Other TypedArrays, ArrayBuffer, DataView
 * - WeakMap, WeakSet, WeakRef (markers only)
 *
 * @module
 * @internal
 */

import {
  CborArrayDecodedStream,
  CborByteDecodedStream,
  CborMapDecodedStream,
  type CborPrimitiveType,
  type CborStreamInput,
  type CborStreamOutput,
  CborTag,
  CborTextDecodedStream,
  type CborType,
} from "@std/cbor";

/**
 * Custom tag numbers for types not natively supported by CBOR
 * Using private range (256-65535) to avoid conflicts with standard tags
 */
const Tag = {
  /** Symbol type */
  Symbol: 256,
  /** Symbol.for (global registry) */
  SymbolFor: 257,
  /** Function placeholder */
  Function: 258,
  // Note: 259 is reserved by @std/cbor (expects a map), skip it
  /** Set collection */
  Set: 260,
  /** Error object */
  Error: 261,
  /** Circular reference */
  Circular: 262,
  /** Int8Array */
  Int8Array: 263,
  /** Uint16Array */
  Uint16Array: 264,
  /** Int16Array */
  Int16Array: 265,
  /** Uint32Array */
  Uint32Array: 266,
  /** Int32Array */
  Int32Array: 267,
  /** Float32Array */
  Float32Array: 268,
  /** Float64Array */
  Float64Array: 269,
  /** BigInt64Array */
  BigInt64Array: 270,
  /** BigUint64Array */
  BigUint64Array: 271,
  /** Uint8ClampedArray */
  Uint8ClampedArray: 272,
  /** ArrayBuffer */
  ArrayBuffer: 273,
  /** DataView */
  DataView: 274,
  /** WeakMap (marker only) */
  WeakMap: 275,
  /** WeakSet (marker only) */
  WeakSet: 276,
  /** WeakRef (marker only) */
  WeakRef: 277,
  /** RegExp object */
  RegExp: 278,
  /** Map collection (as array of entries to support any key type) */
  Map: 279,
} as const;

/**
 * Get the tag number for a TypedArray
 */
function getTypedArrayTag(arr: ArrayBufferView): number | null {
  // Note: Uint8Array is handled natively by CBOR
  if (arr instanceof Int8Array) return Tag.Int8Array;
  if (arr instanceof Uint16Array) return Tag.Uint16Array;
  if (arr instanceof Int16Array) return Tag.Int16Array;
  if (arr instanceof Uint32Array) return Tag.Uint32Array;
  if (arr instanceof Int32Array) return Tag.Int32Array;
  if (arr instanceof Float32Array) return Tag.Float32Array;
  if (arr instanceof Float64Array) return Tag.Float64Array;
  if (arr instanceof BigInt64Array) return Tag.BigInt64Array;
  if (arr instanceof BigUint64Array) return Tag.BigUint64Array;
  if (arr instanceof Uint8ClampedArray) return Tag.Uint8ClampedArray;
  return null;
}

/**
 * Extract a clean ArrayBuffer from a Uint8Array view
 *
 * The Uint8Array's .buffer may be larger than the actual data due to
 * CBOR decoder's internal buffer reuse. We must slice using byteOffset
 * and byteLength to get only the relevant bytes.
 */
function extractBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

/**
 * Check if a value is a CBOR primitive type
 *
 * CborPrimitiveType includes: undefined, null, boolean, number, bigint, string,
 * Uint8Array, and Date. These types are natively supported by CBOR.
 */
function isCborPrimitiveType(x: unknown): x is CborPrimitiveType {
  if (x === null || x === undefined) return true;
  const t = typeof x;
  if (t === "boolean" || t === "number" || t === "bigint" || t === "string") {
    return true;
  }
  if (x instanceof Uint8Array || x instanceof Date) return true;
  return false;
}

/**
 * Convert a JavaScript value to CborStreamInput
 *
 * Handles JavaScript types that CBOR doesn't natively support by using
 * tagged values. Supports circular references via path tracking.
 *
 * @param value - Value to convert
 * @returns CborStreamInput representation for use with CborSequenceEncoderStream
 */
export function toCborStreamInput(value: unknown): CborStreamInput {
  const seen = new Map<object, string>();

  function convert(val: unknown, path: string): CborStreamInput {
    // Handle CBOR primitives first (null, undefined, boolean, number, bigint, string, Uint8Array, Date)
    if (isCborPrimitiveType(val)) {
      return val;
    }

    // Handle function and symbol (need tagging)
    if (typeof val === "function") {
      return new CborTag(Tag.Function, val.name || "");
    }
    if (typeof val === "symbol") {
      const key = Symbol.keyFor(val);
      if (key !== undefined) {
        return new CborTag(Tag.SymbolFor, key);
      }
      return new CborTag(Tag.Symbol, val.description ?? "");
    }

    // Check for circular reference
    if (seen.has(val)) {
      return new CborTag(Tag.Circular, seen.get(val)!);
    }

    // Mark object as seen
    seen.set(val, path);

    // Handle special object types
    if (val instanceof RegExp) {
      return new CborTag(Tag.RegExp, [val.source, val.flags]);
    }

    if (val instanceof Set) {
      const values: CborStreamInput[] = [];
      let i = 0;
      for (const v of val) {
        values.push(convert(v, `${path}.values[${i}]`));
        i++;
      }
      return new CborTag(Tag.Set, values);
    }

    if (val instanceof Map) {
      // Use tagged array of entries to preserve Map identity on round-trip
      // This supports any key type (unlike CBOR native maps which require string keys)
      const entries: [CborStreamInput, CborStreamInput][] = [];
      let i = 0;
      for (const [k, v] of val) {
        entries.push([
          convert(k, `${path}.entries[${i}][0]`),
          convert(v, `${path}.entries[${i}][1]`),
        ]);
        i++;
      }
      return new CborTag(Tag.Map, entries);
    }

    if (val instanceof WeakMap) {
      return new CborTag(Tag.WeakMap, null);
    }

    if (val instanceof WeakSet) {
      return new CborTag(Tag.WeakSet, null);
    }

    if (val instanceof WeakRef) {
      return new CborTag(Tag.WeakRef, null);
    }

    if (val instanceof Error) {
      return new CborTag(Tag.Error, {
        name: val.name,
        message: val.message,
        stack: val.stack,
        // Preserve custom properties
        ...Object.fromEntries(
          Object.entries(val).filter(([k]) =>
            !["name", "message", "stack"].includes(k)
          ),
        ),
      });
    }

    if (val instanceof DataView) {
      return new CborTag(
        Tag.DataView,
        new Uint8Array(val.buffer, val.byteOffset, val.byteLength),
      );
    }

    if (val instanceof ArrayBuffer) {
      return new CborTag(Tag.ArrayBuffer, new Uint8Array(val));
    }

    // Handle TypedArrays (except Uint8Array which is handled by isCborPrimitiveType)
    if (ArrayBuffer.isView(val) && !(val instanceof DataView)) {
      const tagNumber = getTypedArrayTag(val);
      if (tagNumber !== null) {
        // Convert to Uint8Array for binary transmission
        return new CborTag(
          tagNumber,
          new Uint8Array(val.buffer, val.byteOffset, val.byteLength),
        );
      }
    }

    // Handle arrays
    if (Array.isArray(val)) {
      return val.map((item, i) => convert(item, `${path}[${i}]`));
    }

    // Handle plain objects (encoded as CBOR map with string keys)
    const result: Record<string, CborStreamInput> = {};
    for (const key of Object.keys(val)) {
      result[key] = convert(
        (val as Record<string, unknown>)[key],
        `${path}.${key}`,
      );
    }
    return result;
  }

  return convert(value, "$");
}

/**
 * Convert CborType to a JavaScript value
 *
 * Restores special values that were serialized using tagged values.
 *
 * @param cborType - CborType to convert
 * @returns Original value (or close approximation)
 * @internal
 */
function fromCborType(cborType: CborType): unknown {
  const refs = new Map<string, unknown>();

  function convert(val: CborType, path: string): unknown {
    // Handle CBOR primitives (null, undefined, boolean, number, bigint, string, Uint8Array, Date)
    if (isCborPrimitiveType(val)) {
      return val;
    }

    // Handle CborTag
    if (val instanceof CborTag) {
      const tag = val.tagNumber;
      const content = val.tagContent as CborType;

      switch (tag) {
        case Tag.Symbol:
          return Symbol(content as string);
        case Tag.SymbolFor:
          return Symbol.for(content as string);
        case Tag.Function: {
          const name = content as string;
          const fn = new Function(
            `return function ${name || "anonymous"}() {}`,
          )();
          return fn;
        }
        case Tag.RegExp: {
          const [source, flags] = content as [string, string];
          return new RegExp(source, flags);
        }
        case Tag.Set: {
          const set = new Set<unknown>();
          refs.set(path, set);
          const values = content as CborType[];
          for (let i = 0; i < values.length; i++) {
            set.add(convert(values[i], `${path}.values[${i}]`));
          }
          return set;
        }
        case Tag.Map: {
          const map = new Map<unknown, unknown>();
          refs.set(path, map);
          const entries = content as [CborType, CborType][];
          for (let i = 0; i < entries.length; i++) {
            const [k, v] = entries[i];
            map.set(
              convert(k, `${path}.entries[${i}][0]`),
              convert(v, `${path}.entries[${i}][1]`),
            );
          }
          return map;
        }
        case Tag.Error: {
          const obj = content as Record<string, unknown>;
          const error = new Error(obj.message as string);
          error.name = obj.name as string;
          if (obj.stack) error.stack = obj.stack as string;
          // Restore custom properties using Object.assign
          const customProps: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(obj)) {
            if (!["name", "message", "stack"].includes(k)) {
              customProps[k] = v;
            }
          }
          Object.assign(error, customProps);
          return error;
        }
        case Tag.Circular: {
          const refPath = content as string;
          return refs.get(refPath);
        }
        case Tag.Int8Array:
          return new Int8Array(extractBuffer(content as Uint8Array));
        case Tag.Uint16Array:
          return new Uint16Array(extractBuffer(content as Uint8Array));
        case Tag.Int16Array:
          return new Int16Array(extractBuffer(content as Uint8Array));
        case Tag.Uint32Array:
          return new Uint32Array(extractBuffer(content as Uint8Array));
        case Tag.Int32Array:
          return new Int32Array(extractBuffer(content as Uint8Array));
        case Tag.Float32Array:
          return new Float32Array(extractBuffer(content as Uint8Array));
        case Tag.Float64Array:
          return new Float64Array(extractBuffer(content as Uint8Array));
        case Tag.BigInt64Array:
          return new BigInt64Array(extractBuffer(content as Uint8Array));
        case Tag.BigUint64Array:
          return new BigUint64Array(extractBuffer(content as Uint8Array));
        case Tag.Uint8ClampedArray:
          return new Uint8ClampedArray(extractBuffer(content as Uint8Array));
        case Tag.ArrayBuffer:
          return extractBuffer(content as Uint8Array);
        case Tag.DataView:
          return new DataView(extractBuffer(content as Uint8Array));
        case Tag.WeakMap:
          return new WeakMap();
        case Tag.WeakSet:
          return new WeakSet();
        case Tag.WeakRef:
          return { [Symbol.toStringTag]: "WeakRef (unrestorable)" };
        default:
          // Unknown tag, return content as-is
          return convert(content, path);
      }
    }

    // Handle arrays
    if (Array.isArray(val)) {
      const arr: unknown[] = [];
      refs.set(path, arr);
      for (let i = 0; i < val.length; i++) {
        arr.push(convert(val[i], `${path}[${i}]`));
      }
      return arr;
    }

    // Handle plain objects (from CBOR maps)
    const obj: Record<string, unknown> = {};
    refs.set(path, obj);
    for (const key of Object.keys(val)) {
      obj[key] = convert(
        (val as Record<string, CborType>)[key],
        `${path}.${key}`,
      );
    }
    return obj;
  }

  return convert(cborType, "$");
}

/**
 * Consume CborStreamOutput and convert to regular CborType
 *
 * CborSequenceDecoderStream returns streaming types for arrays and maps.
 * This function consumes those streams and returns regular values.
 */
async function consumeStreamOutput(item: CborStreamOutput): Promise<CborType> {
  // Handle CBOR primitives first (null, undefined, boolean, number, bigint, string, Uint8Array, Date)
  if (isCborPrimitiveType(item)) {
    return item;
  }

  if (item instanceof CborTag) {
    const consumed = await consumeStreamOutput(
      item.tagContent as CborStreamOutput,
    );
    return new CborTag(item.tagNumber, consumed);
  }

  if (item instanceof CborArrayDecodedStream) {
    const arr: CborType[] = [];
    for await (const elem of item) {
      arr.push(await consumeStreamOutput(elem));
    }
    return arr;
  }

  if (item instanceof CborMapDecodedStream) {
    // CBOR maps become plain objects (JS Maps use Tag.Map)
    const obj: Record<string, CborType> = {};
    for await (const [key, value] of item) {
      obj[key] = await consumeStreamOutput(value);
    }
    return obj;
  }

  if (item instanceof CborByteDecodedStream) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of item) {
      chunks.push(chunk);
    }
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  if (item instanceof CborTextDecodedStream) {
    const chunks: string[] = [];
    for await (const chunk of item) {
      chunks.push(chunk);
    }
    return chunks.join("");
  }

  // Plain object - should not happen with streaming decoder, but handle just in case
  console.debug(
    "[serializer] Unexpected plain object in consumeStreamOutput:",
    item,
  );
  return item as CborType;
}

/**
 * Deserialize CborStreamOutput from CborSequenceDecoderStream
 *
 * Use this when decoding via CborSequenceDecoderStream for RFC 8742 compliance.
 * Consumes streaming types and restores custom types from tagged values.
 *
 * @param item - CborStreamOutput from CborSequenceDecoderStream
 * @returns Original value (or close approximation)
 */
export async function fromCborStreamOutput(
  item: CborStreamOutput,
): Promise<unknown> {
  const cborType = await consumeStreamOutput(item);
  return fromCborType(cborType);
}
