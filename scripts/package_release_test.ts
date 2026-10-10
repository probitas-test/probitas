import { assertEquals, assertThrows } from "@std/assert";
import { test } from "@probitas-test/internal-testing";
import { _internal } from "./package_release.ts";

const { releaseArtifact, formatChecksums } = _internal;

test("releaseArtifact", async (t) => {
  await t.step("names Unix archives after the platform", () => {
    assertEquals(releaseArtifact("bun-darwin-arm64"), {
      archive: "probitas-darwin-arm64.tar.gz",
      executable: "probitas",
      format: "tar.gz",
    });
    assertEquals(
      releaseArtifact("bun-linux-x64").archive,
      "probitas-linux-x64.tar.gz",
    );
  });

  await t.step("zips the Windows executable", () => {
    assertEquals(releaseArtifact("bun-windows-x64"), {
      archive: "probitas-windows-x64.zip",
      executable: "probitas.exe",
      format: "zip",
    });
  });

  await t.step("rejects targets that are not released", () => {
    assertThrows(() => releaseArtifact("bun-linux-x64-musl"), Error, "musl");
  });
});

test("formatChecksums lists files in sha256sum format, sorted", () => {
  assertEquals(
    formatChecksums(new Map([["b.zip", "bb"], ["a.tar.gz", "aa"]])),
    "aa  a.tar.gz\nbb  b.zip\n",
  );
});
