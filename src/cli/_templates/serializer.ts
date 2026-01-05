/**
 * Custom JSON serializer for IPC communication
 *
 * Handles non-JSON-serializable values like BigInt, circular references,
 * Functions, Symbols, Map, Set, RegExp, Date, TypedArray, etc.
 *
 * Uses a marker object pattern with `$type` property to encode special values.
 *
 * @module
 * @internal
 */

/**
 * Marker for serialized special values
 */
interface SerializedMarker {
  readonly $type: string;
}

/**
 * Serialized BigInt
 */
interface SerializedBigInt extends SerializedMarker {
  readonly $type: "bigint";
  readonly value: string;
}

/**
 * Serialized Function
 */
interface SerializedFunction extends SerializedMarker {
  readonly $type: "function";
  readonly name: string;
}

/**
 * Serialized Symbol
 */
interface SerializedSymbol extends SerializedMarker {
  readonly $type: "symbol";
  readonly description: string | undefined;
  readonly key: string | undefined;
}

/**
 * Serialized undefined
 */
interface SerializedUndefined extends SerializedMarker {
  readonly $type: "undefined";
}

/**
 * Serialized circular reference
 */
interface SerializedCircularRef extends SerializedMarker {
  readonly $type: "circular";
  readonly path: string;
}

/**
 * Serialized Map
 */
interface SerializedMap extends SerializedMarker {
  readonly $type: "map";
  readonly entries: readonly [unknown, unknown][];
}

/**
 * Serialized Set
 */
interface SerializedSet extends SerializedMarker {
  readonly $type: "set";
  readonly values: readonly unknown[];
}

/**
 * Serialized RegExp
 */
interface SerializedRegExp extends SerializedMarker {
  readonly $type: "regexp";
  readonly source: string;
  readonly flags: string;
}

/**
 * Serialized Date
 */
interface SerializedDate extends SerializedMarker {
  readonly $type: "date";
  readonly iso: string;
  readonly time: number;
}

/**
 * Serialized TypedArray
 */
interface SerializedTypedArray extends SerializedMarker {
  readonly $type: "typed-array";
  readonly subtype:
    | "Uint8Array"
    | "Int8Array"
    | "Uint16Array"
    | "Int16Array"
    | "Uint32Array"
    | "Int32Array"
    | "Float32Array"
    | "Float64Array"
    | "BigInt64Array"
    | "BigUint64Array"
    | "Uint8ClampedArray";
  readonly data: readonly (number | string)[];
}

/**
 * Serialized ArrayBuffer
 */
interface SerializedArrayBuffer extends SerializedMarker {
  readonly $type: "arraybuffer";
  readonly data: readonly number[];
}

/**
 * Serialized DataView
 */
interface SerializedDataView extends SerializedMarker {
  readonly $type: "dataview";
  readonly data: readonly number[];
}

/**
 * Serialized WeakMap (cannot preserve contents)
 */
interface SerializedWeakMap extends SerializedMarker {
  readonly $type: "weakmap";
}

/**
 * Serialized WeakSet (cannot preserve contents)
 */
interface SerializedWeakSet extends SerializedMarker {
  readonly $type: "weakset";
}

/**
 * Serialized WeakRef (cannot preserve contents)
 */
interface SerializedWeakRef extends SerializedMarker {
  readonly $type: "weakref";
}

/**
 * All serialized marker types
 */
type SerializedValue =
  | SerializedBigInt
  | SerializedFunction
  | SerializedSymbol
  | SerializedUndefined
  | SerializedCircularRef
  | SerializedMap
  | SerializedSet
  | SerializedRegExp
  | SerializedDate
  | SerializedTypedArray
  | SerializedArrayBuffer
  | SerializedDataView
  | SerializedWeakMap
  | SerializedWeakSet
  | SerializedWeakRef;

/**
 * Check if value is a serialized marker
 */
function isSerializedMarker(value: unknown): value is SerializedValue {
  return (
    value !== null &&
    typeof value === "object" &&
    "$type" in value &&
    typeof (value as SerializedMarker).$type === "string"
  );
}

/**
 * Get TypedArray subtype name
 */
function getTypedArraySubtype(
  arr: ArrayBufferView,
): SerializedTypedArray["subtype"] | null {
  if (arr instanceof Uint8Array) return "Uint8Array";
  if (arr instanceof Int8Array) return "Int8Array";
  if (arr instanceof Uint16Array) return "Uint16Array";
  if (arr instanceof Int16Array) return "Int16Array";
  if (arr instanceof Uint32Array) return "Uint32Array";
  if (arr instanceof Int32Array) return "Int32Array";
  if (arr instanceof Float32Array) return "Float32Array";
  if (arr instanceof Float64Array) return "Float64Array";
  if (arr instanceof BigInt64Array) return "BigInt64Array";
  if (arr instanceof BigUint64Array) return "BigUint64Array";
  if (arr instanceof Uint8ClampedArray) return "Uint8ClampedArray";
  return null;
}

