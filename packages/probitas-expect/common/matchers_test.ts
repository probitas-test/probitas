/**
 * Tests for matching utility functions.
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { containsSubarray, containsSubset } from "./matchers.ts";

Deno.test("containsSubset", async (t) => {
  await t.step("primitives: null matches null", () => {
    assertEquals(containsSubset(null, null), true);
  });

  await t.step("primitives: null does not match other values", () => {
    assertEquals(containsSubset(null, 0), false);
    assertEquals(containsSubset(null, ""), false);
    assertEquals(containsSubset(null, false), false);
  });

  await t.step("primitives: string matches exactly", () => {
    assertEquals(containsSubset("hello", "hello"), true);
  });

  await t.step("primitives: string does not match different string", () => {
    assertEquals(containsSubset("hello", "world"), false);
  });

  await t.step("primitives: number matches exactly", () => {
    assertEquals(containsSubset(42, 42), true);
  });

  await t.step("primitives: number does not match different number", () => {
    assertEquals(containsSubset(42, 43), false);
  });

  await t.step("primitives: boolean matches exactly", () => {
    assertEquals(containsSubset(true, true), true);
    assertEquals(containsSubset(false, false), true);
  });

  await t.step("primitives: boolean does not match different boolean", () => {
    assertEquals(containsSubset(true, false), false);
  });

  await t.step("primitives: undefined matches exactly", () => {
    assertEquals(containsSubset(undefined, undefined), true);
  });

  await t.step("primitives: different types do not match", () => {
    assertEquals(containsSubset(0, false), false);
    assertEquals(containsSubset("0", 0), false);
    assertEquals(containsSubset(null, undefined), false);
  });

  await t.step("objects: empty subset matches any object", () => {
    assertEquals(containsSubset({ a: 1, b: 2 }, {}), true);
  });

  await t.step("objects: exact property match", () => {
    assertEquals(
      containsSubset({ name: "Alice", age: 30 }, { name: "Alice", age: 30 }),
      true,
    );
  });

  await t.step("objects: partial property match", () => {
    assertEquals(
      containsSubset({ name: "Alice", age: 30, city: "Tokyo" }, {
        name: "Alice",
        age: 30,
      }),
      true,
    );
  });

  await t.step("objects: property value mismatch", () => {
    assertEquals(
      containsSubset({ name: "Alice", age: 30 }, { name: "Bob" }),
      false,
    );
  });

  await t.step("objects: missing required property", () => {
    assertEquals(containsSubset({ name: "Alice" }, { age: 30 }), false);
  });

  await t.step("objects: null does not match object", () => {
    assertEquals(containsSubset(null, {}), false);
  });

  await t.step("objects: primitive does not match object", () => {
    assertEquals(containsSubset("string", {}), false);
    assertEquals(containsSubset(42, {}), false);
  });

  await t.step("nested objects: deep match", () => {
    const obj = {
      user: {
        name: "Alice",
        address: {
          city: "Tokyo",
          country: "Japan",
        },
      },
    };
    const subset = {
      user: {
        address: {
          city: "Tokyo",
        },
      },
    };
    assertEquals(containsSubset(obj, subset), true);
  });

  await t.step("nested objects: deep mismatch", () => {
    const obj = {
      user: {
        name: "Alice",
        address: {
          city: "Tokyo",
        },
      },
    };
    const subset = {
      user: {
        address: {
          city: "Osaka",
        },
      },
    };
    assertEquals(containsSubset(obj, subset), false);
  });

  await t.step("nested objects: missing nested property", () => {
    const obj = {
      user: {
        name: "Alice",
      },
    };
    const subset = {
      user: {
        address: {
          city: "Tokyo",
        },
      },
    };
    assertEquals(containsSubset(obj, subset), false);
  });

  await t.step("arrays: exact match with same length and order", () => {
    assertEquals(containsSubset([1, 2, 3], [1, 2, 3]), true);
  });

  await t.step("arrays: different length fails", () => {
    assertEquals(containsSubset([1, 2, 3], [1, 2]), false);
    assertEquals(containsSubset([1, 2], [1, 2, 3]), false);
  });

  await t.step("arrays: different order fails", () => {
    assertEquals(containsSubset([1, 2, 3], [3, 2, 1]), false);
  });

  await t.step("arrays: element value mismatch", () => {
    assertEquals(containsSubset([1, 2, 3], [1, 2, 4]), false);
  });

  await t.step("arrays: empty arrays match", () => {
    assertEquals(containsSubset([], []), true);
  });

  await t.step("arrays: non-array does not match array", () => {
    assertEquals(containsSubset("not array", []), false);
    assertEquals(containsSubset({}, []), false);
  });

  await t.step("arrays: object arrays with partial match", () => {
    const obj = [
      { id: 1, name: "Alice", age: 30 },
      { id: 2, name: "Bob", age: 25 },
    ];
    const subset = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    assertEquals(containsSubset(obj, subset), true);
  });

  await t.step("arrays: nested arrays", () => {
    assertEquals(
      containsSubset([[1, 2], [3, 4]], [[1, 2], [3, 4]]),
      true,
    );
    assertEquals(
      containsSubset([[1, 2], [3, 4]], [[1, 2], [3, 5]]),
      false,
    );
  });

  await t.step("complex structures: deeply nested mix", () => {
    const obj = {
      data: {
        users: [
          { id: 1, profile: { name: "Alice", age: 30 } },
          { id: 2, profile: { name: "Bob", age: 25 } },
        ],
        metadata: {
          count: 2,
          version: "1.0",
        },
      },
    };
    const subset = {
      data: {
        users: [
          { id: 1, profile: { name: "Alice" } },
          { id: 2, profile: { name: "Bob" } },
        ],
        metadata: {
          count: 2,
        },
      },
    };
    assertEquals(containsSubset(obj, subset), true);
  });

  await t.step("edge cases: function properties are ignored", () => {
    const obj = { fn: () => {}, value: 42 };
    const subset = { value: 42 };
    assertEquals(containsSubset(obj, subset), true);
  });

  await t.step("edge cases: special number values", () => {
    assertEquals(containsSubset(NaN, NaN), false); // NaN !== NaN
    assertEquals(containsSubset(Infinity, Infinity), true);
    assertEquals(containsSubset(-Infinity, -Infinity), true);
  });
});

Deno.test("containsSubarray", async (t) => {
  await t.step("empty subarray always matches", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const sub = new Uint8Array([]);
    assertEquals(containsSubarray(arr, sub), true);
  });

  await t.step("empty array contains empty subarray", () => {
    const arr = new Uint8Array([]);
    const sub = new Uint8Array([]);
    assertEquals(containsSubarray(arr, sub), true);
  });

  await t.step("subarray longer than array returns false", () => {
    const arr = new Uint8Array([1, 2]);
    const sub = new Uint8Array([1, 2, 3]);
    assertEquals(containsSubarray(arr, sub), false);
  });

  await t.step("exact match at start", () => {
    const arr = new Uint8Array([1, 2, 3, 4, 5]);
    const sub = new Uint8Array([1, 2, 3]);
    assertEquals(containsSubarray(arr, sub), true);
  });

  await t.step("match in middle", () => {
    const arr = new Uint8Array([1, 2, 3, 4, 5]);
    const sub = new Uint8Array([3, 4]);
    assertEquals(containsSubarray(arr, sub), true);
  });

  await t.step("match at end", () => {
    const arr = new Uint8Array([1, 2, 3, 4, 5]);
    const sub = new Uint8Array([4, 5]);
    assertEquals(containsSubarray(arr, sub), true);
  });

  await t.step("full array match", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const sub = new Uint8Array([1, 2, 3]);
    assertEquals(containsSubarray(arr, sub), true);
  });

  await t.step("no match found", () => {
    const arr = new Uint8Array([1, 2, 3, 4, 5]);
    const sub = new Uint8Array([3, 5]);
    assertEquals(containsSubarray(arr, sub), false);
  });

  await t.step("partial sequence not contiguous", () => {
    const arr = new Uint8Array([1, 2, 3, 4, 5]);
    const sub = new Uint8Array([2, 4]);
    assertEquals(containsSubarray(arr, sub), false);
  });

  await t.step("single byte match", () => {
    const arr = new Uint8Array([1, 2, 3, 4, 5]);
    const sub = new Uint8Array([3]);
    assertEquals(containsSubarray(arr, sub), true);
  });

  await t.step("single byte no match", () => {
    const arr = new Uint8Array([1, 2, 3, 4, 5]);
    const sub = new Uint8Array([6]);
    assertEquals(containsSubarray(arr, sub), false);
  });

  await t.step("zeros in sequence", () => {
    const arr = new Uint8Array([0, 0, 1, 2, 0, 0]);
    const sub = new Uint8Array([0, 0]);
    assertEquals(containsSubarray(arr, sub), true);
  });

  await t.step("identical repeated patterns", () => {
    const arr = new Uint8Array([1, 2, 1, 2, 1, 2]);
    const sub = new Uint8Array([1, 2, 1, 2]);
    assertEquals(containsSubarray(arr, sub), true);
  });

  await t.step("maximum byte value (255)", () => {
    const arr = new Uint8Array([253, 254, 255]);
    const sub = new Uint8Array([254, 255]);
    assertEquals(containsSubarray(arr, sub), true);
  });

  await t.step("case sensitive: different at end", () => {
    const arr = new Uint8Array([1, 2, 3, 4]);
    const sub = new Uint8Array([1, 2, 3, 5]);
    assertEquals(containsSubarray(arr, sub), false);
  });

  await t.step("large array with small subarray", () => {
    const arr = new Uint8Array(1000);
    for (let i = 0; i < 1000; i++) arr[i] = i % 256;
    const sub = new Uint8Array([100, 101, 102]);
    assertEquals(containsSubarray(arr, sub), true);
  });
});
