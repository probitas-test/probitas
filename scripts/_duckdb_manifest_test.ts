import { assertEquals, assertThrows } from "@std/assert";
import { test } from "@probitas-test/internal-testing";
import { duckdbManifestFromLock } from "./_duckdb_manifest.ts";

const entry = (target: string, version: string, integrity: string) => [
  `@duckdb/node-bindings-${target}@${version}`,
  "",
  {},
  integrity,
];

test("duckdbManifestFromLock", async (t) => {
  await t.step("takes every binding's integrity from the lockfile", () => {
    const lock = {
      packages: {
        "@duckdb/node-bindings-linux-x64": entry(
          "linux-x64",
          "1.4.2-r.1",
          "sha512-linux",
        ),
        "@duckdb/node-bindings-darwin-arm64": entry(
          "darwin-arm64",
          "1.4.2-r.1",
          "sha512-darwin",
        ),
      },
    };
    assertEquals(
      duckdbManifestFromLock(lock, "1.4.2-r.1", ["linux-x64", "darwin-arm64"]),
      {
        version: "1.4.2-r.1",
        targets: {
          "linux-x64": {
            tarball:
              "https://registry.npmjs.org/@duckdb/node-bindings-linux-x64/-/node-bindings-linux-x64-1.4.2-r.1.tgz",
            integrity: "sha512-linux",
          },
          "darwin-arm64": {
            tarball:
              "https://registry.npmjs.org/@duckdb/node-bindings-darwin-arm64/-/node-bindings-darwin-arm64-1.4.2-r.1.tgz",
            integrity: "sha512-darwin",
          },
        },
      },
    );
  });

  await t.step("refuses a binding locked at another version", () => {
    const lock = {
      packages: {
        "@duckdb/node-bindings-linux-x64": entry("linux-x64", "1.4.1", "x"),
      },
    };
    assertThrows(
      () => duckdbManifestFromLock(lock, "1.4.2-r.1", ["linux-x64"]),
      Error,
      "linux-x64",
    );
  });

  await t.step("refuses a binding missing from the lockfile", () => {
    assertThrows(
      () =>
        duckdbManifestFromLock({ packages: {} }, "1.4.2-r.1", ["win32-x64"]),
      Error,
      "win32-x64",
    );
  });
});
