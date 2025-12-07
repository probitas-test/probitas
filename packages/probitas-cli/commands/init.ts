/**
 * Implementation of the `probitas init` command
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import * as colors from "@std/fmt/colors";
import { parse as parseJsonc } from "@std/jsonc";
import { resolve } from "@std/path";
import { outdent } from "@cspotcode/outdent";
import { applyEdits, modify } from "jsonc-parser";
import { configureLogging, getLogger, type LogLevel } from "@probitas/logger";
import { EXIT_CODE } from "../constants.ts";
import {
  findDenoConfigFile,
  getVersion,
  readAsset,
  readTemplate,
} from "../utils.ts";
import expectedConfigTemplate from "../assets/templates/deno.json" with {
  type: "json",
};

const logger = getLogger("probitas", "cli", "init");

/** Formatting options for jsonc-parser */
const FORMATTING_OPTIONS = {
  tabSize: 2,
  insertSpaces: true,
  eol: "\n",
};

/**
 * Display user-friendly error message with resolution guidance
 */
function displayError(
  title: string,
  detail: string,
  resolution: string,
): void {
  detail = detail.split("\n").map((v) => `  ${v}`).join("\n");
  console.log(colors.red(`Error: ${title}`));
  console.log();
  console.log(colors.white(detail));
  console.log();
  console.log(colors.blue(resolution));
}

/**
 * Display error for existing probitas configuration
 */
function displayProbitasExistsError(configPath: string, version: string): void {
  displayError(
    "Probitas is already configured",
    outdent`
    Found existing "probitas" section in ${configPath}.
    Running init again would overwrite your current configuration.
    `,
    outdent`
      To fix this, either:

      1. Use --force to overwrite:

        $ probitas init --force

      2. Or edit ${configPath} manually:

        {
          ...
          "imports": {
            ...
            "probitas": "jsr:@probitas/probitas${version}"
          },
          "probitas": {
            "includes": ["probitas/**/*.probitas.ts"]
          }
        }
    `,
  );
}

/**
 * Display error for existing example file
 */
function displayExampleExistsError(): void {
  displayError(
    "Example file already exists",
    "probitas/example.probitas.ts already exists.",
    outdent`
      To fix this, either:

        1. Use --force to overwrite:

          $ probitas init --force

        2. Or delete the file manually:

          $ rm probitas/example.probitas.ts
    `,
  );
}

/**
 * Display error for invalid config syntax
 */
function displayInvalidSyntaxError(
  configPath: string,
  errorMessage: string,
): void {
  displayError(
    "Invalid configuration file",
    outdent`
      ${configPath} has a syntax error.
      ${errorMessage}
    `,
    `To fix: Fix the syntax error in ${configPath} and try again.`,
  );
}

/**
 * Display error for invalid imports section
 */
function displayInvalidImportsError(
  configPath: string,
  errorMessage: string,
): void {
  displayError(
    "Invalid imports section",
    outdent`
      The "imports" section in ${configPath} is not valid.
      ${errorMessage}
    `,
    `To fix: Ensure "imports" is an object with string values.`,
  );
}

/**
 * Execute the init command
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @returns Exit code (0 = success, 2 = usage error)
 *
 * @requires --allow-write Permission to write config and scenario files
 */
