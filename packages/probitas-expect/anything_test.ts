import { assertEquals, assertThrows } from "@std/assert";
import { expectAnything } from "./anything.ts";
import { expect as expectStd, fn } from "@std/expect";

Deno.test("expectAnything - basic matchers", async (t) => {
  await t.step("toBe", () => {
    expectAnything(42).toBe(42);
    assertThrows(() => expectAnything(42).toBe(43));
  });

  await t.step("toEqual", () => {
    expectAnything({ a: 1, b: 2 }).toEqual({ a: 1, b: 2 });
    assertThrows(() => expectAnything({ a: 1 }).toEqual({ a: 2 }));
  });

  await t.step("toStrictEqual", () => {
    expectAnything({ a: 1 }).toStrictEqual({ a: 1 });
    assertThrows(() =>
      expectAnything({ a: 1, b: undefined }).toStrictEqual({ a: 1 })
    );
  });

  await t.step("toBeDefined", () => {
    expectAnything(42).toBeDefined();
    assertThrows(() => expectAnything(undefined).toBeDefined());
  });

  await t.step("toBeUndefined", () => {
    expectAnything(undefined).toBeUndefined();
    assertThrows(() => expectAnything(42).toBeUndefined());
  });

  await t.step("toBeNull", () => {
    expectAnything(null).toBeNull();
    assertThrows(() => expectAnything(42).toBeNull());
  });

  await t.step("toBeNaN", () => {
    expectAnything(NaN).toBeNaN();
    assertThrows(() => expectAnything(42).toBeNaN());
  });

  await t.step("toBeTruthy", () => {
    expectAnything(42).toBeTruthy();
    expectAnything("hello").toBeTruthy();
    assertThrows(() => expectAnything(0).toBeTruthy());
    assertThrows(() => expectAnything("").toBeTruthy());
  });

  await t.step("toBeFalsy", () => {
    expectAnything(0).toBeFalsy();
    expectAnything("").toBeFalsy();
    expectAnything(null).toBeFalsy();
    assertThrows(() => expectAnything(42).toBeFalsy());
  });
});

Deno.test("expectAnything - comparison matchers", async (t) => {
  await t.step("toBeGreaterThan", () => {
    expectAnything(42).toBeGreaterThan(40);
    assertThrows(() => expectAnything(42).toBeGreaterThan(42));
    assertThrows(() => expectAnything(42).toBeGreaterThan(50));
  });

  await t.step("toBeGreaterThanOrEqual", () => {
    expectAnything(42).toBeGreaterThanOrEqual(42);
    expectAnything(42).toBeGreaterThanOrEqual(40);
    assertThrows(() => expectAnything(42).toBeGreaterThanOrEqual(50));
  });

  await t.step("toBeLessThan", () => {
    expectAnything(42).toBeLessThan(50);
    assertThrows(() => expectAnything(42).toBeLessThan(42));
    assertThrows(() => expectAnything(42).toBeLessThan(40));
  });

  await t.step("toBeLessThanOrEqual", () => {
    expectAnything(42).toBeLessThanOrEqual(42);
    expectAnything(42).toBeLessThanOrEqual(50);
    assertThrows(() => expectAnything(42).toBeLessThanOrEqual(40));
  });

  await t.step("toBeCloseTo", () => {
    expectAnything(0.1 + 0.2).toBeCloseTo(0.3);
    expectAnything(0.1 + 0.2).toBeCloseTo(0.3, 5);
    assertThrows(() => expectAnything(0.1 + 0.2).toBeCloseTo(0.4));
  });
});

Deno.test("expectAnything - string matchers", async (t) => {
  await t.step("toMatch - RegExp", () => {
    expectAnything("hello world").toMatch(/world/);
    expectAnything("hello world").toMatch(/^hello/);
    assertThrows(() => expectAnything("hello world").toMatch(/^world/));
    assertThrows(() => expectAnything("hello").toMatch(/world/));
  });

  await t.step("toContain", () => {
    expectAnything("hello world").toContain("world");
    expectAnything([1, 2, 3]).toContain(2);
    assertThrows(() => expectAnything("hello").toContain("world"));
    assertThrows(() => expectAnything([1, 2, 3]).toContain(4));
  });
});

