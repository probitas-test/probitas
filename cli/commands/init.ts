/**
 * Implementation of the `probitas init` command
 *
 * @module
 */

import { parseArgs } from "@std/cli";
import { resolve } from "@std/path";
import { EXIT_CODE } from "../constants.ts";
import { getVersion, readAsset, readTemplate } from "../utils.ts";

/**
 * Options for the init command
 */
export interface InitCommandOptions {
  force?: boolean;
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
  try {
    // Parse command-line arguments
    const parsed = parseArgs(args, {
      boolean: ["help", "force"],
      alias: {
        h: "help",
        f: "force",
      },
    });

    // Show help if requested
    if (parsed.help) {
      try {
        const helpText = await readAsset("usage-init.txt");
        console.log(helpText);
        return EXIT_CODE.SUCCESS;
      } catch (err: unknown) {
        const m = err instanceof Error ? err.message : String(err);
        console.error(`Error reading help file: ${m}`);
        return EXIT_CODE.USAGE_ERROR;
      }
    }

    const options: InitCommandOptions = {
      force: parsed.force,
    };

    // Create probitas.config.ts
    const configPath = resolve(cwd, "probitas.config.ts");
    const configContent = await readTemplate("probitas.config.ts");

    if (!options.force) {
      try {
        await Deno.stat(configPath);
        console.error(
          "probitas.config.ts already exists. Use --force to overwrite.",
        );
        return EXIT_CODE.USAGE_ERROR;
      } catch {
        // File doesn't exist, continue
      }
    }

    await Deno.writeTextFile(configPath, configContent);
    console.log("Created probitas.config.ts");

    // Create scenarios directory
    const scenariosDir = resolve(cwd, "scenarios");
    await Deno.mkdir(scenariosDir, { recursive: true });

    // Create scenarios/deno.jsonc
    const denoJsoncPath = resolve(scenariosDir, "deno.jsonc");
    const version = await getVersion();
    const denoJsoncContent = (await readTemplate("deno.jsonc"))
      .replace("{{VERSION}}", version);

    if (!options.force) {
      try {
        await Deno.stat(denoJsoncPath);
        console.error(
          "scenarios/deno.jsonc already exists. Use --force to overwrite.",
        );
        return EXIT_CODE.USAGE_ERROR;
      } catch {
        // File doesn't exist, continue
      }
    }

    await Deno.writeTextFile(denoJsoncPath, denoJsoncContent);
    console.log("Created scenarios/deno.jsonc");

    // Create scenarios/example.scenario.ts
    const examplePath = resolve(scenariosDir, "example.scenario.ts");
    const exampleContent = await readTemplate("example.scenario.ts");

    if (!options.force) {
      try {
        await Deno.stat(examplePath);
        console.error(
          "scenarios/example.scenario.ts already exists. Use --force to overwrite.",
        );
        return EXIT_CODE.USAGE_ERROR;
      } catch {
        // File doesn't exist, continue
      }
    }

    await Deno.writeTextFile(examplePath, exampleContent);
    console.log("Created scenarios/example.scenario.ts");

    console.log(
      "\nInitialization complete! Run 'probitas run' to execute the example scenario.",
    );

    return EXIT_CODE.SUCCESS;
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    console.error(`Unexpected error: ${m}`);
    return EXIT_CODE.USAGE_ERROR;
  }
}
