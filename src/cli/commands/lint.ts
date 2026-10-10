/**
 * Lint command for Probitas CLI
 *
 * Lints discovered scenario files with Biome's recommended rules. Biome's
 * Wasm build is embedded in the binary: nothing is downloaded and no project
 * configuration is read.
 *
 * @module
 */

import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import { Biome } from "@biomejs/js-api/web";
import { initSync } from "@biomejs/wasm-web";
import biomeWasm from "@biomejs/wasm-web/biome_wasm_bg.wasm" with {
  type: "file",
};
import { EXIT_CODE } from "../constants.ts";
import { runToolCommand } from "./_tool.ts";

interface Finding {
  line: number;
  column: number;
  category: string;
  severity: string;
  message: string;
}

type LintFile = (filePath: string, fileText: string) => Finding[];

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** 1-based line and column (in UTF-16 code units) of a UTF-8 byte offset. */
function position(
  bytes: Uint8Array,
  offset: number,
): { line: number; column: number } {
  const before = decoder.decode(bytes.subarray(0, offset));
  const lineStart = before.lastIndexOf("\n") + 1;
  return {
    line: before.split("\n").length,
    column: before.length - lineStart + 1,
  };
}

async function createLinter(): Promise<LintFile> {
  initSync({ module: await Bun.file(biomeWasm).bytes() });
  const biome = new Biome();
  const { projectKey } = biome.openProject();
  biome.applyConfiguration(projectKey, {
    linter: { enabled: true },
    formatter: { enabled: false },
    assist: { enabled: false },
  });
  return (filePath, fileText) => {
    const bytes = encoder.encode(fileText);
    // lintContent also reports assist actions (import sorting, ...) even
    // with assist disabled; they are suggestions, not lint findings.
    return biome.lintContent(projectKey, fileText, { filePath }).diagnostics
      .filter((diagnostic) => !diagnostic.category?.startsWith("assist/"))
      .map((diagnostic) => ({
        ...position(bytes, diagnostic.location.span?.[0] ?? 0),
        category: diagnostic.category ?? "lint",
        severity: diagnostic.severity,
        message: diagnostic.description,
      }))
      .sort((a, b) => a.line - b.line || a.column - b.column);
  };
}

function formatFinding(displayPath: string, finding: Finding): string {
  return `${displayPath}:${finding.line}:${finding.column} ${finding.category}\n` +
    `  ${finding.severity}: ${finding.message}`;
}

/** @internal */
export const _internal = { createLinter, formatFinding };

/**
 * Run the lint command
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @returns Exit code
 */
export async function lintCommand(
  args: string[],
  cwd: string,
): Promise<number> {
  return await runToolCommand(args, cwd, {
    name: "lint",
    async plan({ quiet, discover }) {
      const files = await discover();
      if (!files) return EXIT_CODE.NOT_FOUND;
      const lint = await createLinter();
      let errors = 0;
      let warnings = 0;
      for (const file of files) {
        const display = relative(cwd, file);
        for (const finding of lint(file, await readFile(file, "utf8"))) {
          if (finding.severity === "error" || finding.severity === "fatal") {
            errors++;
          } else {
            warnings++;
          }
          console.error(formatFinding(display, finding));
        }
      }
      if (!quiet) {
        console.log(
          `Checked ${files.length} file(s): ` +
            `${errors} error(s), ${warnings} warning(s)`,
        );
      }
      return errors > 0 ? EXIT_CODE.FAILURE : EXIT_CODE.SUCCESS;
    },
  });
}
