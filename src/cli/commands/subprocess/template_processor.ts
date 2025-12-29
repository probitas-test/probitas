/**
 * Template processor for subprocess code generation
 *
 * @module
 */

import { createGraph } from "@deno/graph";
import { fromFileUrl, join, toFileUrl } from "@std/path";
import { ImportResolver } from "./import_resolver.ts";

/**
 * Template processor for generating temporary files
 *
 * Reads all .ts files in the templates/ directory,
 * converts bare specifiers to fully-qualified form,
 * and outputs them to a temporary directory.
 */
export class TemplateProcessor {
  #resolver: ImportResolver;
  #tempDir: string;
  #templatesDir: string;
  #processingPromise?: Promise<void>;

  constructor() {
    this.#resolver = new ImportResolver();
    this.#tempDir = Deno.makeTempDirSync({ prefix: "probitas-subprocess-" });

    // Get path to subprocess/templates/ directory
    this.#templatesDir = fromFileUrl(
      new URL("./templates", import.meta.url),
    );
  }

  /**
   * Process entire templates/ directory (idempotent, concurrency-safe)
   *
   * Transforms all .ts files in templates/ directory and writes
   * them to temp directory. Subsequent calls await the same Promise.
   */
  #ensureProcessed(): Promise<void> {
    if (!this.#processingPromise) {
      this.#processingPromise = this.#processTemplates();
    }
    return this.#processingPromise;
  }

  /**
   * Internal: Process all template files
   */
  async #processTemplates(): Promise<void> {
    // 1. Get all .ts files in templates/ directory
    const tsFiles = [];
    for await (const entry of Deno.readDir(this.#templatesDir)) {
      if (entry.isFile && entry.name.endsWith(".ts")) {
        tsFiles.push(entry.name);
      }
    }

    // 2. Transform all .ts files and write to temp directory
    for (const fileName of tsFiles) {
      const sourcePath = join(this.#templatesDir, fileName);
      const sourceCode = await Deno.readTextFile(sourcePath);
      const sourceUrl = toFileUrl(sourcePath).href;

      // Rewrite imports
      const processedCode = await replaceImports(
        sourceUrl,
        sourceCode,
        this.#resolver,
      );

      // Write to temp directory
      const destPath = join(this.#tempDir, fileName);
      await Deno.writeTextFile(destPath, processedCode);
    }
  }

  /**
   * Get path to processed entry point file
   *
   * @param entryPoint - Entry point file name (runner.ts or loader.ts)
   * @returns Processed entry point temporary file path
   */
  async getEntryPointPath(
    entryPoint: "runner.ts" | "loader.ts",
  ): Promise<string> {
    await this.#ensureProcessed();
    return join(this.#tempDir, entryPoint);
  }

  /**
   * Clean up temporary directory
   */
  async cleanup(): Promise<void> {
    await Deno.remove(this.#tempDir, { recursive: true });
  }

  /**
   * AsyncDisposable support
   */
  [Symbol.asyncDispose](): Promise<void> {
    return this.cleanup();
  }
}

/**
 * Rewrite import statements in source code
 *
 * @param specifier - Module specifier
 * @param sourceCode - Source code
 * @param resolver - ImportResolver
 * @returns Rewritten source code
 */
async function replaceImports(
  specifier: string,
  sourceCode: string,
  resolver: ImportResolver,
): Promise<string> {
  // Analyze dependencies with @deno/graph
  const graph = await createGraph(specifier, {
    load: (requestedSpecifier: string) => {
      if (requestedSpecifier === specifier) {
        return Promise.resolve({
          kind: "module" as const,
          specifier,
          content: new TextEncoder().encode(sourceCode),
        });
      }
      return Promise.resolve(undefined);
    },
  });

  const targetModule = graph.modules.find((m) => m.specifier === specifier);
  if (!targetModule?.dependencies) {
    return sourceCode;
  }

  // Collect replacements
  const replacements: Replacement[] = [];

  for (const dependency of targetModule.dependencies) {
    const original = dependency.specifier;
    const resolved = resolver.resolve(original);

    if (original === resolved) {
      continue;
    }

    // Replace code imports
    if (dependency.code?.span) {
      replacements.push(
        createReplacement(dependency.code.span, original, resolved),
      );
    }

    // Replace type imports
    if (dependency.type?.span) {
      replacements.push(
        createReplacement(dependency.type.span, original, resolved),
      );
    }
  }

  if (replacements.length === 0) {
    return sourceCode;
  }

  return applyReplacements(sourceCode, replacements);
}

/**
 * Replacement information
 */
interface Replacement {
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
  specifier: string;
  newSpecifier: string;
}

/**
 * Create replacement from Span
 */
function createReplacement(
  span: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  },
  specifier: string,
  newSpecifier: string,
): Replacement {
  return {
    startLine: span.start.line,
    startChar: span.start.character,
    endLine: span.end.line,
    endChar: span.end.character,
    specifier,
    newSpecifier,
  };
}

/**
 * Apply replacements to source code
 */
function applyReplacements(
  sourceCode: string,
  replacements: Replacement[],
): string {
  const lines = sourceCode.split("\n");

  // Sort in reverse order (replace from back to avoid offset issues)
  replacements.sort((a, b) =>
    a.startLine !== b.startLine
      ? b.startLine - a.startLine
      : b.startChar - a.startChar
  );

  for (const replacement of replacements) {
    const line = lines[replacement.startLine];
    lines[replacement.startLine] = line.substring(0, replacement.startChar) +
      `"${replacement.newSpecifier}"` +
      line.substring(replacement.endChar);
  }

  return lines.join("\n");
}
