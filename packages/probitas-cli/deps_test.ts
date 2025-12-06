/**
 * Tests to verify CLI package has all required dependencies
 *
 * This ensures that packages/probitas-cli/deno.json contains all external
 * dependencies needed for subprocess execution.
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { expandGlob } from "@std/fs/expand-glob";
import { describe, it } from "@std/testing/bdd";

/**
 * Extract external imports from TypeScript source files
 *
 * Parses import statements and extracts package names like:
 * - "@std/fs" from `import { exists } from "@std/fs/exists"`
 * - "@core/unknownutil" from `import { ensure } from "@core/unknownutil"`
 */
function extractExternalImports(source: string): Set<string> {
  const imports = new Set<string>();

  // Match import statements: import ... from "..."
  const importRegex = /from\s+["']([^"']+)["']/g;
  let match;

  while ((match = importRegex.exec(source)) !== null) {
    const specifier = match[1];

    // Skip relative imports
    if (specifier.startsWith(".") || specifier.startsWith("/")) {
      continue;
    }

    // Skip file:// and http:// URLs
    if (specifier.includes("://")) {
      continue;
    }

    // Extract base package name (e.g., "@std/fs" from "@std/fs/exists")
    let pkgName: string;
    if (specifier.startsWith("@")) {
      // Scoped package: @scope/name or @scope/name/subpath
      const parts = specifier.split("/");
      pkgName = `${parts[0]}/${parts[1]}`;
    } else {
      // Regular package: name or name/subpath
      pkgName = specifier.split("/")[0];
    }

    imports.add(pkgName);
  }

  return imports;
}

describe("CLI package dependencies", () => {
  it("deno.json contains 'probitas' alias for user scenarios", async () => {
    // Read CLI package's deno.json
    const denoJsonPath = new URL("./deno.json", import.meta.url);
    const denoJson = await fetch(denoJsonPath).then((r) => r.json()) as {
      imports?: Record<string, string>;
    };

    // The "probitas" alias is essential for user scenarios that use:
    // import { scenario } from "probitas";
    assertEquals(
      denoJson.imports?.["probitas"] !== undefined,
      true,
      `Missing "probitas" alias in packages/probitas-cli/deno.json.\n` +
        `User scenarios typically use 'import { scenario } from "probitas"'.\n` +
        `Add '"probitas": "jsr:@probitas/probitas@^0"' to the "imports" section.`,
    );
  });

  it("deno.json contains all external dependencies used by probitas packages", async () => {
    // Read CLI package's deno.json
    const denoJsonPath = new URL("./deno.json", import.meta.url);
    const denoJson = await fetch(denoJsonPath).then((r) => r.json()) as {
      imports?: Record<string, string>;
    };
    const declaredDeps = new Set(Object.keys(denoJson.imports ?? {}));

    // Collect all external imports from all probitas packages (excluding test files)
    const allImports = new Set<string>();
    const packagesDir = new URL("../", import.meta.url).pathname;

    for await (
      const entry of expandGlob("**/*.ts", {
        root: packagesDir,
        exclude: ["**/*_test.ts", "**/*_bench.ts", "**/testkit.ts"],
      })
    ) {
      if (!entry.isFile) continue;

      const source = await Deno.readTextFile(entry.path);
      const imports = extractExternalImports(source);

      for (const imp of imports) {
        // Skip probitas packages (they're handled separately)
        if (imp.startsWith("@probitas/") || imp === "probitas") {
          continue;
        }
        allImports.add(imp);
      }
    }

    // Check that all external imports are declared in deno.json
    const missingDeps: string[] = [];
    for (const imp of allImports) {
      if (!declaredDeps.has(imp)) {
        missingDeps.push(imp);
      }
    }

    assertEquals(
      missingDeps,
      [],
      `Missing dependencies in packages/probitas-cli/deno.json:\n` +
        missingDeps.map((d) => `  - "${d}"`).join("\n") +
        `\n\nAdd these to the "imports" section of packages/probitas-cli/deno.json`,
    );
  });
});
