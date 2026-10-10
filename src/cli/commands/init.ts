/**
 * Implementation of the `probitas init` command
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { join } from "@std/path";
import { exists } from "../_fs.ts";
import { getLogger, type LogLevel } from "@logtape/logtape";
import { EXIT_CODE } from "../constants.ts";
import { configureLogging, getVersion, readAsset } from "../utils.ts";
import { mkdir, writeFile } from "node:fs/promises";

const logger = getLogger(["probitas", "cli", "init"]);

/**
 * The `@probitas-test/probitas` version to pin: this binary's, unless it is a
 * build from an unreleased revision (the Nix package), which npm does not have.
 */
function probitasSpecifier(version: string | undefined): string {
  return version === undefined || version.includes("-unstable")
    ? "latest"
    : version;
}

/** @internal */
export const _internal = { probitasSpecifier };

/**
 * Default directory name for probitas files
 */
const DEFAULT_DIRECTORY = "probitas";

/**
 * Files to create during initialization
 *
 * `package.json` pins `@probitas-test/probitas` to this CLI's version: scenarios
 * run against the copy embedded in the binary, and the installed package only
 * supplies editor types, which must match it.
 */
const INIT_FILES: ReadonlyArray<
  { output: string; content: () => Promise<string> }
> = [
  {
    output: "example.probitas.ts",
    content: () => readAsset("example.probitas.ts"),
  },
  { output: "probitas.jsonc", content: () => readAsset("probitas.jsonc") },
  { output: "tsconfig.json", content: () => readAsset("tsconfig.json") },
  {
    output: "package.json",
    content: async () =>
      JSON.stringify(
        {
          private: true,
          type: "module",
          devDependencies: {
            "@probitas-test/probitas": probitasSpecifier(await getVersion()),
            // Scenarios use Node.js APIs (process.env, node:fs, ...), which
            // the embedded Bun implements at the level of Node.js 24.
            "@types/node": "^24",
          },
        },
        null,
        2,
      ) + "\n",
  },
];

/**
 * Execute the init command
 *
 * Creates a probitas directory with example scenario and config files.
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @returns Exit code (0 = success, 1 = failure, 2 = usage error)
 *
 * @requires --allow-read Permission to read asset files
 * @requires --allow-write Permission to write scenario and config files
 */
export async function initCommand(
  args: string[],
  cwd: string,
): Promise<number> {
  try {
    // Parse command-line arguments
    const parsed = parseArgs(args, {
      string: ["directory"],
      boolean: ["help", "force", "quiet", "verbose", "debug"],
      alias: {
        h: "help",
        d: "directory",
        f: "force",
        v: "verbose",
        q: "quiet",
      },
      default: {
        directory: DEFAULT_DIRECTORY,
      },
    });

    // Show help if requested
    if (parsed.help) {
      try {
        const helpText = await readAsset("usage-init.txt");
        console.log(helpText);
        return EXIT_CODE.SUCCESS;
      } catch (error) {
        // Use console.error here since logging is not yet configured
        console.error(
          "Error reading help file:",
          error instanceof Error ? error.message : String(error),
        );
        return EXIT_CODE.USAGE_ERROR;
      }
    }

    // Determine log level
    const logLevel: LogLevel = parsed.debug
      ? "debug"
      : parsed.verbose
      ? "info"
      : parsed.quiet
      ? "fatal"
      : "warning";

    // Configure logging with determined log level
    try {
      await configureLogging(logLevel);
      logger.debug("Init command started", { args, cwd, logLevel });
    } catch {
      // Silently ignore logging configuration errors (e.g., in test environments)
    }

    const directory = parsed.directory as string;
    const targetDir = join(cwd, directory);
    const force = parsed.force;

    logger.info("Initializing probitas", { targetDir, force });

    // Check if directory already exists
    if (await exists(targetDir)) {
      if (!force) {
        // Check if any files would be overwritten
        const existingFiles: string[] = [];
        for (const file of INIT_FILES) {
          const filePath = join(targetDir, file.output);
          if (await exists(filePath)) {
            existingFiles.push(file.output);
          }
        }

        if (existingFiles.length > 0) {
          console.error(
            `Error: Files already exist in '${directory}/': ${
              existingFiles.join(", ")
            }`,
          );
          console.error("Use --force to overwrite existing files");
          return EXIT_CODE.FAILURE;
        }
      }
    } else {
      // Create directory
      await mkdir(targetDir, { recursive: true });
      logger.debug("Created directory", { targetDir });
    }

    // Create files
    const createdFiles: string[] = [];
    for (const file of INIT_FILES) {
      const content = await file.content();
      const filePath = join(targetDir, file.output);

      await writeFile(filePath, content);
      createdFiles.push(`${directory}/${file.output}`);
      logger.debug("Created file", { filePath });
    }

    // Output success message
    console.log("Initialized probitas project:");
    for (const file of createdFiles) {
      console.log(`  ${file}`);
    }
    console.log("");
    console.log("Run 'probitas run' to execute scenarios.");

    logger.info("Init completed", { createdFiles });

    return EXIT_CODE.SUCCESS;
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    logger.error("Unexpected error in init command", { error: err });
    console.error(`Error: ${m}`);
    return EXIT_CODE.FAILURE;
  }
}
