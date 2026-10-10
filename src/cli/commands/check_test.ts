import { assertEquals } from "@std/assert";
import { join } from "node:path";
import { test } from "@probitas-test/internal-testing";
import { _internal } from "./check.ts";

const { resolveTypeChecker, buildTypeCheckArgs } = _internal;

test("resolveTypeChecker", async (t) => {
  const cwd = "/project";

  await t.step("prefers the project's tsgo, then its tsc", async () => {
    const exists = (path: string) =>
      Promise.resolve(path === join(cwd, "node_modules/.bin/tsc"));
    assertEquals(
      await resolveTypeChecker(cwd, { exists, which: () => null }),
      join(cwd, "node_modules/.bin/tsc"),
    );

    const both = (path: string) =>
      Promise.resolve(
        path === join(cwd, "node_modules/.bin/tsc") ||
          path === join(cwd, "node_modules/.bin/tsgo"),
      );
    assertEquals(
      await resolveTypeChecker(cwd, { exists: both, which: () => null }),
      join(cwd, "node_modules/.bin/tsgo"),
    );
  });

  await t.step("falls back to tsgo, then tsc, on PATH", async () => {
    const none = () => Promise.resolve(false);
    assertEquals(
      await resolveTypeChecker(cwd, {
        exists: none,
        which: (cmd) => cmd === "tsc" ? "/usr/bin/tsc" : null,
      }),
      "/usr/bin/tsc",
    );
    assertEquals(
      await resolveTypeChecker(cwd, {
        exists: none,
        which: (cmd) => `/usr/bin/${cmd}`,
      }),
      "/usr/bin/tsgo",
    );
  });

  await t.step("returns undefined when nothing is installed", async () => {
    assertEquals(
      await resolveTypeChecker(cwd, {
        exists: () => Promise.resolve(false),
        which: () => null,
      }),
      undefined,
    );
  });
});

test("buildTypeCheckArgs", async (t) => {
  await t.step("uses the project's tsconfig when there is one", () => {
    assertEquals(
      buildTypeCheckArgs({
        tsconfig: "/project/tsconfig.json",
        files: ["a.ts"],
      }),
      ["-p", "/project/tsconfig.json", "--noEmit"],
    );
  });

  await t.step(
    "checks the scenario files with Bun-friendly options otherwise",
    () => {
      const args = buildTypeCheckArgs({
        files: ["/p/a.probitas.ts", "/p/b.probitas.ts"],
      });
      assertEquals(args.slice(-2), ["/p/a.probitas.ts", "/p/b.probitas.ts"]);
      for (
        const flag of ["--noEmit", "--strict", "--allowImportingTsExtensions"]
      ) {
        assertEquals(args.includes(flag), true, `missing ${flag}`);
      }
      assertEquals(args[args.indexOf("--moduleResolution") + 1], "bundler");
    },
  );
});