/**
 * Create TypedArray from subtype name and data
 */
function createTypedArray(
  subtype: SerializedTypedArray["subtype"],
  data: readonly (number | string)[],
): ArrayBufferView {
  switch (subtype) {
    case "Uint8Array":
      return new Uint8Array(data as number[]);
    case "Int8Array":
      return new Int8Array(data as number[]);
    case "Uint16Array":
      return new Uint16Array(data as number[]);
    case "Int16Array":
      return new Int16Array(data as number[]);
    case "Uint32Array":
      return new Uint32Array(data as number[]);
    case "Int32Array":
      return new Int32Array(data as number[]);
    case "Float32Array":
      return new Float32Array(data as number[]);
    case "Float64Array":
      return new Float64Array(data as number[]);
    case "BigInt64Array":
      return new BigInt64Array((data as string[]).map(BigInt));
    case "BigUint64Array":
      return new BigUint64Array((data as string[]).map(BigInt));
    case "Uint8ClampedArray":
      return new Uint8ClampedArray(data as number[]);
  }
}

/**
 * Serialize a value to a JSON-safe representation
 *
 * Handles:
 * - BigInt: Converted to { $type: "bigint", value: string }
 * - Function: Converted to { $type: "function", name: string }
 * - Symbol: Converted to { $type: "symbol", description, key }
 * - undefined: Converted to { $type: "undefined" }
 * - Circular references: Converted to { $type: "circular", path: string }
 * - Map: Converted to { $type: "map", entries: [...] }
 * - Set: Converted to { $type: "set", values: [...] }
 * - RegExp: Converted to { $type: "regexp", source, flags }
 * - Date: Converted to { $type: "date", iso, time }
 * - TypedArray: Converted to { $type: "typed-array", subtype, data }
 * - ArrayBuffer: Converted to { $type: "arraybuffer", data }
 * - DataView: Converted to { $type: "dataview", data }
 * - WeakMap/WeakSet/WeakRef: Marker only (contents cannot be serialized)
 *
 * @param value - Value to serialize
 * @returns JSON-safe representation
 */
export function serialize(value: unknown): unknown {
  const seen = new Map<object, string>();

  function serializeValue(val: unknown, path: string): unknown {
    // Handle primitives
    if (val === null) return null;
    if (val === undefined) return { $type: "undefined" } as SerializedUndefined;

    switch (typeof val) {
      case "bigint":
        return { $type: "bigint", value: val.toString() } as SerializedBigInt;
      case "function":
        return {
          $type: "function",
          name: val.name || "",
        } as SerializedFunction;
      case "symbol": {
        const key = Symbol.keyFor(val);
        return {
          $type: "symbol",
          description: val.description,
          key,
        } as SerializedSymbol;
      }
      case "boolean":
      case "number":
      case "string":
        return val;
    }

    // Handle objects
    if (typeof val !== "object") return val;

    // Check for circular reference
    if (seen.has(val)) {
      return {
        $type: "circular",
        path: seen.get(val)!,
      } as SerializedCircularRef;
    }

    // Mark object as seen
    seen.set(val, path);

    // Handle special object types
    if (val instanceof Date) {
      const time = val.getTime();
      return {
        $type: "date",
        iso: Number.isNaN(time) ? "Invalid Date" : val.toISOString(),
        time,
      } as SerializedDate;
    }

    if (val instanceof RegExp) {
      return {
        $type: "regexp",
        source: val.source,
        flags: val.flags,
      } as SerializedRegExp;
    }

    if (val instanceof Map) {
      const entries: [unknown, unknown][] = [];
      let i = 0;
      for (const [k, v] of val) {
        entries.push([
          serializeValue(k, `${path}.entries[${i}][0]`),
          serializeValue(v, `${path}.entries[${i}][1]`),
        ]);
        i++;
      }
      return { $type: "map", entries } as SerializedMap;
    }

    if (val instanceof Set) {
      const values: unknown[] = [];
      let i = 0;
      for (const v of val) {
        values.push(serializeValue(v, `${path}.values[${i}]`));
        i++;
      }
      return { $type: "set", values } as SerializedSet;
    }

    if (val instanceof WeakMap) {
      return { $type: "weakmap" } as SerializedWeakMap;
    }

    if (val instanceof WeakSet) {
      return { $type: "weakset" } as SerializedWeakSet;
    }

    if (val instanceof WeakRef) {
      return { $type: "weakref" } as SerializedWeakRef;
    }

    if (val instanceof DataView) {
      return {
        $type: "dataview",
        data: Array.from(
          new Uint8Array(val.buffer, val.byteOffset, val.byteLength),
        ),
      } as SerializedDataView;
    }

    if (val instanceof ArrayBuffer) {
      return {
        $type: "arraybuffer",
        data: Array.from(new Uint8Array(val)),
      } as SerializedArrayBuffer;
    }

    // Check for TypedArray (must be after ArrayBuffer check)
    if (ArrayBuffer.isView(val) && !(val instanceof DataView)) {
      const subtype = getTypedArraySubtype(val);
      if (subtype) {
        const typedArray = val as
          | Uint8Array
          | Int8Array
          | Uint16Array
          | Int16Array
          | Uint32Array
          | Int32Array
          | Float32Array
          | Float64Array
          | BigInt64Array
          | BigUint64Array
          | Uint8ClampedArray;
        const data: (number | string)[] = [];
        for (let i = 0; i < typedArray.length; i++) {
          const v = typedArray[i];
          // BigInt64Array and BigUint64Array contain BigInt values
          data.push(typeof v === "bigint" ? v.toString() : (v as number));
        }
        return { $type: "typed-array", subtype, data } as SerializedTypedArray;
      }
    }

    // Handle arrays
    if (Array.isArray(val)) {
      return val.map((item, i) => serializeValue(item, `${path}[${i}]`));
    }

    // Handle plain objects
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(val)) {
      result[key] = serializeValue(
        (val as Record<string, unknown>)[key],
        `${path}.${key}`,
      );
    }
    return result;
  }

  return serializeValue(value, "$");
}

