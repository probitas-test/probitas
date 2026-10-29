import { assertEquals, assertThrows } from "@std/assert";
import { test } from "@probitas-test/internal-testing";
import { pinBun, readBunPin } from "./_bun_pin.ts";

const flake = `
      bunVersion = "1.4.3";
      bunSources = {
        x86_64-linux = {
          asset = "bun-linux-x64.zip";
          hash = "sha256-old-linux=";
        };
        aarch64-darwin = {
          asset = "bun-darwin-aarch64.zip";
          hash = "sha256-old-darwin=";
        };
      };
`;

test("readBunPin", async (t) => {
  await t.step("reads the pinned version and every release asset", () => {
    assertEquals(readBunPin(flake), {
      version: "1.4.3",
      assets: ["bun-linux-x64.zip", "bun-darwin-aarch64.zip"],
    });
  });

  await t.step("refuses a flake without a Bun version", () => {
    assertThrows(() => readBunPin("{ }"), Error, "bunVersion");
  });
});

test("pinBun", async (t) => {
  await t.step("rewrites the version and each asset's hash", () => {
    assertEquals(
      pinBun(flake, "1.4.4", {
        "bun-linux-x64.zip": "sha256-new-linux=",
        "bun-darwin-aarch64.zip": "sha256-new-darwin=",
      }),
      flake
        .replace('"1.4.3"', '"1.4.4"')
        .replace("sha256-old-linux=", "sha256-new-linux=")
        .replace("sha256-old-darwin=", "sha256-new-darwin="),
    );
  });

  await t.step("refuses to leave an asset with its old hash", () => {
    assertThrows(
      () => pinBun(flake, "1.4.4", { "bun-linux-x64.zip": "sha256-new=" }),
      Error,
      "bun-darwin-aarch64.zip",
    );
  });
});
