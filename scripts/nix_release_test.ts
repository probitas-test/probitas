import { assertEquals, assertThrows } from "@std/assert";
import { test } from "@probitas-test/internal-testing";
import { _internal } from "./nix_release.ts";

const { buildNixRelease } = _internal;

const hex = (c: string) => c.repeat(64);

test("buildNixRelease", async (t) => {
  const sums = [
    `${hex("a")}  probitas-darwin-arm64.tar.gz`,
    `${hex("b")}  probitas-darwin-x64.tar.gz`,
    `${hex("c")}  probitas-linux-arm64.tar.gz`,
    `${hex("d")}  probitas-linux-x64.tar.gz`,
    `${hex("e")}  probitas-windows-x64.zip`,
    "",
  ].join("\n");

  await t.step("keeps the version and every Unix archive's hash", () => {
    assertEquals(buildNixRelease("2.0.0", sums), {
      version: "2.0.0",
      sha256: {
        "darwin-arm64": hex("a"),
        "darwin-x64": hex("b"),
        "linux-arm64": hex("c"),
        "linux-x64": hex("d"),
      },
    });
  });

  await t.step("fails when a platform the package covers is missing", () => {
    assertThrows(
      () =>
        buildNixRelease("2.0.0", `${hex("a")}  probitas-darwin-arm64.tar.gz`),
      Error,
      "linux-x64",
    );
  });
});