export async function initCommand(
  args: string[],
  cwd: string,
): Promise<number> {
  // Parse command-line arguments
  const parsed = parseArgs(args, {
    boolean: ["help", "force", "quiet", "verbose", "debug"],
    alias: {
      h: "help",
      f: "force",
      v: "verbose",
      q: "quiet",
      d: "debug",
    },
  });

  // Show help if requested
  if (parsed.help) {
    try {
      const helpText = await readAsset("usage-init.txt");
      console.log(helpText);
      return EXIT_CODE.SUCCESS;
    } catch (error) {
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

  const force = parsed.force ?? false;
  const version = await getVersion();
  const versionSpec = version ? `@^${version}` : "";

  // Prepare expected config values
  const probitasImport = expectedConfigTemplate.imports.probitas.replaceAll(
    "{{VERSION}}",
    versionSpec,
  );

  // Find existing deno.json/deno.jsonc
  const existingPath = await findDenoConfigFile(cwd);

  if (!existingPath) {
    // No deno.json exists - create new deno.json
    const denoJsonPath = resolve(cwd, "deno.json");
    const newConfig = {
      imports: {
        probitas: probitasImport,
      },
      probitas: expectedConfigTemplate.probitas,
    };
    await Deno.writeTextFile(
      denoJsonPath,
      JSON.stringify(newConfig, null, 2) + "\n",
    );
    logger.debug("Created deno.json", { path: denoJsonPath });
    console.log("Created deno.json", denoJsonPath);
  } else {
    // deno.json or deno.jsonc exists - use edit-based modification
    const content = await Deno.readTextFile(existingPath);
    const fileName = existingPath.split("/").pop() ?? existingPath;

    // Parse to validate and check existing config
    let existing: Record<string, unknown>;
    try {
      const parsed = parseJsonc(content);
      if (
        typeof parsed !== "object" || parsed === null || Array.isArray(parsed)
      ) {
        displayInvalidSyntaxError(fileName, "Config must be an object.");
        return EXIT_CODE.USAGE_ERROR;
      }
      existing = parsed as Record<string, unknown>;
    } catch (err) {
      logger.info("Failed to parse config file", {
        path: existingPath,
        error: err,
      });
      const m = err instanceof Error ? err.message : String(err);
      displayInvalidSyntaxError(fileName, m);
      return EXIT_CODE.USAGE_ERROR;
    }

    // Check if probitas section already exists
    if (existing.probitas && !force) {
      logger.info("Probitas configuration already exists", {
        path: existingPath,
      });
      displayProbitasExistsError(fileName, versionSpec);
      return EXIT_CODE.USAGE_ERROR;
    }

    // Validate imports section if it exists
    if (existing.imports !== undefined) {
      if (
        typeof existing.imports !== "object" ||
        existing.imports === null ||
        Array.isArray(existing.imports)
      ) {
        logger.info("Invalid imports attribute", { path: existingPath });
        displayInvalidImportsError(fileName, "imports must be an object.");
        return EXIT_CODE.USAGE_ERROR;
      }
      // Check all values are strings
      for (const [key, value] of Object.entries(existing.imports)) {
        if (typeof value !== "string") {
          logger.info("Invalid imports value", {
            path: existingPath,
            key,
            value,
          });
          displayInvalidImportsError(
            fileName,
            `Value for "${key}" must be a string.`,
          );
          return EXIT_CODE.USAGE_ERROR;
        }
      }
    }

    // Apply edits using jsonc-parser to preserve comments
    let updatedContent = content;

    // Add imports.probitas if not exists
    const imports = existing.imports as Record<string, string> | undefined;
    if (!imports?.probitas) {
      const edits = modify(
        updatedContent,
        ["imports", "probitas"],
        probitasImport,
        { formattingOptions: FORMATTING_OPTIONS },
      );
      updatedContent = applyEdits(updatedContent, edits);
    }

    // Add or replace probitas section
    const edits = modify(
      updatedContent,
      ["probitas"],
      expectedConfigTemplate.probitas,
      { formattingOptions: FORMATTING_OPTIONS },
    );
    updatedContent = applyEdits(updatedContent, edits);

    await Deno.writeTextFile(existingPath, updatedContent);
    logger.debug("Updated config file", { path: existingPath });
    console.log(`Updated ${fileName}`);
  }

  // Create probitas directory
  const probitasDir = resolve(cwd, "probitas");
  await Deno.mkdir(probitasDir, { recursive: true });
  logger.debug("Created probitas directory", { path: probitasDir });

  // Create probitas/example.probitas.ts
  const examplePath = resolve(probitasDir, "example.probitas.ts");

  if (!force) {
    try {
      await Deno.stat(examplePath);
      logger.info("Example scenario already exists", { path: examplePath });
      displayExampleExistsError();
      return EXIT_CODE.USAGE_ERROR;
    } catch {
      // File doesn't exist, continue
    }
  }

  const exampleContent = await readTemplate("example.probitas.ts.tpl");
  await Deno.writeTextFile(examplePath, exampleContent);
  logger.debug("Created example scenario", { path: examplePath });
  console.log("Created example scenario", examplePath);

  console.log(
    "\nInitialization complete! Run 'probitas run' to execute the example scenario.",
  );

  logger.debug("Initialization completed successfully");

  return EXIT_CODE.SUCCESS;
}