Deno.test("expectAnything - array/object matchers", async (t) => {
  await t.step("toContainEqual", () => {
    expectAnything([{ a: 1 }, { b: 2 }]).toContainEqual({ a: 1 });
    assertThrows(() =>
      expectAnything([{ a: 1 }, { b: 2 }]).toContainEqual({ c: 3 })
    );
  });

  await t.step("toHaveLength", () => {
    expectAnything([1, 2, 3]).toHaveLength(3);
    expectAnything("hello").toHaveLength(5);
    assertThrows(() => expectAnything([1, 2, 3]).toHaveLength(5));
  });

  await t.step("toMatchObject", () => {
    expectAnything({ a: 1, b: 2, c: 3 }).toMatchObject({ a: 1, b: 2 });
    assertThrows(() =>
      expectAnything({ a: 1, b: 2 }).toMatchObject({ a: 1, c: 3 })
    );
  });

  await t.step("toHaveProperty", () => {
    expectAnything({ a: { b: { c: 42 } } }).toHaveProperty("a.b.c");
    expectAnything({ a: { b: { c: 42 } } }).toHaveProperty("a.b.c", 42);
    expectAnything({ a: { b: { c: 42 } } }).toHaveProperty(["a", "b", "c"]);
    expectAnything({ a: { b: { c: 42 } } }).toHaveProperty(
      ["a", "b", "c"],
      42,
    );
    assertThrows(() => expectAnything({ a: 1 }).toHaveProperty("b"));
  });
});

Deno.test("expectAnything - type matchers", async (t) => {
  await t.step("toBeInstanceOf", () => {
    expectAnything(new Date()).toBeInstanceOf(Date);
    expectAnything(new Error("test")).toBeInstanceOf(Error);
    assertThrows(() => expectAnything(new Date()).toBeInstanceOf(Error));
  });

  await t.step("toThrow", () => {
    expectAnything(() => {
      throw new Error("test");
    }).toThrow();
    expectAnything(() => {
      throw new Error("test message");
    }).toThrow("test message");
    expectAnything(() => {
      throw new Error("test message");
    }).toThrow(/test/);
    assertThrows(() =>
      expectAnything(() => {
        // no throw
      }).toThrow()
    );
  });
});

