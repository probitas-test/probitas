/**
 * Generate `deno.json`, which is only the JSR publishing manifest, from
 * `package.json`. It is generated when publishing and never committed, so a
 * dependency update has nothing to keep in step with it.
 *
 * Sources import the framework packages by their npm names
 * (`@probitas-test/<name>`), while on JSR they are `@probitas/<name>`. The
 * generated import map points those specifiers at JSR, using the versions
 * installed in node_modules, and every other dependency at npm.
 *
 * Usage: bun scripts/sync_jsr.ts
 *
 * @module
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

interface Manifest {
  name: string;
  version: string;
  exports: Record<string, { bun: string }>;
  dependencies?: Record<string, string>;
}

const readManifest = (path: string): Manifest =>
  JSON.parse(readFileSync(path, "utf8"));

const jsrName = (npmName: string) =>
  npmName.replace(/^@probitas-test\//, "@probitas/");

const manifest = readManifest(join(root, "package.json"));
const imports: Record<string, string> = {};
for (const [name, range] of Object.entries(manifest.dependencies ?? {})) {
  if (name.startsWith("@probitas-test/")) {
    const dep = readManifest(join(root, "node_modules", name, "package.json"));
    // npm prereleases (`-next.N`) are never published to JSR.
    const version = dep.version.replace(/-.*$/, "");
    const target = `jsr:${jsrName(name)}@^${version}`;
    // List every subpath explicitly so Deno never falls back to the npm
    // package's dist/ exports through a "pkg/" prefix entry.
    for (const key of Object.keys(dep.exports)) {
      if (key === ".") imports[name] = target;
      else imports[`${name}/${key.slice(2)}`] = `${target}/${key.slice(2)}`;
    }
  } else {
    imports[name] = `npm:${name}@${range}`;
    imports[`${name}/`] = `npm:${name}@${range}/`;
  }
}

const denoJson = {
  name: jsrName(manifest.name),
  version: manifest.version,
  license: "MIT",
  nodeModulesDir: "none",
  exports: Object.fromEntries(
    Object.entries(manifest.exports).map(([key, value]) => [key, value.bun]),
  ),
  imports,
  publish: {
    include: [
      "LICENSE",
      "README.md",
      "deno.json",
      "src/**/*.ts",
      "src/_vendor/**/LICENSE",
    ],
    exclude: ["src/cli.ts", "src/cli/**", "**/*_test.ts"],
  },
};

writeFileSync(
  join(root, "deno.json"),
  JSON.stringify(denoJson, null, 2) + "\n",
);
console.log("wrote deno.json");
