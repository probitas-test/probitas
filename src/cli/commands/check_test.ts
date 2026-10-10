import { assertEquals } from "@std/assert";
import { test } from "@probitas-test/internal-testing";
import { _internal } from "./check.ts";

const { buildCheckArgs } = _internal;

test("buildCheckArgs", async (t) => {
  await t.step("checks the project's tsconfig when there is one", () => {
    assertEquals(
      buildCheckArgs({
        cwd: "/project",
        tsconfig: "/project/tsconfig.json",
        files: [],
      }),
      ["check", "--cwd=/project", "-p", "/project/tsconfig.json"],
    );
  });

  await t.step(
    "checks the scenario files with the worker's options otherwise",
    () => {
      const args = buildCheckArgs({
        cwd: "/p",
        files: ["/p/a.probitas.ts", "/p/b.probitas.ts"],
      });
      assertEquals(args.slice(0, 2), ["check", "--cwd=/p"]);
      assertEquals(args.slice(-2), ["/p/a.probitas.ts", "/p/b.probitas.ts"]);
      for (
        const flag of [
          "--strict",
          "--allowImportingTsExtensions",
          "--moduleResolution=bundler",
        ]
      ) {
        assertEquals(args.includes(flag), true, `missing ${flag}`);
      }
    },
  );
});