Deno.test("expectAnything - mock matchers", async (t) => {
  await t.step("toHaveBeenCalled", () => {
    const mock = fn();
    assertThrows(() => expectAnything(mock).toHaveBeenCalled());
    mock();
    expectAnything(mock).toHaveBeenCalled();
  });

  await t.step("toHaveBeenCalledTimes", () => {
    const mock = fn();
    expectAnything(mock).toHaveBeenCalledTimes(0);
    mock();
    mock();
    expectAnything(mock).toHaveBeenCalledTimes(2);
    assertThrows(() => expectAnything(mock).toHaveBeenCalledTimes(3));
  });

  await t.step("toHaveBeenCalledWith", () => {
    const mock = fn();
    mock(1, 2, 3);
    expectAnything(mock).toHaveBeenCalledWith(1, 2, 3);
    assertThrows(() => expectAnything(mock).toHaveBeenCalledWith(4, 5, 6));
  });

  await t.step("toHaveBeenLastCalledWith", () => {
    const mock = fn();
    mock(1, 2, 3);
    mock(4, 5, 6);
    expectAnything(mock).toHaveBeenLastCalledWith(4, 5, 6);
    assertThrows(() => expectAnything(mock).toHaveBeenLastCalledWith(1, 2, 3));
  });

  await t.step("toHaveBeenNthCalledWith", () => {
    const mock = fn();
    mock(1, 2, 3);
    mock(4, 5, 6);
    expectAnything(mock).toHaveBeenNthCalledWith(1, 1, 2, 3);
    expectAnything(mock).toHaveBeenNthCalledWith(2, 4, 5, 6);
    assertThrows(() =>
      expectAnything(mock).toHaveBeenNthCalledWith(1, 4, 5, 6)
    );
  });

  await t.step("toHaveReturned", () => {
    const mock = fn(() => 42);
    assertThrows(() => expectAnything(mock).toHaveReturned());
    mock();
    expectAnything(mock).toHaveReturned();
  });

  await t.step("toHaveReturnedTimes", () => {
    const mock = fn(() => 42);
    expectAnything(mock).toHaveReturnedTimes(0);
    mock();
    mock();
    expectAnything(mock).toHaveReturnedTimes(2);
    assertThrows(() => expectAnything(mock).toHaveReturnedTimes(3));
  });

  await t.step("toHaveReturnedWith", () => {
    const mock = fn(() => 42);
    mock();
    expectAnything(mock).toHaveReturnedWith(42);
    assertThrows(() => expectAnything(mock).toHaveReturnedWith(43));
  });

  await t.step("toHaveLastReturnedWith", () => {
    const mock = fn(() => 1);
    mock();
    const mock2 = fn(() => 2);
    mock2();
    expectAnything(mock2).toHaveLastReturnedWith(2);
    assertThrows(() => expectAnything(mock2).toHaveLastReturnedWith(1));
  });

  await t.step("toHaveNthReturnedWith", () => {
    const mock = fn(() => 1);
    mock();
    mock();
    expectAnything(mock).toHaveNthReturnedWith(1, 1);
    expectAnything(mock).toHaveNthReturnedWith(2, 1);
    assertThrows(() => expectAnything(mock).toHaveNthReturnedWith(1, 2));
  });
});

Deno.test("expectAnything - negation with .not", async (t) => {
  await t.step("not.toBe", () => {
    expectAnything(42).not.toBe(43);
    assertThrows(() => expectAnything(42).not.toBe(42));
  });

  await t.step("not.toEqual", () => {
    expectAnything({ a: 1 }).not.toEqual({ a: 2 });
    assertThrows(() => expectAnything({ a: 1 }).not.toEqual({ a: 1 }));
  });

  await t.step("not.toBeNull", () => {
    expectAnything(42).not.toBeNull();
    assertThrows(() => expectAnything(null).not.toBeNull());
  });

  await t.step("not.toContain", () => {
    expectAnything([1, 2, 3]).not.toContain(4);
    assertThrows(() => expectAnything([1, 2, 3]).not.toContain(2));
  });
});

Deno.test("expectAnything - state-based negation", async (t) => {
  await t.step("double negation (.not.not) cancels out", () => {
    // .not.not should result in positive assertion
    expectAnything(42).not.not.toBe(42);
    assertThrows(() => expectAnything(42).not.not.toBe(43));
  });

  await t.step("triple negation (.not.not.not) results in negation", () => {
    // .not.not.not should result in negated assertion
    expectAnything(42).not.not.not.toBe(43);
    assertThrows(() => expectAnything(42).not.not.not.toBe(42));
  });

  await t.step("independent negations in chain", () => {
    // Both .not calls are independent - negation resets after each method
    expectAnything(42)
      .not.toBe(43) // First: negated assertion (42 != 43) ✓
      .not.toBe(43); // Second: negated assertion (42 != 43) ✓
  });

  await t.step("alternating negations and positives", () => {
    expectAnything(42)
      .not.toBe(41) // negated: 42 != 41 ✓
      .toBe(42) // positive: 42 === 42 ✓
      .not.toBe(43) // negated: 42 != 43 ✓
      .not.toBeNull(); // negated: 42 != null ✓
  });

  await t.step("negation state resets between method calls", () => {
    // Calling .not followed by method consumes the flag, resetting for next call
    expectAnything("hello")
      .not.toBe("world") // Negated
      .toBe("hello") // Not negated (flag was reset)
      .not.toBeUndefined(); // Negated
  });

  await t.step(".not returns same object instance", () => {
    const instance = expectAnything(42);
    const negated = instance.not;
    const negatedAgain = negated.not;
    // All should work on the same underlying object
    negatedAgain.toBe(42);
  });
});

