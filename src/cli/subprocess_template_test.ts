import { assertEquals } from "@std/assert";
import { _internal } from "./subprocess_template.ts";

const { getLocalModulePrefix } = _internal;

Deno.test("getLocalModulePrefix", async (t) => {
  await t.step("returns file:// for local file URLs", () => {
    const url = new URL("file:///path/to/template.ts");
    assertEquals(getLocalModulePrefix(url), "file://");
  });

  await t.step("extracts JSR package base for JSR URLs", () => {
    const url = new URL(
      "https://jsr.io/@probitas/probitas/0.19.0/src/cli/_templates/run.ts",
    );
    assertEquals(
      getLocalModulePrefix(url),
      "https://jsr.io/@probitas/probitas/0.19.0/",
    );
  });

  await t.step("handles scoped JSR packages with different versions", () => {
    const url = new URL(
      "https://jsr.io/@std/path/1.0.0/mod.ts",
    );
    assertEquals(
      getLocalModulePrefix(url),
      "https://jsr.io/@std/path/1.0.0/",
    );
  });

  await t.step("returns directory for non-JSR remote URLs", () => {
    const url = new URL(
      "https://example.com/modules/template.ts",
    );
    assertEquals(
      getLocalModulePrefix(url),
      "https://example.com/modules/",
    );
  });

  await t.step("handles HTTP (non-HTTPS) JSR URLs", () => {
    const url = new URL(
      "http://jsr.io/@probitas/probitas/0.19.0/src/cli/_templates/run.ts",
    );
    assertEquals(
      getLocalModulePrefix(url),
      "http://jsr.io/@probitas/probitas/0.19.0/",
    );
  });
});
