import { assertEquals, assertStringIncludes } from "@std/assert";
import { readFile } from "node:fs/promises";
import { sandbox, test } from "@probitas-test/internal-testing";
import packageJson from "../../../package.json" with { type: "json" };
import { EXIT_CODE } from "../constants.ts";
import { _internal, initCommand } from "./init.ts";

const { probitasSpecifier } = _internal;

test("probitasSpecifier", async (t) => {
  await t.step("pins a released version", () => {
    assertEquals(probitasSpecifier("2.0.1"), "2.0.1");
    assertEquals(probitasSpecifier("2.1.0-rc.1"), "2.1.0-rc.1");
  });

  await t.step("falls back to latest for builds that are not on npm", () => {
    assertEquals(
      probitasSpecifier("0.0.0-unstable.20261011.abc1234"),
      "latest",
    );
    assertEquals(probitasSpecifier(undefined), "latest");
  });
});

test("initCommand", async (t) => {
  await t.step("creates the scenario, config and editor setup", async () => {
    await using sbox = await sandbox();
    assertEquals(await initCommand(["--quiet"], sbox.path), EXIT_CODE.SUCCESS);

    const example = await readFile(
      sbox.resolve("probitas/example.probitas.ts"),
      "utf8",
    );
    assertStringIncludes(example, 'from "@probitas-test/probitas"');
    await readFile(sbox.resolve("probitas/probitas.jsonc"), "utf8");

    const manifest = JSON.parse(
      await readFile(sbox.resolve("probitas/package.json"), "utf8"),
    );
    // Types must match the runtime embedded in this binary.
    assertEquals(
      manifest.devDependencies["@probitas-test/probitas"],
      packageJson.version,
    );

    const tsconfig = JSON.parse(
      await readFile(sbox.resolve("probitas/tsconfig.json"), "utf8"),
    );
    assertEquals(tsconfig.compilerOptions.moduleResolution, "bundler");
  });

  await t.step(
    "declares the Node.js types scenarios use in place of Deno's",
    async () => {
      await using sbox = await sandbox();
      await initCommand(["--quiet"], sbox.path);

      const manifest = JSON.parse(
        await readFile(sbox.resolve("probitas/package.json"), "utf8"),
      );
      assertEquals(typeof manifest.devDependencies["@types/node"], "string");

      // `bun check` (TypeScript 7) only loads the @types packages listed here.
      const tsconfig = JSON.parse(
        await readFile(sbox.resolve("probitas/tsconfig.json"), "utf8"),
      );
      assertEquals(tsconfig.compilerOptions.types, ["node"]);
    },
  );

  await t.step(
    "refuses to overwrite existing files without --force",
    async () => {
      await using sbox = await sandbox();
      assertEquals(
        await initCommand(["--quiet"], sbox.path),
        EXIT_CODE.SUCCESS,
      );
      assertEquals(
        await initCommand(["--quiet"], sbox.path),
        EXIT_CODE.FAILURE,
      );
      assertEquals(
        await initCommand(["--quiet", "--force"], sbox.path),
        EXIT_CODE.SUCCESS,
      );
    },
  );
});
