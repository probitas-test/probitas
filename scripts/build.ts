/**
 * Build the library for npm: JavaScript plus declarations into `dist/`.
 *
 * The CLI is distributed as a single binary, so only the library (what
 * scenarios import) is published. Bun consumers resolve the `bun` export
 * condition to the TypeScript sources; `types` / `default` point at `dist/`
 * for editors and other runtimes.
 *
 * Usage: bun scripts/build.ts
 *
 * @module
 */

import { spawnSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = join(import.meta.dir, "..");
const configPath = join(root, "tsconfig.build.json");

rmSync(join(root, "dist"), { recursive: true, force: true });
writeFileSync(
  configPath,
  JSON.stringify({
    extends: "./tsconfig.json",
    compilerOptions: {
      noEmit: false,
      declaration: true,
      rewriteRelativeImportExtensions: true,
      rootDir: "src",
      outDir: "dist",
    },
    include: ["src/**/*.ts"],
    exclude: ["src/cli.ts", "src/cli/**", "**/*_test.ts", "node_modules"],
  }),
);
const result = spawnSync(
  join(root, "node_modules", ".bin", "tsc"),
  ["-p", configPath],
  { stdio: "inherit" },
);
rmSync(configPath);
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("built dist/");
