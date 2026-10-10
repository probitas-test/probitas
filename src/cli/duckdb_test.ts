import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { sandbox, test } from "@probitas-test/internal-testing";
import { _internal, type DuckdbManifest, ensureDuckdb } from "./duckdb.ts";

const { duckdbCacheRoot, verifyIntegrity, extractTarGz } = _internal;

function tarEntry(name: string, content: Uint8Array, type = "0"): Uint8Array {
  const header = new Uint8Array(512);
  const enc = new TextEncoder();
  header.set(enc.encode(name), 0);
  header.set(enc.encode("0000644\0"), 100);
  header.set(
    enc.encode(content.length.toString(8).padStart(11, "0") + "\0"),
    124,
  );
  header.set(enc.encode("        "), 148);
  header.set(enc.encode(type), 156);
  header.set(enc.encode("ustar\x0000"), 257);
  const checksum = header.reduce((sum, b) => sum + b, 0);
  header.set(enc.encode(checksum.toString(8).padStart(6, "0") + "\0 "), 148);
  const padded = new Uint8Array(Math.ceil(content.length / 512) * 512);
  padded.set(content);
  return new Uint8Array([...header, ...padded]);
}

function tarGz(entries: Uint8Array[]): Uint8Array<ArrayBuffer> {
  return new Uint8Array(gzipSync(
    new Uint8Array([
      ...entries.flatMap((e) => [...e]),
      ...new Uint8Array(1024),
    ]),
  ));
}

function integrityOf(bytes: Uint8Array): string {
  return `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
}

const enc = new TextEncoder();
const bindingTarball = tarGz([
  tarEntry("package/package.json", enc.encode("{}")),
  tarEntry("package/duckdb.node", enc.encode("NODE")),
  tarEntry("package/libduckdb.dylib", enc.encode("LIB")),
]);

function manifestFor(tarball: Uint8Array): DuckdbManifest {
  return {
    version: "1.4.2-r.1",
    targets: {
      "darwin-arm64": {
        tarball: "https://registry.example/duckdb.tgz",
        integrity: integrityOf(tarball),
      },
    },
  };
}

test("duckdbCacheRoot", async (t) => {
  await t.step("uses ~/Library/Caches on macOS", () => {
    assertEquals(
      duckdbCacheRoot({ platform: "darwin", env: {}, home: "/Users/a" }),
      join("/Users/a", "Library", "Caches", "probitas", "duckdb"),
    );
  });

  await t.step("honours XDG_CACHE_HOME on Linux, else ~/.cache", () => {
    assertEquals(
      duckdbCacheRoot({
        platform: "linux",
        env: { XDG_CACHE_HOME: "/xdg" },
        home: "/home/a",
      }),
      join("/xdg", "probitas", "duckdb"),
    );
    assertEquals(
      duckdbCacheRoot({ platform: "linux", env: {}, home: "/home/a" }),
      join("/home/a", ".cache", "probitas", "duckdb"),
    );
  });

  await t.step("uses LOCALAPPDATA on Windows", () => {
    assertEquals(
      duckdbCacheRoot({
        platform: "win32",
        env: { LOCALAPPDATA: "C:\\L" },
        home: "C:\\U",
      }),
      join("C:\\L", "probitas", "duckdb"),
    );
  });
});

test("verifyIntegrity", async (t) => {
  const bytes = enc.encode("payload");

  await t.step("accepts a matching sha512", () => {
    verifyIntegrity(bytes, integrityOf(bytes));
  });

  await t.step("rejects a mismatch", () => {
    assertThrows(
      () => verifyIntegrity(bytes, integrityOf(enc.encode("other"))),
      Error,
      "integrity",
    );
  });
});

test("extractTarGz writes the package's regular files flat", async () => {
  await using sbox = await sandbox();
  await extractTarGz(bindingTarball, sbox.path);
  assertEquals((await readdir(sbox.path)).sort(), [
    "duckdb.node",
    "libduckdb.dylib",
    "package.json",
  ]);
  assertEquals(await readFile(join(sbox.path, "duckdb.node"), "utf8"), "NODE");
});

test("ensureDuckdb", async (t) => {
  await t.step("downloads, verifies and caches the binding once", async () => {
    await using sbox = await sandbox();
    let fetches = 0;
    const options = {
      manifest: manifestFor(bindingTarball),
      target: "darwin-arm64",
      cacheRoot: sbox.path,
      fetch: () => {
        fetches++;
        return Promise.resolve(new Response(bindingTarball));
      },
      log: () => {},
    };

    const dir = await ensureDuckdb(options);
    assertEquals(dir, join(sbox.path, "1.4.2-r.1-darwin-arm64"));
    assertEquals(await readFile(join(dir, "libduckdb.dylib"), "utf8"), "LIB");

    assertEquals(await ensureDuckdb(options), dir);
    assertEquals(fetches, 1);
  });

  await t.step("discards a tarball that fails verification", async () => {
    await using sbox = await sandbox();
    await assertRejects(
      () =>
        ensureDuckdb({
          manifest: manifestFor(enc.encode("something else")),
          target: "darwin-arm64",
          cacheRoot: sbox.path,
          fetch: () => Promise.resolve(new Response(bindingTarball)),
          log: () => {},
        }),
      Error,
      "integrity",
    );
    assertEquals(await readdir(sbox.path), []);
  });

  await t.step("rejects a platform the manifest does not cover", async () => {
    await using sbox = await sandbox();
    await assertRejects(
      () =>
        ensureDuckdb({
          manifest: manifestFor(bindingTarball),
          target: "freebsd-x64",
          cacheRoot: sbox.path,
          fetch: () => Promise.resolve(new Response(bindingTarball)),
          log: () => {},
        }),
      Error,
      "freebsd-x64",
    );
  });
});
