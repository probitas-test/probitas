/**
 * `Deno.test`-shaped helpers on top of `bun:test`
 *
 * The test suites were written against `Deno.test` with `t.step` sub-steps.
 * Rather than restructuring them into `describe`/`it`, each `test()` maps to
 * one `bun:test` test and its steps run inline, in order, sharing the
 * enclosing scope exactly as they did under Deno.
 *
 * @module
 * @internal
 */

import { expect, test as bunTest } from "bun:test";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { connect } from "node:net";
import { join, resolve } from "node:path";

export type StepFn = (t: TestContext) => unknown | Promise<unknown>;

export interface StepDefinition {
  name: string;
  fn: StepFn;
  ignore?: boolean;
}

export interface TestContext {
  readonly name: string;
  step(name: string, fn: StepFn): Promise<boolean>;
  step(definition: StepDefinition): Promise<boolean>;
}

export interface TestDefinition {
  name: string;
  fn: StepFn;
  ignore?: boolean;
  only?: boolean;
  /** Accepted for source compatibility; Bun has no sanitizers. */
  sanitizeOps?: boolean;
  /** Accepted for source compatibility; Bun has no sanitizers. */
  sanitizeResources?: boolean;
}

/** Thrown in place of a failing step's error so the step path is visible. */
export class StepError extends Error {
  constructor(path: string, cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(`[${path}] ${message}`, { cause });
    this.name = "StepError";
    if (cause instanceof Error && cause.stack) {
      this.stack = `${this.name}: ${this.message}\n${
        cause.stack.split("\n").slice(1).join("\n")
      }`;
    }
  }
}

function createContext(path: string): TestContext {
  return {
    name: path,
    async step(
      nameOrDefinition: string | StepDefinition,
      maybeFn?: StepFn,
    ): Promise<boolean> {
      const definition = typeof nameOrDefinition === "string"
        ? { name: nameOrDefinition, fn: maybeFn! }
        : nameOrDefinition;
      if (definition.ignore) return false;
      const stepPath = `${path} > ${definition.name}`;
      try {
        await definition.fn(createContext(stepPath));
      } catch (error) {
        throw error instanceof StepError
          ? error
          : new StepError(stepPath, error);
      }
      return true;
    },
  };
}

/** @internal */
export const _internal = { createContext };

export function test(name: string, fn: StepFn): void;
export function test(definition: TestDefinition): void;
export function test(
  nameOrDefinition: string | TestDefinition,
  maybeFn?: StepFn,
): void {
  const definition = typeof nameOrDefinition === "string"
    ? { name: nameOrDefinition, fn: maybeFn! }
    : nameOrDefinition;
  const run = async () => {
    await definition.fn(createContext(definition.name));
  };
  if (definition.ignore) {
    bunTest.skip(definition.name, run);
  } else if (definition.only) {
    bunTest.only(definition.name, run);
  } else {
    bunTest(definition.name, run);
  }
}

/**
 * Compare `actual` against the stored snapshot of the current test
 *
 * Snapshots are keyed by the enclosing `test()` name and call order, so steps
 * within one test share a sequence just as they did with `@std/testing`.
 * `options.name` becomes the snapshot hint.
 */
export function assertSnapshot(
  _t: TestContext,
  actual: unknown,
  options: { name?: string } = {},
): void {
  if (options.name === undefined) {
    expect(actual).toMatchSnapshot();
  } else {
    expect(actual).toMatchSnapshot(options.name);
  }
}

export interface Sandbox extends AsyncDisposable {
  readonly path: string;
  resolve(...segments: string[]): string;
}

/**
 * Create a temporary directory that is removed on dispose
 *
 * Same contract as `@lambdalisue/sandbox` (which calls `Deno.*`): the working
 * directory is not changed; use `resolve()` for paths inside it.
 */
export async function sandbox(): Promise<Sandbox> {
  const path = await realpath(await mkdtemp(join(tmpdir(), "probitas-test-")));
  return {
    path,
    resolve: (...segments) => resolve(path, ...segments),
    [Symbol.asyncDispose]: () => rm(path, { recursive: true, force: true }),
  };
}

/** Create an empty temporary file and return its path. */
export async function makeTempFile(
  options: { suffix?: string } = {},
): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "probitas-test-"));
  const path = join(dir, `file${options.suffix ?? ""}`);
  await writeFile(path, "");
  return path;
}

/** Whether a TCP connection to `hostname:port` can be opened. */
export function isPortOpen(hostname: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host: hostname, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}