Deno.test("expectAnything - method chaining", async (t) => {
  await t.step("chain multiple assertions", () => {
    expectAnything(42)
      .toBeDefined()
      .toBeGreaterThan(40)
      .toBeLessThan(50)
      .toBe(42);
  });

  await t.step("chain with .not", () => {
    // .not applies only to the immediately following assertion
    expectAnything(42)
      .toBeDefined()
      .not.toBe(43)
      .not.toBeNull()
      .toBeGreaterThan(40);

    expectAnything("hello")
      .toBeDefined()
      .not.toBe("world")
      .not.toBeNull()
      .toContain("hello");

    // Mixing positive and negative assertions freely
    expectAnything([1, 2, 3])
      .toHaveLength(3)
      .not.toContain(4)
      .toContain(2)
      .not.toContain(5);
  });

  await t.step("chain with string assertions", () => {
    expectAnything("hello world")
      .toBeDefined()
      .toContain("world")
      .toMatch(/^hello/)
      .toHaveLength(11)
      .not.toBe("goodbye");
  });

  await t.step("chain with array assertions", () => {
    expectAnything([1, 2, 3, 4, 5])
      .toBeDefined()
      .toHaveLength(5)
      .toContain(3)
      .toContainEqual(2)
      .not.toContain(6);
  });

  await t.step("chain with object assertions", () => {
    expectAnything({ a: 1, b: 2, c: 3 })
      .toBeDefined()
      .toMatchObject({ a: 1 })
      .toHaveProperty("b", 2)
      .toEqual({ a: 1, b: 2, c: 3 })
      .not.toBeNull();
  });
});

// Note: resolves/rejects are not fully supported due to the complexity
// of wrapping @std/expect's Proxy-based implementation.
// For Promise testing, use @std/expect directly or await the promise first.

Deno.test("expectAnything - method coverage", async (t) => {
  await t.step("covers all @std/expect matchers", () => {
    // Get methods from @std/expect
    const stdExpectInstance = expectStd(42);
    const stdExpectMethods = new Set<string>();

    // Collect all methods from @std/expect
    let obj = stdExpectInstance;
    while (obj && obj !== Object.prototype) {
      Object.getOwnPropertyNames(obj).forEach((name) => {
        if (
          name !== "constructor" &&
          typeof (obj as Record<string, unknown>)[name] === "function"
        ) {
          stdExpectMethods.add(name);
        }
      });
      obj = Object.getPrototypeOf(obj);
    }

    // Get methods from expectAnything
    const anythingInstance = expectAnything(42);
    const anythingMethods = new Set<string>();

    // Collect all methods from expectAnything
    Object.getOwnPropertyNames(anythingInstance).forEach((name) => {
      const value = (anythingInstance as unknown as Record<string, unknown>)[
        name
      ];
      if (typeof value === "function" || typeof value === "object") {
        anythingMethods.add(name);
      }
    });

    // Known unsupported methods (intentionally excluded)
    const unsupportedMethods = new Set<string>([
      "resolves", // Async support not implemented (requires .then() chaining)
      "rejects", // Async support not implemented (requires .then() chaining)
    ]);

    // Check that all @std/expect methods are covered
    const missingMethods: string[] = [];
    stdExpectMethods.forEach((method) => {
      if (!unsupportedMethods.has(method) && !anythingMethods.has(method)) {
        missingMethods.push(method);
      }
    });

    if (missingMethods.length > 0) {
      throw new Error(
        `expectAnything is missing the following @std/expect methods: ${
          missingMethods.join(", ")
        }`,
      );
    }
  });

  await t.step("has .not property", () => {
    const instance = expectAnything(42);
    assertEquals(typeof instance.not, "object");
  });
});
