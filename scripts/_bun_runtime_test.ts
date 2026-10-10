import { assertEquals, assertThrows } from "@std/assert";
import { test } from "@probitas-test/internal-testing";
import { _internal } from "./_bun_runtime.ts";

const { releaseAsset, hostTarget, parseChecksums } = _internal;

test("releaseAsset", async (t) => {
  await t.step("maps compile targets to release archives", () => {
    assertEquals(releaseAsset("bun-linux-x64"), {
      zip: "bun-linux-x64.zip",
      entry: "bun-linux-x64/bun",
    });
    assertEquals(releaseAsset("bun-darwin-arm64"), {
      zip: "bun-darwin-aarch64.zip",
      entry: "bun-darwin-aarch64/bun",
    });
    assertEquals(releaseAsset("bun-windows-x64"), {
      zip: "bun-windows-x64.zip",
      entry: "bun-windows-x64/bun.exe",
    });
  });

  await t.step("keeps the musl and baseline variants in release order", () => {
    assertEquals(
      releaseAsset("bun-linux-x64-baseline-musl").zip,
      "bun-linux-x64-musl-baseline.zip",
    );
    assertEquals(
      releaseAsset("bun-linux-arm64-musl").zip,
      "bun-linux-aarch64-musl.zip",
    );
  });

  await t.step("rejects targets it does not understand", () => {
    assertThrows(() => releaseAsset("linux-x64"), Error, "linux-x64");
    assertThrows(() => releaseAsset("bun-linux-x64-modern"), Error, "modern");
  });
});

test("hostTarget", () => {
  assertEquals(hostTarget("darwin", "arm64"), "bun-darwin-arm64");
  assertEquals(hostTarget("linux", "x64"), "bun-linux-x64");
  assertEquals(hostTarget("win32", "x64"), "bun-windows-x64");
});

test("parseChecksums", () => {
  const sums = parseChecksums(
    "aaa  bun-linux-x64.zip\nbbb  bun-darwin-aarch64.zip\n",
  );
  assertEquals(sums.get("bun-darwin-aarch64.zip"), "bbb");
  assertEquals(sums.get("missing.zip"), undefined);
});
