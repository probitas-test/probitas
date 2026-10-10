import { assertEquals } from "@std/assert";
import { test } from "@probitas-test/internal-testing";
import { EXIT_CODE } from "../constants.ts";
import type { DuckdbManifest } from "../duckdb.ts";
import { cacheCommand } from "./cache.ts";

const manifest: DuckdbManifest = { version: "1.4.2-r.1", targets: {} };

test("cacheCommand", async (t) => {
  await t.step("requires a target", async () => {
    assertEquals(
      await cacheCommand([], "/", {
        manifest,
        ensure: () => Promise.resolve("/x"),
      }),
      EXIT_CODE.USAGE_ERROR,
    );
    assertEquals(
      await cacheCommand(["redis"], "/", {
        manifest,
        ensure: () => Promise.resolve("/x"),
      }),
      EXIT_CODE.USAGE_ERROR,
    );
  });

  await t.step("downloads the DuckDB binding", async () => {
    const seen: DuckdbManifest[] = [];
    const code = await cacheCommand(["duckdb"], "/", {
      manifest,
      ensure: (m) => {
        seen.push(m);
        return Promise.resolve("/cache/duckdb");
      },
    });
    assertEquals(code, EXIT_CODE.SUCCESS);
    assertEquals(seen, [manifest]);
  });

  await t.step("fails when the download fails", async () => {
    const code = await cacheCommand(["duckdb"], "/", {
      manifest,
      ensure: () => Promise.reject(new Error("offline")),
    });
    assertEquals(code, EXIT_CODE.FAILURE);
  });

  await t.step("has nothing to do when running from source", async () => {
    let called = false;
    const code = await cacheCommand(["duckdb"], "/", {
      manifest: undefined,
      ensure: () => {
        called = true;
        return Promise.resolve("/x");
      },
    });
    assertEquals(code, EXIT_CODE.SUCCESS);
    assertEquals(called, false);
  });
});