/**
 * Deserialize a value from its JSON-safe representation
 *
 * Restores special values that were serialized by serialize().
 *
 * @param value - Serialized value
 * @returns Original value (or close approximation)
 */
export function deserialize(value: unknown): unknown {
  const refs = new Map<string, unknown>();

  function deserializeValue(val: unknown, path: string): unknown {
    // Handle primitives
    if (val === null || typeof val !== "object") return val;

    // Check for serialized marker
    if (isSerializedMarker(val)) {
      switch (val.$type) {
        case "undefined":
          return undefined;
        case "bigint":
          return BigInt((val as SerializedBigInt).value);
        case "function": {
          // Create a placeholder function with the original name
          const name = (val as SerializedFunction).name;
          const fn = new Function(
            `return function ${name || "anonymous"}() {}`,
          )();
          return fn;
        }
        case "symbol": {
          const { description, key } = val as SerializedSymbol;
          if (key !== undefined) {
            return Symbol.for(key);
          }
          return Symbol(description);
        }
        case "circular": {
          const refPath = (val as SerializedCircularRef).path;
          return refs.get(refPath);
        }
        case "date": {
          const { time } = val as SerializedDate;
          return new Date(time);
        }
        case "regexp": {
          const { source, flags } = val as SerializedRegExp;
          return new RegExp(source, flags);
        }
        case "map": {
          const map = new Map();
          refs.set(path, map);
          const { entries } = val as SerializedMap;
          for (let i = 0; i < entries.length; i++) {
            const [k, v] = entries[i];
            map.set(
              deserializeValue(k, `${path}.entries[${i}][0]`),
              deserializeValue(v, `${path}.entries[${i}][1]`),
            );
          }
          return map;
        }
        case "set": {
          const set = new Set();
          refs.set(path, set);
          const { values } = val as SerializedSet;
          for (let i = 0; i < values.length; i++) {
            set.add(deserializeValue(values[i], `${path}.values[${i}]`));
          }
          return set;
        }
        case "typed-array": {
          const { subtype, data } = val as SerializedTypedArray;
          return createTypedArray(subtype, data);
        }
        case "arraybuffer": {
          const { data } = val as SerializedArrayBuffer;
          return new Uint8Array(data).buffer;
        }
        case "dataview": {
          const { data } = val as SerializedDataView;
          return new DataView(new Uint8Array(data).buffer);
        }
        case "weakmap":
          return new WeakMap();
        case "weakset":
          return new WeakSet();
        case "weakref":
          // Cannot restore WeakRef, return a placeholder
          return { [Symbol.toStringTag]: "WeakRef (unrestorable)" };
      }
    }

    // Handle arrays
    if (Array.isArray(val)) {
      const arr: unknown[] = [];
      refs.set(path, arr);
      for (let i = 0; i < val.length; i++) {
        arr.push(deserializeValue(val[i], `${path}[${i}]`));
      }
      return arr;
    }

    // Handle plain objects
    const obj: Record<string, unknown> = {};
    refs.set(path, obj);
    for (const key of Object.keys(val)) {
      obj[key] = deserializeValue(
        (val as Record<string, unknown>)[key],
        `${path}.${key}`,
      );
    }
    return obj;
  }

  return deserializeValue(value, "$");
}
