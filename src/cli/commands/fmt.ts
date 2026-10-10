/**
 * Format command for Probitas CLI
 *
 * Formats discovered scenario files with dprint's TypeScript plugin and its
 * Deno preset, which is what `deno fmt` runs, so scenarios keep the
 * formatting of Probitas 1.x. The plugin's Wasm module is embedded in the
 * binary: nothing is downloaded and no project configuration is read.
 *
 * @module
 */

import { readFile, writeFile } from "node:fs/promises";
import { relative } from "node:path";
import { createFromBuffer } from "@dprint/formatter";
import pluginWasm from "@dprint/typescript/plugin.wasm" with { type: "file" };
import { EXIT_CODE } from "../constants.ts";
import { runToolCommand } from "./_tool.ts";

type FormatTypeScript = (filePath: string, fileText: string) => string;

async function createTypeScriptFormatter(): Promise<FormatTypeScript> {
  const formatter = createFromBuffer(await Bun.file(pluginWasm).bytes());
  formatter.setConfig({}, { deno: true });
  return (filePath, fileText) => formatter.formatText({ filePath, fileText });
}

/** @internal */
export const _internal = { createTypeScriptFormatter };

/**
 * Run the fmt command
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @returns Exit code
 */
export async function fmtCommand(
  args: string[],
  cwd: string,
): Promise<number> {
  return await runToolCommand(args, cwd, {
    name: "fmt",
    flags: ["check"],
    async plan({ flags, quiet, discover }) {
      const files = await discover();
      if (!files) return EXIT_CODE.NOT_FOUND;
      const format = await createTypeScriptFormatter();
      const changed: string[] = [];
      let failed = false;
      for (const file of files) {
        const display = relative(cwd, file);
        try {
          const text = await readFile(file, "utf8");
          const formatted = format(file, text);
          if (formatted === text) continue;
          changed.push(display);
          if (!flags.check) await writeFile(file, formatted);
        } catch (err: unknown) {
          failed = true;
          const m = err instanceof Error ? err.message : String(err);
          console.error(`Error formatting ${display}: ${m}`);
        }
      }
      if (flags.check) {
        for (const file of changed) console.error(`Not formatted: ${file}`);
        if (!quiet) {
          console.log(`Checked ${files.length} file(s)`);
        }
        return failed || changed.length > 0
          ? EXIT_CODE.FAILURE
          : EXIT_CODE.SUCCESS;
      }
      if (!quiet) {
        console.log(
          `Formatted ${changed.length} of ${files.length} file(s)`,
        );
      }
      return failed ? EXIT_CODE.FAILURE : EXIT_CODE.SUCCESS;
    },
  });
}
