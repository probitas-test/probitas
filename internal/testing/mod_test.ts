import { describe, expect, it } from "bun:test";
import { _internal, StepError } from "./mod.ts";

const { createContext } = _internal;

describe("TestContext.step", () => {
  it("runs steps in order and shares the enclosing scope", async () => {
    const t = createContext("root");
    const order: string[] = [];
    await t.step("a", () => {
      order.push("a");
    });
    await t.step("b", async (inner) => {
      await inner.step("b1", () => {
        order.push("b1");
      });
      order.push("b");
    });
    expect(order).toEqual(["a", "b1", "b"]);
  });

  it("skips ignored steps and reports them as not run", async () => {
    const t = createContext("root");
    let ran = false;
    const result = await t.step({
      name: "ignored",
      ignore: true,
      fn: () => {
        ran = true;
      },
    });
    expect(result).toBe(false);
    expect(ran).toBe(false);
  });

  it("prefixes a failing step's message with its full path", async () => {
    const t = createContext("root");
    const promise = t.step("outer", async (inner) => {
      await inner.step("inner", () => {
        throw new Error("boom");
      });
    });
    await expect(promise).rejects.toBeInstanceOf(StepError);
    await expect(promise).rejects.toThrow("[root > outer > inner] boom");
  });
});
